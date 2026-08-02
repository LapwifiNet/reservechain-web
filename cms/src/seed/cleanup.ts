import "dotenv/config";
import payload from "payload";
import { resolvePayloadSecret } from "../secret";

// One-off cleanup: drop seeded passports → records → programs so the D2-aligned
// seed can recreate them without the "already exists — skipping" path.
const run = async (): Promise<void> => {
  await payload.init({ secret: resolvePayloadSecret(), local: true });
  for (const c of ["passports", "asset-records", "asset-programs"]) {
    const { docs } = await payload.find({ collection: c, limit: 500 });
    for (const d of docs) await payload.delete({ collection: c, id: d.id });
    payload.logger.info(`cleaned ${docs.length} ${c}`);
  }
  process.exit(0);
};
void run();
