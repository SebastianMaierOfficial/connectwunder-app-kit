export type WorkspaceAppScope = 'apps.identity.read' | 'apps.navigation.read' | 'apps.boards.read' | 'apps.boards.items.create' | 'apps.boards.items.fields.write' | 'apps.boards.notes.create' | 'apps.results.import';
export interface WorkspaceAppAuthConfig {
  appOrigin: string;
  issuer: string;
  resource: string;
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint: string;
  scopes: WorkspaceAppScope[];
  launchPath?: string;
  callbackPath?: string;
  allowedReturnPaths?: string[];
  /** OAuth network budget, 1..10000 ms; defaults to 10000. */
  timeoutMs?: number;
  /** Total withAccessToken callback/refresh/retry budget, 1..60000 ms. Defaults to timeoutMs. */
  operationTimeoutMs?: number;
  sessionMaxAgeSeconds?: number;
  /** Synthetic loopback only. Secure cookies remain mandatory. */
  allowLocalhost?: boolean;
  fetch?: typeof fetch;
  crypto?: Crypto;
  now?: () => number;
}
export interface WorkspaceAppAuth {
  readonly routes: Readonly<{ launchPath: string; callbackPath: string }>;
  launch(request: Request, returnPath?: string): Promise<Response>;
  callback(request: Request): Promise<Response>;
  /** This function and its token argument must remain server-only. */
  withAccessToken(request: Request, useToken: (token: string, signal: AbortSignal) => Response | Promise<Response>): Promise<Response>;
  /** Server-only opt-in one-use candidate: no refresh, retry or cookie mutation on any result. */
  withCandidateAccessTokenOnce(request: Request, useToken: (token: string, signal: AbortSignal) => Response | Promise<Response>): Promise<Response>;
  logout(request: Request): Promise<Response>;
}
export declare const SESSION_COOKIE: '__Host-cw_app_session';
export declare const FLOW_COOKIE: '__Host-cw_app_flow';
export declare class WorkspaceAppAuthError extends Error { readonly code: string; constructor(code: string); }
export declare function createWorkspaceAppAuth(config: WorkspaceAppAuthConfig): WorkspaceAppAuth;
