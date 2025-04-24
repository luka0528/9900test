// types/api-tester.ts
export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  time: number;
  size: number;
}

export interface KeyValue {
  key: string;
  value: string;
  enabled: boolean;
  id: string;
}

export interface ApiRoute {
  method: HttpMethod;
  route: string;
  description?: string;
  version: string;
}
