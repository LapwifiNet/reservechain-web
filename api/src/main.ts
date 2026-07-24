import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Validate SERVICE_API_TOKEN if set
  const serviceApiToken = process.env.SERVICE_API_TOKEN;
  if (serviceApiToken && serviceApiToken.length < 32) {
    throw new Error(
      'SERVICE_API_TOKEN must be at least 32 characters long if set',
    );
  }

  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`ReserveChain API listening on :${port}/api`);
}

bootstrap();
