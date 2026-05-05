import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { config as oauthConfig } from './config';
import { OAuthConfig } from './types';

let client: SupabaseClient | null = null;

function getDefaultConfig(): OAuthConfig {
  return {
    supabaseUrl: oauthConfig.supabase.url,
    publishableKey: oauthConfig.supabase.anonKey,
  };
}

// 初始化 OAuth 客户端
export function initOAuthClient(config?: OAuthConfig): SupabaseClient {
  if (!client) {
    const finalConfig = config || getDefaultConfig();
    client = createClient(finalConfig.supabaseUrl, finalConfig.publishableKey);
  }
  return client;
}

// 获取 OAuth 客户端
export function getOAuthClient(): SupabaseClient {
  if (!client) {
    throw new Error(
      'OAuth client not initialized. Call initOAuthClient() first.'
    );
  }
  return client;
}
