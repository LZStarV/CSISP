import type {
  AuthEnterRequest,
  AuthForgotChallengeRequest,
  AuthForgotInitRequest,
  AuthForgotVerifyRequest,
  AuthMultifactorRequest,
  CreateExchangeCodeDto,
  LoginInternalDto,
  RegisterDto,
  ResendSignupOtpDto,
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

const mfaTypeSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
const authNextStepSchema = z.number().int().min(0).max(3);
const recoveryUnavailableReasonSchema = z.number().int().min(0).max(4);

const mfaMethodSchema = z.object({
  type: mfaTypeSchema,
  enabled: z.boolean(),
  extra: z.string().nullable().optional(),
});

const nextSchema = z.object({
  nextSteps: z.array(authNextStepSchema),
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
}) satisfies z.ZodType<ResendSignupOtpDto>;

export const resendSignupOtpResponseSchema = z.object({
  ok: z.boolean(),
});

export const loginBodySchema = z.object({
  email: z.string().email().min(5).max(256),
  password: z.string().min(1).max(512),
}) satisfies z.ZodType<LoginInternalDto>;

export const loginResponseSchema = z.object({
  stepUp: z.string().optional(),
  nextSteps: z.array(z.string()).optional(),
});

export const sendOtpResponseSchema = z.object({
  ok: z.boolean(),
});

export const verifyOtpBodySchema = z.object({
  token: z.string().min(1).max(512),
}) satisfies z.ZodType<VerifyOtpDto>;

export const verifyOtpResponseSchema = z.object({
  verified: z.boolean(),
});

export const createExchangeCodeBodySchema = z.object({
  app_id: z.string().min(1).max(128),
  redirect_uri: z.string().min(1).max(512),
  state: z.string().min(1).max(512).optional(),
}) satisfies z.ZodType<CreateExchangeCodeDto>;

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

export const multifactorBodySchema = z.object({
  type: mfaTypeSchema,
  codeOrAssertion: z.string().min(1).max(512),
}) satisfies z.ZodType<AuthMultifactorRequest>;

export const enterBodySchema = z.object({
  ticket: z.string().min(1).max(128),
  state: z.string().min(1).max(512).optional(),
}) satisfies z.ZodType<AuthEnterRequest>;

export const mfaMethodsResponseSchema = z.object({
  multifactor: z.array(mfaMethodSchema),
});

export const forgotInitBodySchema = z.object({
  email: z.string().email(),
}) satisfies z.ZodType<AuthForgotInitRequest>;

export const forgotInitResponseSchema = z.object({
  student_id: z.string(),
  name: z.string().nullable().optional(),
  methods: z.array(
    z.object({
      type: mfaTypeSchema,
      enabled: z.boolean(),
      extra: z.string().nullable().optional(),
      reason: recoveryUnavailableReasonSchema.nullable().optional(),
    })
  ),
});

export const forgotChallengeBodySchema = z.object({
  type: z.string().min(1).max(128),
  studentId: z.string().min(1).max(128),
}) satisfies z.ZodType<AuthForgotChallengeRequest>;

export const forgotVerifyBodySchema = z.object({
  type: z.string().min(1).max(128),
  studentId: z.string().min(1).max(128),
  code: z.string().min(1).max(128),
}) satisfies z.ZodType<AuthForgotVerifyRequest>;

export const forgotVerifyResponseSchema = z.object({
  ok: z.boolean(),
  reset_token: z.string().optional(),
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
  multifactor: {
    method: HTTP_METHOD.POST,
    path: '/multifactor',
    body: multifactorBodySchema,
    responses: { 200: nextSchema },
    summary: '多因子认证',
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
  mfaMethods: {
    method: HTTP_METHOD.POST,
    path: '/mfa_methods',
    body: z.object({}).optional(),
    responses: { 200: mfaMethodsResponseSchema },
    summary: '获取 MFA 方法',
  },
  forgotInit: {
    method: HTTP_METHOD.POST,
    path: '/forgot_init',
    body: forgotInitBodySchema,
    responses: { 200: forgotInitResponseSchema },
    summary: '忘记密码初始化',
  },
  forgotChallenge: {
    method: HTTP_METHOD.POST,
    path: '/forgot_challenge',
    body: forgotChallengeBodySchema,
    responses: { 200: nextSchema },
    summary: '忘记密码挑战',
  },
  forgotVerify: {
    method: HTTP_METHOD.POST,
    path: '/forgot_verify',
    body: forgotVerifyBodySchema,
    responses: { 200: forgotVerifyResponseSchema },
    summary: '忘记密码验证',
  },
} as const satisfies Parameters<typeof c.router>[0];

export const idpClientAuthContract = c.router(idpClientAuthRoutes, {
  pathPrefix: IDP_CLIENT_AUTH_PATH_PREFIX,
  strictStatusCodes: true,
});

export const IDP_CLIENT_AUTH_ACTION =
  buildActionMapFromRoutes(idpClientAuthRoutes);
