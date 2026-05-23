// OAuth 配置和客户端
export { initOAuthClient, getOAuthClient } from './client';
export type { OAuthConfig } from './types';

// OAuth 流程
export {
  initiateOAuthLogin,
  handleOAuthCallback,
  setRedirectAfterLogin,
  consumeRedirectAfterLogin,
} from './auth';
export type { OAuthLoginOptions } from './types';

// 会话和认证管理
export {
  checkAuthStatus,
  getCurrentUser,
  signOut,
  getCurrentSession,
  onAuthStateChange,
} from './session';

// PKCE 工具
export { generateCodeVerifier, generateCodeChallenge } from './pkce';
