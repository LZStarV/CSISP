import type { Database } from '@csisp/supabase-sdk';

export type UserRow = Database['public']['Tables']['user']['Row'];
export type UserInsert = Database['public']['Tables']['user']['Insert'];
export type UserUpdate = Database['public']['Tables']['user']['Update'];

export type MfaSettingsRow =
  Database['public']['Tables']['mfa_settings']['Row'];
export type MfaSettingsInsert =
  Database['public']['Tables']['mfa_settings']['Insert'];
export type MfaSettingsUpdate =
  Database['public']['Tables']['mfa_settings']['Update'];

export type OidcClientRow = Database['public']['Tables']['oidc_clients']['Row'];
export type OidcClientInsert =
  Database['public']['Tables']['oidc_clients']['Insert'];
export type OidcClientUpdate =
  Database['public']['Tables']['oidc_clients']['Update'];

export type OidcKeyRow = Database['public']['Tables']['oidc_keys']['Row'];
export type OidcKeyInsert = Database['public']['Tables']['oidc_keys']['Insert'];
export type OidcKeyUpdate = Database['public']['Tables']['oidc_keys']['Update'];

export type RefreshTokenRow =
  Database['public']['Tables']['refresh_tokens']['Row'];
export type RefreshTokenInsert =
  Database['public']['Tables']['refresh_tokens']['Insert'];
export type RefreshTokenUpdate =
  Database['public']['Tables']['refresh_tokens']['Update'];
