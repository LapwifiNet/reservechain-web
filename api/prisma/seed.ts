import { PrismaClient } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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
        symbol: 'ORWA',
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

  // Admin users
  // Refuse to seed admin users in production
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.log('Skipping admin user seed in production environment');
  } else {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || generateRandomPassword();
    const compliancePassword = process.env.SEED_COMPLIANCE_PASSWORD || generateRandomPassword();
    const viewerPassword = process.env.SEED_VIEWER_PASSWORD || generateRandomPassword();

    // Print generated passwords if they were not provided via environment
    if (!process.env.SEED_ADMIN_PASSWORD) {
      // eslint-disable-next-line no-console
      console.log(`Generated admin password: ${adminPassword}`);
    }
    if (!process.env.SEED_COMPLIANCE_PASSWORD) {
      // eslint-disable-next-line no-console
      console.log(`Generated compliance password: ${compliancePassword}`);
    }
    if (!process.env.SEED_VIEWER_PASSWORD) {
      // eslint-disable-next-line no-console
      console.log(`Generated viewer password: ${viewerPassword}`);
    }

    const adminPasswordHash = await bcryptjs.hash(adminPassword, 10);
    const compliancePasswordHash = await bcryptjs.hash(compliancePassword, 10);
    const viewerPasswordHash = await bcryptjs.hash(viewerPassword, 10);

    await prisma.adminUser.upsert({
      where: { email: 'admin@openrwa.local' },
      update: {},
      create: {
        email: 'admin@openrwa.local',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
      },
    });

    await prisma.adminUser.upsert({
      where: { email: 'compliance@openrwa.local' },
      update: {},
      create: {
        email: 'compliance@openrwa.local',
        passwordHash: compliancePasswordHash,
        role: 'COMPLIANCE',
      },
    });

    await prisma.adminUser.upsert({
      where: { email: 'viewer@openrwa.local' },
      update: {},
      create: {
        email: 'viewer@openrwa.local',
        passwordHash: viewerPasswordHash,
        role: 'VIEWER',
      },
    });
  }

  // KYC cases (illustrative)
  const kycCases = [
    {
      subjectType: 'person',
      legalName: 'Illustrative Person A',
      country: 'US',
      status: 'pending',
      riskLevel: 'low',
      notes: 'Illustrative — not a real case',
    },
    {
      subjectType: 'entity',
      legalName: 'Illustrative Corp B',
      country: 'SG',
      status: 'in_review',
      riskLevel: 'medium',
      notes: 'Illustrative — not a real case',
    },
    {
      subjectType: 'person',
      legalName: 'Illustrative Person C',
      country: 'GB',
      status: 'approved',
      riskLevel: 'low',
      notes: 'Illustrative — not a real case',
    },
  ];
  for (const kyc of kycCases) {
    await prisma.kycCase.upsert({
      where: { id: 'kyc-' + kyc.legalName.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: 'kyc-' + kyc.legalName.toLowerCase().replace(/\s+/g, '-'),
        ...kyc,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete: programs, records, passport, waitlist, tokenomics, admin users, KYC cases.');
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
