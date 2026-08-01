import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Emits the generated API types into `admin/` and `mobile/`.
 *
 * openapi-typescript produces a single dependency-free `.ts` file: no imports,
 * no runtime, nothing to install. That is what lets `mobile/` consume it while
 * staying outside the root workspace and outside the install graph (invariant
 * 54) — the generator is a devDependency of `api/` only, and what lands in
 * `mobile/src/api/` is committed source with no package.json change.
 *
 * The file is generated, so it says so and is excluded from lint. The only
 * correct edit to it is to change the API and regenerate.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCHEMA = join(ROOT, 'api', 'openapi.json');

const TARGETS = [
  join(ROOT, 'admin', 'src', 'lib', 'generated', 'api.ts'),
  join(ROOT, 'mobile', 'src', 'api', 'generated.ts'),
];

const BANNER = `/* eslint-disable */
/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Produced from api/openapi.json by \`npm run clients:generate\` in api/.
 * Editing it makes the client disagree with the API again, which is the exact
 * failure it exists to prevent: 26 hand-transcribed types drifted silently
 * because nothing compared them to anything.
 *
 * To change a type here, change the API's DTO or response class, run
 * \`npm run openapi:generate\` then \`npm run clients:generate\` in api/, and
 * commit all three files together.
 */
`;

const generated = execFileSync(
  process.execPath,
  [join(ROOT, 'api', 'node_modules', 'openapi-typescript', 'bin', 'cli.js'), SCHEMA],
  { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
);

for (const target of TARGETS) {
  writeFileSync(target, BANNER + generated);
  const lines = readFileSync(target, 'utf8').split('\n').length;
  console.log(`  wrote ${target.slice(ROOT.length + 1)} (${lines} lines)`);
}
