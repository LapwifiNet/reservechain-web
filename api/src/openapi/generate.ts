import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { configureHttpSurface } from '../app.config';
import { buildOpenApiDocument, serializeOpenApiDocument } from './document';

/**
 * Writes `api/openapi.json`, or with `--check` verifies the committed copy is
 * current and exits non-zero if it is not.
 *
 * Runs in Nest's preview mode: the module graph is built and the controller
 * metadata is read, but no provider is instantiated. That matters because
 * PrismaService connects in `onModuleInit` — without preview mode, regenerating
 * the schema would need a database, and a check that needs a database is a
 * check that gets skipped.
 */
const OUTPUT = join(__dirname, '..', '..', 'openapi.json');

async function main(): Promise<void> {
  const check = process.argv.includes('--check');

  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  configureHttpSurface(app);
  await app.init();
  const serialized = serializeOpenApiDocument(buildOpenApiDocument(app));
  await app.close();

  if (!check) {
    writeFileSync(OUTPUT, serialized);
    // eslint-disable-next-line no-console
    console.log(`openapi.json written (${serialized.length} bytes)`);
    return;
  }

  if (!existsSync(OUTPUT)) {
    // eslint-disable-next-line no-console
    console.error('openapi.json is missing. Run: npm run openapi:generate');
    process.exit(1);
  }

  const committed = readFileSync(OUTPUT, 'utf8');
  if (committed === serialized) {
    // eslint-disable-next-line no-console
    console.log('openapi.json is up to date');
    return;
  }

  // eslint-disable-next-line no-console
  console.error(
    [
      'openapi.json is STALE — the committed document does not match the current routes and DTOs.',
      '',
      'A route, a DTO field or a response type changed without regenerating. The',
      'generated admin and mobile clients are built from this file, so shipping it',
      'stale is how a client goes back to describing an API that no longer exists —',
      'which is the failure this whole mechanism exists to stop.',
      '',
      'Fix: npm run openapi:generate  (then commit api/openapi.json)',
    ].join('\n'),
  );
  process.exit(1);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
