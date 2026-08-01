import fs from 'node:fs';
import path from 'node:path';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options';

export interface OpenApiParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: OpenApiSchema;
}

export interface OpenApiSchema {
  type?: string;
  format?: string;
  description?: string;
  enum?: unknown[];
  items?: OpenApiSchema;
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
  $ref?: string;
  allOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  nullable?: boolean;
  additionalProperties?: boolean | OpenApiSchema;
  [key: string]: unknown;
}

export interface OpenApiOperation {
  operationId: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters: OpenApiParameter[];
  requestBody?: {
    required?: boolean;
    description?: string;
    contentType?: string;
    schema?: OpenApiSchema;
  };
  responses: {
    status: string;
    description?: string;
    schema?: OpenApiSchema;
  }[];
  deprecated?: boolean;
}

export interface OpenApiDoc {
  title: string;
  version: string;
  description?: string;
  servers: { url: string; description?: string }[];
  tags: string[];
  operations: OpenApiOperation[];
  schemas: Record<string, OpenApiSchema>;
}

interface RawSpec {
  info?: { title?: string; version?: string; description?: string };
  servers?: { url: string; description?: string }[];
  paths?: Record<string, Record<string, unknown>>;
  components?: { schemas?: Record<string, OpenApiSchema> };
  tags?: { name: string }[];
}

const METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

function resolveOpenApiPath(): string {
  const candidates = [
    path.join(process.cwd(), '..', '..', 'vendor', 'openapi', 'fluxer-api.json'),
    path.join(process.cwd(), 'vendor', 'openapi', 'fluxer-api.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0]!;
}

function deref(
  schema: OpenApiSchema | undefined,
  schemas: Record<string, OpenApiSchema>,
): OpenApiSchema | undefined {
  if (!schema) return undefined;
  if (schema.$ref) {
    const name = schema.$ref.replace('#/components/schemas/', '');
    return schemas[name] ?? schema;
  }
  return schema;
}

function collectParams(
  pathItem: Record<string, unknown>,
  op: Record<string, unknown>,
): OpenApiParameter[] {
  const raw = [
    ...((pathItem.parameters as OpenApiParameter[] | undefined) ?? []),
    ...((op.parameters as OpenApiParameter[] | undefined) ?? []),
  ];
  return raw.map((p) => ({
    name: p.name,
    in: p.in,
    required: p.required,
    description: p.description,
    schema: p.schema,
  }));
}

let cached: OpenApiDoc | null = null;

export function loadOpenApi(): OpenApiDoc {
  if (cached) return cached;
  const file = resolveOpenApiPath();
  if (!fs.existsSync(file)) {
    return {
      title: 'Fluxer API',
      version: '1.0.0',
      servers: [],
      tags: [],
      operations: [],
      schemas: {},
    };
  }

  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as RawSpec;
  const schemas = raw.components?.schemas ?? {};
  const operations: OpenApiOperation[] = [];
  const tagSet = new Set<string>((raw.tags ?? []).map((t) => t.name));

  for (const [apiPath, pathItem] of Object.entries(raw.paths ?? {})) {
    for (const method of METHODS) {
      const op = pathItem[method] as Record<string, unknown> | undefined;
      if (!op || typeof op !== 'object') continue;

      const tags = (op.tags as string[] | undefined) ?? ['Other'];
      for (const t of tags) tagSet.add(t);

      const requestBody = op.requestBody as
        | {
            required?: boolean;
            description?: string;
            content?: Record<string, { schema?: OpenApiSchema }>;
          }
        | undefined;

      let body: OpenApiOperation['requestBody'];
      if (requestBody?.content) {
        const [contentType, media] = Object.entries(requestBody.content)[0] ?? [];
        body = {
          required: requestBody.required,
          description: requestBody.description,
          contentType,
          schema: deref(media?.schema, schemas),
        };
      }

      const responsesRaw =
        (op.responses as Record<
          string,
          { description?: string; content?: Record<string, { schema?: OpenApiSchema }> }
        >) ?? {};
      const responses = Object.entries(responsesRaw).map(([status, res]) => {
        const media = res.content ? Object.values(res.content)[0] : undefined;
        return {
          status,
          description: res.description,
          schema: deref(media?.schema, schemas),
        };
      });

      const operationId =
        (op.operationId as string | undefined) ??
        `${method}_${apiPath.replace(/[^\w]+/g, '_')}`.replace(/^_+|_+$/g, '');

      operations.push({
        operationId,
        method,
        path: apiPath,
        summary: op.summary as string | undefined,
        description: op.description as string | undefined,
        tags,
        parameters: collectParams(pathItem, op),
        requestBody: body,
        responses,
        deprecated: Boolean(op.deprecated),
      });
    }
  }

  operations.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  cached = {
    title: raw.info?.title ?? 'Fluxer API',
    version: raw.info?.version ?? '1.0.0',
    description: raw.info?.description,
    servers: raw.servers ?? [],
    tags: Array.from(tagSet).sort(),
    operations,
    schemas,
  };
  return cached;
}

export function getOperation(operationId: string): OpenApiOperation | undefined {
  return loadOpenApi().operations.find((o) => o.operationId === operationId);
}

export function getOperationsByTag(): Record<string, OpenApiOperation[]> {
  const grouped: Record<string, OpenApiOperation[]> = {};
  for (const op of loadOpenApi().operations) {
    const tag = op.tags[0] ?? 'Other';
    (grouped[tag] ??= []).push(op);
  }
  return grouped;
}

export function schemaRefName(schema?: OpenApiSchema): string | null {
  if (!schema?.$ref) return null;
  return schema.$ref.replace('#/components/schemas/', '');
}
