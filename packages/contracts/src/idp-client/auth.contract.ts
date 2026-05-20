import type {
  AuthEnterRequest,
  LoginInternalDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
  VerifySignupOtpDto,
} from '@csisp-api/bff-idp-server';
import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { buildActionMapFromRoutes } from '../constants/action';
import { HTTP_METHOD } from '../constants/http';
import { IDP_CLIENT_AUTH_PATH_PREFIX } from '../constants/path-prefix';

const c = initContract();

export const registerBodySchema = z.object({
  email: z.string().email().min(5).max(256),
  password: z.string().min(1).max(512),
  student_id: z.string().regex(/^\d{10,12}$/),
  display_name: z.string().min(1).max(128).optional(),
  redirect_uri: z.string().min(1).max(512).optional(),
}) satisfies z.ZodType<RegisterDto>;

export const registerResponseSchema = z.object({
  ok: z.boolean(),
  next: z.string(),
  emailRedirectTo: z.string(),
});

export const verifySignupOtpBodySchema = z.object({
  email: z.string().email(),
  token: z.string().min(1).max(128),
}) satisfies z.ZodType<VerifySignupOtpDto>;

export const verifySignupOtpResponseSchema = z.object({
  verified: z.boolean(),
});

export const resendSignupOtpBodySchema = z.object({
  email: z.string().email(),
});

export const resendSignupOtpResponseSchema = z.object({
  ok: z.boolean(),
});

export const loginBodySchema = z.object({
  student_id: z.string().regex(/^\d{10,14}$/),
  password: z.string().min(1).max(512),
}) satisfies z.ZodType<LoginInternalDto>;

export const loginResponseSchema = z.object({
  stepUp: z.string().optional(),
  nextSteps: z.array(z.string()).optional(),
});

export const sendOtpResponseSchema = z.object({
  ok: z.boolean(),
});

export const resendLoginOtpResponseSchema = z.object({
  ok: z.boolean(),
});

export const verifyOtpBodySchema = z.object({
  token: z.string().min(1).max(512),
  tempToken: z.string().min(1).max(512),
}) satisfies z.ZodType<VerifyOtpDto>;

export const verifyOtpResponseSchema = z.object({
  verified: z.boolean(),
});

export const createExchangeCodeBodySchema = z.object({
  app_id: z.string().min(1).max(128),
  redirect_uri: z.string().min(1).max(512),
  state: z.string().min(1).max(512).optional(),
});

export const createExchangeCodeResponseSchema = z.object({
  code: z.string(),
  redirect_uri: z.string(),
  state: z.string().optional(),
});

export const resetPasswordBodySchema = z.object({
  studentId: z.string().min(1).max(128),
  newPassword: z.string().min(6).max(512),
  resetToken: z.string().min(1).max(512),
  reason: z
    .enum(['WeakPassword', 'Compromised', 'UserRequest', 'Other'])
    .optional(),
}) satisfies z.ZodType<ResetPasswordDto>;

export const enterBodySchema = z.object({
  ticket: z.string().min(1).max(128),
  state: z.string().min(1).max(512).optional(),
}) satisfies z.ZodType<AuthEnterRequest>;

const nextSchema = z.object({
  nextSteps: z.array(z.number().int().min(0).max(3)),
  sms: z
    .object({
      code: z.string(),
      success: z.boolean(),
      message: z.string().optional(),
      request_id: z.string().optional(),
      access_denied_detail: z.string().optional(),
    })
    .optional(),
  redirectTo: z.string().optional(),
});

const idpClientAuthRoutes = {
  login: {
    method: HTTP_METHOD.POST,
    path: '/login',
    body: loginBodySchema,
    responses: { 200: loginResponseSchema },
    summary: '登录',
  },
  register: {
    method: HTTP_METHOD.POST,
    path: '/register',
    body: registerBodySchema,
    responses: { 200: registerResponseSchema },
    summary: '注册',
  },
  verifySignupOtp: {
    method: HTTP_METHOD.POST,
    path: '/verifySignupOtp',
    body: verifySignupOtpBodySchema,
    responses: { 200: verifySignupOtpResponseSchema },
    summary: '校验注册 OTP',
  },
  resendSignupOtp: {
    method: HTTP_METHOD.POST,
    path: '/resendSignupOtp',
    body: resendSignupOtpBodySchema,
    responses: { 200: resendSignupOtpResponseSchema },
    summary: '重发注册 OTP',
  },
  sendOtp: {
    method: HTTP_METHOD.POST,
    path: '/send-otp',
    body: z.object({}).optional(),
    responses: { 200: sendOtpResponseSchema },
    summary: '发送 OTP',
  },
  resendLoginOtp: {
    method: HTTP_METHOD.POST,
    path: '/resendLoginOtp',
    body: z.object({}).optional(),
    responses: { 200: resendLoginOtpResponseSchema },
    summary: '重发登录 OTP',
  },
  verifyOtp: {
    method: HTTP_METHOD.POST,
    path: '/verify-otp',
    body: verifyOtpBodySchema,
    responses: { 200: verifyOtpResponseSchema },
    summary: '校验 OTP',
  },
  createExchangeCode: {
    method: HTTP_METHOD.POST,
    path: '/createExchangeCode',
    body: createExchangeCodeBodySchema,
    responses: { 200: createExchangeCodeResponseSchema },
    summary: '创建交换码',
  },
  resetPassword: {
    method: HTTP_METHOD.POST,
    path: '/reset_password',
    body: resetPasswordBodySchema,
    responses: { 200: nextSchema },
    summary: '重置密码',
  },
  enter: {
    method: HTTP_METHOD.POST,
    path: '/enter',
    body: enterBodySchema,
    responses: { 200: nextSchema },
    summary: '进入流程',
  },
} as const satisfies Parameters<typeof c.router>[0];

export const idpClientAuthContract = c.router(idpClientAuthRoutes, {
  pathPrefix: IDP_CLIENT_AUTH_PATH_PREFIX,
  strictStatusCodes: true,
});

export const IDP_CLIENT_AUTH_ACTION =
  buildActionMapFromRoutes(idpClientAuthRoutes);
