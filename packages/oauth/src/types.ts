export interface OAuthConfig {
  supabaseUrl: string;
  publishableKey: string;
}

export interface OAuthLoginOptions {
  clientId: string;
  redirectUri: string;
  scopes?: string;
}
