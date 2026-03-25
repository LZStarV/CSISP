import { config } from '@config';
import { Injectable } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class GotrueService {
  private readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(config.supabase.url, config.supabase.anonKey, {
      auth: { persistSession: false, detectSessionInUrl: false },
      db: { schema: 'public' },
    });
  }

  // 登录
  // @param params 登录参数
  // @returns 登录结果
  // @throws 登录失败时抛出异常
  async signInWithPassword(params: {
    email: string;
    password: string;
  }): Promise<void> {
    const { error } = await this.client.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });
    if (error) {
      throw error;
    }
  }

  // 登录
  // @param params 登录参数
  // @returns 登录结果
  // @throws 登录失败时抛出异常
  async signInWithOtp(params: { email: string }): Promise<void> {
    const { error } = await this.client.auth.signInWithOtp({
      email: params.email,
    });
    if (error) {
      throw error;
    }
  }

  // 验证 OTP
  // @param params 验证 OTP 参数
  // @returns 验证 OTP 结果
  // @throws 验证 OTP 失败时抛出异常
  async verifyOtp(params: {
    email: string;
    token: string;
    type: 'email' | 'signup';
  }): Promise<void> {
    const { error } = await this.client.auth.verifyOtp({
      email: params.email,
      token: params.token,
      type: params.type,
    });
    if (error) {
      throw error;
    }
  }

  // 注册
  // @param params 注册参数
  // @returns 注册结果
  // @throws 注册失败时抛出异常
  async signUp(params: {
    email: string;
    password: string;
    data?: Record<string, any>;
    emailRedirectTo?: string;
  }): Promise<void> {
    const { error } = await this.client.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: params.data,
        emailRedirectTo: params.emailRedirectTo,
      },
    });
    if (error) {
      throw error;
    }
  }

  // 发送注册 OTP
  // @param params 发送注册 OTP 参数
  // @returns 发送注册 OTP 结果
  // @throws 发送注册 OTP 失败时抛出异常
  async resendSignupOtp(params: { email: string }): Promise<void> {
    const { error } = await this.client.auth.resend({
      type: 'signup',
      email: params.email,
    });
    if (error) {
      throw error;
    }
  }
}
