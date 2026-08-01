import type { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { buildOpenApiDocument } from './document';

/**
 * Mounts the schema browser at `/api/docs` — only when `API_DOCS_ENABLED` is
 * the exact string `true`.
 *
 * **Unset, or any other value, mounts nothing at all.** There is no route: a
 * request to `/api/docs` 404s exactly as it does for any path with no handler.
 * The UI is not mounted-and-403ing, because a 403 confirms the surface exists.
 *
 * Why it is off by default rather than on: an unauthenticated schema browser
 * on an API that carries KYC case management, an audit trail and investor
 * registration is reconnaissance. It enumerates every route, every role
 * requirement, every field name and every validation rule, to anyone who can
 * reach the host — before they need a single credential. The committed
 * `openapi.json` already serves every legitimate consumer (the two generated
 * clients read it from the repository, not over the network), so the running
 * server has no reason to serve it as well.
 *
 * Turn it on deliberately, on a development host, and never on a deployment
 * reachable from the internet.
 */
export function mountApiDocs(app: INestApplication): void {
  if (process.env.API_DOCS_ENABLED !== 'true') return;

  const document = buildOpenApiDocument(app);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: false },
  });

  // eslint-disable-next-line no-console
  console.warn(
    'API_DOCS_ENABLED=true — the OpenAPI schema browser is mounted at /api/docs and is UNAUTHENTICATED. Do not enable this on an internet-reachable deployment.',
  );
}
