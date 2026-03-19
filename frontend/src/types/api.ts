/**
 * API request/response types — aligned with backend Pydantic schemas where applicable.
 */

import type { DashboardState } from './dashboard';

export interface LoginResponse {
  token: string;
  role?: string;
  training?: boolean;
}

export interface AuthVerifyResponse {
  valid: boolean;
  training?: boolean;
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

/** Payload sent to PUT /training/dashboard-state */
export interface DashboardStatePayload {
  data: Partial<DashboardState> & { projectOrder?: string[] };
}
