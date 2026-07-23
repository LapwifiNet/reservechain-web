import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Asset programs
  const copper = await prisma.assetProgram.upsert({
    where: { code: 'CP' },
    update: {},
    create: {
      code: 'CP',
      name: 'Copper Powder Program',
      metal: 'Copper',
      purity: '99.9999%',
      description:
        'Ultra-high-purity copper powder for electronics, energy and industrial applications.',
      status: 'active',
    },
  });
  const nickel = await prisma.assetProgram.upsert({
    where: { code: 'NW' },
    update: {},
    create: {
      code: 'NW',
      name: 'Nickel Wire Program',
      metal: 'Nickel',
      purity: '99.9807%',
      description:
        'High-purity nickel wire for batteries, aerospace, electronics and specialised industrial applications.',
      status: 'active',
    },
  });

  // Asset records
  const records = [
    { assetId: 'RC-CP-2024-0001', programId: copper.id, batch: 'CP-BATCH-0001', weightKg: 25 },
    { assetId: 'RC-CP-2024-0002', programId: copper.id, batch: 'CP-BATCH-0002', weightKg: 25 },
    { assetId: 'RC-NW-2024-0001', programId: nickel.id, batch: 'NW-COIL-0001', weightKg: 10 },
  ];
  for (const r of records) {
    await prisma.assetRecord.upsert({ where: { assetId: r.assetId }, update: {}, create: r });
  }

  // A sample issued passport
  const cp1 = await prisma.assetRecord.findUnique({ where: { assetId: 'RC-CP-2024-0001' } });
  if (cp1) {
    await prisma.passport.upsert({
      where: { passportId: 'RC-CP-2024-0001' },
      update: {},
      create: {
        passportId: 'RC-CP-2024-0001',
        assetRecordId: cp1.id,
        template: 'Illustrative',
        purity: '99.9999%',
        status: 'issued',
        issuedAt: new Date(),
      },
    });
  }

  // Waitlist sample (illustrative)
  const waitlist = [
    { fullName: 'Institutional Desk', email: 'desk@example-institution.com', investorType: 'institution' },
    { fullName: 'Private Investor', email: 'investor@example.com', investorType: 'investor' },
    { fullName: 'Strategic Partner', email: 'partner@example-partner.com', investorType: 'partner' },
  ];
  for (const w of waitlist) {
    await prisma.waitlistEntry.upsert({
      where: { email: w.email },
      update: {},
      create: { ...w, consent: true },
    });
  }

  // Tokenomics (illustrative — not final)
  await prisma.tokenomicsConfig.upsert({
    where: { key: 'default' },
    update: {},
    create: {
      key: 'default',
      data: {
        symbol: 'RCM',
        capIllustrative: '100000000',
        reserveRatio: '1:1',
        transferFee: '0',
        allocations: [
          { bucket: 'Reserve-backed circulating', pct: 60 },
          { bucket: 'Treasury', pct: 20 },
          { bucket: 'Ecosystem & operations', pct: 12 },
          { bucket: 'Team (vested)', pct: 8 },
        ],
        note: 'Illustrative — not final. Requires written authorization from the issuer.',
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete: programs, records, passport, waitlist, tokenomics.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
