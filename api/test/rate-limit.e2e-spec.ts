import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import * as bcryptjs from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Rate limiting (ThrottlerGuard)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const passwordHash = await bcryptjs.hash('throttle-test-pass', 10);
    await prisma.adminUser.upsert({
      where: { email: 'throttle-test@example.local' },
      create: { email: 'throttle-test@example.local', passwordHash, role: 'ADMIN' },
      update: { passwordHash },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('blocks the 6th consecutive failed login attempt within the window with HTTP 429', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'throttle-test@example.local', password: 'wrong-password' })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'throttle-test@example.local', password: 'wrong-password' })
      .expect(429);
  });

  it('does not throttle GET /api/health', async () => {
    for (let i = 0; i < 8; i++) {
      await request(app.getHttpServer()).get('/api/health').expect(200);
    }
  });
});
