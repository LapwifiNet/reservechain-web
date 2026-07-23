import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';

const TOKEN_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event RedemptionBurn(address indexed from, uint256 amount, bytes32 indexed ref)',
];

const SYNCED_EVENTS = ['Transfer', 'RedemptionBurn'];

@Injectable()
export class ChainSyncService implements OnModuleInit {
  private readonly logger = new Logger(ChainSyncService.name);
  private enabled = false;
  private provider?: ethers.JsonRpcProvider;
  private token?: ethers.Contract;
  private lastBlock = 0;
  private running = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.enabled = this.config.get('CHAIN_SYNC_ENABLED') === 'true';
    if (!this.enabled) {
      this.logger.log('Chain sync disabled (CHAIN_SYNC_ENABLED != true).');
      return;
    }

    const declaredChainId = Number(this.config.get('CHAIN_ID') ?? 11155111);
    if (declaredChainId === 1) {
      this.enabled = false;
      this.logger.error('Mainnet (chainId 1) is blocked. Chain sync disabled.');
      return;
    }

    const rpc = this.config.get<string>('CHAIN_RPC_URL');
    const token = this.config.get<string>('TOKEN_ADDRESS');
    if (!rpc || !token) {
      this.enabled = false;
      this.logger.warn('CHAIN_RPC_URL / TOKEN_ADDRESS missing. Chain sync disabled.');
      return;
    }

    this.provider = new ethers.JsonRpcProvider(rpc);
    const net = await this.provider.getNetwork();
    if (Number(net.chainId) === 1) {
      this.enabled = false;
      this.logger.error('RPC points to Ethereum mainnet. Chain sync blocked.');
      return;
    }

    this.token = new ethers.Contract(token, TOKEN_ABI, this.provider);
    this.lastBlock = Number(this.config.get('CHAIN_SYNC_START_BLOCK') ?? 0);
    this.logger.log(
      `Chain sync enabled on chainId=${net.chainId}, token=${token}, startBlock=${this.lastBlock}`,
    );
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async poll() {
    if (!this.enabled || !this.provider || !this.token || this.running) return;
    this.running = true;
    try {
      const head = await this.provider.getBlockNumber();
      if (head <= this.lastBlock) return;
      const from = this.lastBlock + 1;

      let total = 0;
      for (const name of SYNCED_EVENTS) {
        const logs = await this.token.queryFilter(
          this.token.filters[name](),
          from,
          head,
        );
        for (const log of logs) {
          const args = (log as any).args ?? {};
          const payload = JSON.parse(
            JSON.stringify(args, (_k, v) =>
              typeof v === 'bigint' ? v.toString() : v,
            ),
          );
          await this.prisma.chainEvent.upsert({
            where: {
              txHash_logIndex: {
                txHash: log.transactionHash,
                logIndex: log.index,
              },
            },
            create: {
              txHash: log.transactionHash,
              logIndex: log.index,
              eventName: name,
              blockNumber: log.blockNumber,
              payload,
            },
            update: {},
          });
        }
        total += logs.length;
      }

      this.lastBlock = head;
      this.logger.log(`Synced blocks ${from}..${head} (${total} events).`);
    } catch (e) {
      this.logger.error(`Chain sync poll failed: ${(e as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
