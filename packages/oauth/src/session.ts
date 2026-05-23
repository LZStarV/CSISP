import { User } from '@supabase/supabase-js';

import { getOAuthClient } from './client';

/**
 * 检查当前用户是否已认证
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const supabase = getOAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

/**
 * 获取当前认证用户
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getOAuthClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * 登出当前用户
 */
export async function signOut(): Promise<void> {
  const supabase = getOAuthClient();
  await supabase.auth.signOut();
}

/**
 * 获取当前会话
 */
export async function getCurrentSession() {
  const supabase = getOAuthClient();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const supabase = getOAuthClient();
  return supabase.auth.onAuthStateChange(callback);
}
