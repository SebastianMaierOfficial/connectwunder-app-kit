export type WorkspaceAppScope = 'apps.identity.read' | 'apps.navigation.read' | 'apps.boards.read';
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
  timeoutMs?: number;
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
  logout(request: Request): Promise<Response>;
}
export declare const SESSION_COOKIE: '__Host-cw_app_session';
export declare const FLOW_COOKIE: '__Host-cw_app_flow';
export declare class WorkspaceAppAuthError extends Error { readonly code: string; constructor(code: string); }
export declare function createWorkspaceAppAuth(config: WorkspaceAppAuthConfig): WorkspaceAppAuth;
