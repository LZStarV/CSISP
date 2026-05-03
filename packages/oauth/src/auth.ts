import { getOAuthClient } from './client';
import { config as oauthConfig } from './config';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';
import {
  setStorageItem,
  getStorageItem,
  removeStorageItem,
} from './store/storage';
import { OAuthLoginOptions } from './types';

const STORAGE_KEY_VERIFIER = 'oauth_code_verifier';
const STORAGE_KEY_STATE = 'oauth_state';
const STORAGE_KEY_REDIRECT_AFTER_LOGIN = 'oauth_redirect_after_login';

/**
 * 发起 OAuth 登录流程
 */
export async function initiateOAuthLogin(
  options: OAuthLoginOptions
): Promise<void> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = crypto.randomUUID();

  await setStorageItem(STORAGE_KEY_VERIFIER, codeVerifier);
  await setStorageItem(STORAGE_KEY_STATE, state);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    scope: options.scopes ?? 'openid email profile',
  });

  const authorizeUrl = `${oauthConfig.supabase.url}/auth/v1/oauth/authorize?${params}`;
  window.location.href = authorizeUrl;
}

/**
 * 处理 OAuth 回调
 */
export async function handleOAuthCallback(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      return { ok: false, error: params.get('error_description') ?? error };
    }

    if (!code || !state) {
      return { ok: false, error: 'Missing code or state' };
    }

    const savedState = await getStorageItem<string>(STORAGE_KEY_STATE);
    if (state !== savedState) {
      return { ok: false, error: 'State mismatch' };
    }

    const codeVerifier = await getStorageItem<string>(STORAGE_KEY_VERIFIER);
    if (!codeVerifier) {
      return { ok: false, error: 'Missing code verifier' };
    }

    // 使用 Supabase 的 exchangeCodeForSession 交换 code 为 session
    const supabase = getOAuthClient();
    const { error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      return { ok: false, error: sessionError.message };
    }

    await removeStorageItem(STORAGE_KEY_VERIFIER);
    await removeStorageItem(STORAGE_KEY_STATE);

    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}

/**
 * 设置登录后要重定向的路径
 */
export async function setRedirectAfterLogin(path: string): Promise<void> {
  await setStorageItem(STORAGE_KEY_REDIRECT_AFTER_LOGIN, path);
}

/**
 * 获取并清除登录后要重定向的路径
 */
export async function consumeRedirectAfterLogin(): Promise<string | null> {
  const path = await getStorageItem<string>(STORAGE_KEY_REDIRECT_AFTER_LOGIN);
  if (path) {
    await removeStorageItem(STORAGE_KEY_REDIRECT_AFTER_LOGIN);
  }
  return path;
}
