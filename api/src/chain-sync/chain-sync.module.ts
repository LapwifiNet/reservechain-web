import { Module } from '@nestjs/common';
import { ChainSyncService } from './chain-sync.service';

@Module({ providers: [ChainSyncService] })
export class ChainSyncModule {}
