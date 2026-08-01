import { ValidationPipe, type INestApplication } from '@nestjs/common';

/**
 * The application-level configuration that shapes the HTTP surface.
 *
 * Shared by `main.ts` and the OpenAPI generator so the document cannot
 * describe different URLs from the ones the server serves. The generator got
 * this wrong on its first run: without the global prefix every path in the
 * document was missing `/api`, which a generated client would have used
 * verbatim.
 */
export function configureHttpSurface(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
