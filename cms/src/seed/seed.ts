import "dotenv/config";
import payload from "payload";
import { resolvePayloadSecret } from "../secret";
import { DEFAULT_STATE } from "../lib/statusMachine";

/**
 * Generates a random password, matching api/prisma/seed.ts. Used when
 * SEED_ADMIN_PASSWORD is unset so the seed never ships a known credential.
 */
function generateRandomPassword(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Idempotent-ish seed: creates the admin user and the two reference programs
 * (Copper Powder, Nickel Wire) with a record and a published passport each.
 * Values are ILLUSTRATIVE. Run with: `npm run seed`.
 *
 * Follows the api/prisma/seed.ts rules: no hard-coded password, a random one
 * printed once when SEED_ADMIN_PASSWORD is unset, and no user seeding at all
 * in production. Any previously published default credential is revoked;
 * generate a fresh one with: openssl rand -base64 24
 */
const run = async (): Promise<void> => {
  await payload.init({
    secret: resolvePayloadSecret(),
    local: true,
  });

  if (process.env.NODE_ENV === "production") {
    payload.logger.info(
      "Skipping CMS admin user seed in production environment",
    );
  } else {
    const email = process.env.SEED_ADMIN_EMAIL || "cms-admin@example.local";
    const password =
      process.env.SEED_ADMIN_PASSWORD || generateRandomPassword();

    const existing = await payload.find({
      collection: "users",
      where: { email: { equals: email } },
      limit: 1,
    });
    if (existing.docs.length === 0) {
      await payload.create({
        collection: "users",
        data: { email, password, name: "CMS Admin", role: "admin" },
      });
      payload.logger.info(`Created admin user ${email}`);
      if (!process.env.SEED_ADMIN_PASSWORD) {
        payload.logger.info(`Generated CMS admin password: ${password}`);
      }
    } else {
      payload.logger.info(`Admin user ${email} already exists — skipping.`);
    }
  }

  const programs = [
    {
      title: "Copper Powder",
      code: "CP",
      metal: "copper",
      purity: "99.9999%",
      summary: "High-purity copper powder reference program.",
    },
    {
      title: "Nickel Wire",
      code: "NW",
      metal: "nickel",
      purity: "99.9807%",
      summary: "High-purity nickel wire (0.025mm DKRNT NP1) reference program.",
    },
  ] as const;

  for (const p of programs) {
    const dupe = await payload.find({
      collection: "asset-programs",
      where: { code: { equals: p.code } },
      limit: 1,
    });
    if (dupe.docs.length > 0) {
      payload.logger.info(`Program ${p.code} already exists — skipping.`);
      continue;
    }

    const program = await payload.create({
      collection: "asset-programs",
      data: {
        title: p.title,
        code: p.code,
        metal: p.metal,
        purity: p.purity,
        summary: p.summary,
        stage: "illustrative",
        status: "published",
      },
    });

    const record = await payload.create({
      collection: "asset-records",
      data: {
        program: program.id,
        lot: `${p.code}-REF-1`,
        quantity: 1,
        unit: "kg",
        custody: "Bonded warehouse (illustrative)",
      },
    });

    await payload.create({
      collection: "passports",
      data: {
        title: `${p.title} Passport`,
        // The mobile app links /passport/<program slug> from the program
        // detail screen, so the sample passport must share the program's slug.
        slug: program.slug,
        program: program.id,
        records: [record.id],
        highlights: [
          { label: "Metal", value: p.title },
          { label: "Purity", value: p.purity },
        ],
        stage: "illustrative",
        status: "published",
      },
    });

    payload.logger.info(`Seeded program + record + passport for ${p.code}.`);
  }

  // SC-CMS-SETTINGS (D4/D5): the singleton settings row. Without it every
  // fresh environment silently falls back to env defaults and the website
  // never reads the mode / status chips from the CMS (Notion SC-CMS-SETTINGS
  // traps: "seed script vẫn KHÔNG tạo row `default`").
  const settingsDupe = await payload.find({
    collection: "settings",
    where: { name: { equals: "default" } },
    limit: 1,
  });
  if (settingsDupe.docs.length > 0) {
    payload.logger.info("Settings row `default` already exists — skipping.");
  } else {
    const SITE_MODES = [
      "development",
      "prelaunch",
      "waitlist",
      "documentation",
      "asset-verification",
      "eligibility",
      "early-participation",
      "live-offering",
      "redemption",
      "enterprise-onboarding",
    ] as const;
    const siteMode =
      process.env.SITE_MODE &&
      (SITE_MODES as readonly string[]).includes(process.env.SITE_MODE)
        ? process.env.SITE_MODE
        : "development";
    await payload.create({
      collection: "settings",
      data: {
        name: "default",
        siteMode,
        waitlistOpen: true,
        publicationStatus: DEFAULT_STATE.publication,
        tokenStatus: DEFAULT_STATE.token,
        assetStatus: DEFAULT_STATE.asset,
      },
    });
    payload.logger.info(`Seeded settings row \`default\` (siteMode=${siteMode}).`);
  }

  payload.logger.info("Seed complete.");
  process.exit(0);
};

void run();
