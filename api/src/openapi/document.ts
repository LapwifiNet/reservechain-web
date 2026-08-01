import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { INACTIVE_TAG } from '../common/decorators/api-inactive.decorator';

/**
 * Builds the OpenAPI document. The single source for both the committed
 * `openapi.json` and the optional docs UI, so the browsable schema and the
 * generated clients can never describe different APIs.
 *
 * No example values are set anywhere in this file or in the response classes.
 * AGENTS §5.3 applies to documentation as much as to a page: an example
 * certificate number, coverage ratio, wallet address or metals figure is a
 * fabricated claim that gets copied into someone's integration test and then
 * into a screenshot. Callers get types and constraints, not invented data.
 */

const DESCRIPTION = [
  'ReserveChain API.',
  '',
  'IN DEVELOPMENT. No tokens are offered or sold.',
  '',
  'Proof-of-Reserves, redemption, wallet linking and token purchase are',
  'published as a contract only. Every operation tagged `inactive` returns',
  '501 and is marked deprecated so a generated client warns at the call site.',
  'They require written authorization before they do anything.',
  '',
  'No example values are supplied anywhere in this document. Every response',
  'field is described by type and constraint only.',
].join('\n');

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('ReserveChain API')
    .setDescription(DESCRIPTION)
    .setVersion(process.env.npm_package_version ?? '0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Admin domain (typ=admin, JWT_SECRET) on admin routes; investor domain (typ=investor, INVESTOR_JWT_SECRET) on /investor/me and /investor/status. The two are disjoint and neither is accepted by the other.',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // Stable operation ids: `<controller>_<method>` is the default and it
    // changes whenever a class is renamed. `<method>` alone collides.
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });

  return normalize(fixBooleanEnums(markInactiveOperations(document)));
}

/**
 * Every operation tagged `inactive` becomes `deprecated`, and loses any success
 * response the decorators implied.
 *
 * Driven off the tag that `@ApiInactive` applies, not off a list of path
 * prefixes kept here — a second list would be a second source of truth and
 * would silently stop matching the first time a gated route moved.
 */
function markInactiveOperations(document: OpenAPIObject): OpenAPIObject {
  for (const methods of Object.values(document.paths)) {
    for (const operation of Object.values(methods ?? {})) {
      if (typeof operation !== 'object' || operation === null) continue;
      const op = operation as {
        tags?: string[];
        deprecated?: boolean;
        responses?: Record<string, unknown>;
      };
      if (!op.tags?.includes(INACTIVE_TAG)) continue;

      op.deprecated = true;
      // Drop the implied 200/201. An inactive route has no success response,
      // and leaving one there is what makes a generated client look callable.
      const gone = op.responses ?? {};
      op.responses = Object.fromEntries(
        Object.entries(gone).filter(([status]) => !status.startsWith('2')),
      );
    }
  }
  return document;
}

/**
 * Works around @nestjs/swagger typing a boolean enum as a number.
 *
 * `getEnumType()` returns 'number' unless every value is a string, so
 * `@ApiProperty({ enum: [true] })` — the only way to express the waitlist's
 * `@Equals(true)` — emits `{ type: 'number', enum: [true] }`, a schema no
 * validator can satisfy. Setting `type` on the decorator does not help; the
 * enum branch overwrites it.
 *
 * Fixed here rather than at the one call site, because it is a defect in the
 * encoder that applies to any boolean enum, and a fix hidden in a DTO is a fix
 * the next boolean enum will not get.
 */
function fixBooleanEnums<T>(node: T): T {
  if (Array.isArray(node)) {
    node.forEach(fixBooleanEnums);
    return node;
  }
  if (node === null || typeof node !== 'object') return node;
  const schema = node as { enum?: unknown[]; type?: string };
  if (
    Array.isArray(schema.enum) &&
    schema.enum.length > 0 &&
    schema.enum.every((value) => typeof value === 'boolean')
  ) {
    schema.type = 'boolean';
  }
  for (const value of Object.values(node as Record<string, unknown>)) {
    fixBooleanEnums(value);
  }
  return node;
}

/**
 * Deterministic key order, so the committed document only changes when the API
 * changes. Without this the staleness check fails on key ordering that varies
 * between Node versions and tells you nothing.
 */
function normalize<T>(value: T): T {
  if (Array.isArray(value)) return value.map(normalize) as unknown as T;
  if (value !== null && typeof value === 'object') {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = normalize((value as Record<string, unknown>)[key]);
    }
    return sorted as unknown as T;
  }
  return value;
}

/** The exact bytes written to `openapi.json`, so writer and checker agree. */
export function serializeOpenApiDocument(document: OpenAPIObject): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}
