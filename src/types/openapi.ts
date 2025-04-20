import type { RestMethod } from "@prisma/client";

export interface OpenAPISchema {
  type?: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  $ref?: string;
  [key: string]: unknown;
}

export interface OpenAPIParameter {
  name: string;
  in: string;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: OpenAPISchema;
  examples?: Record<string, unknown>;
}

export interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, unknown>;
}

export interface OpenAPIResponse {
  description?: string;
  content?: Record<string, unknown>;
  headers?: Record<string, unknown>;
}

export interface OpenAPIOperation {
  description?: string;
  deprecated?: boolean;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses?: Record<string, OpenAPIResponse>;
}

export interface OpenAPIPathItem {
  description?: string;
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  options?: OpenAPIOperation;
  head?: OpenAPIOperation;
  trace?: OpenAPIOperation;
}

export interface OpenAPIInfo {
  title?: string;
  description?: string;
  version?: string;
}

export interface OpenAPIDocument {
  openapi: string;
  info: OpenAPIInfo;
  paths: Record<string, OpenAPIPathItem>;
  components?: {
    schemas?: Record<string, OpenAPISchema>;
  };
}

// Helper type for HTTP methods
export type HTTPMethod = Uppercase<RestMethod>;
