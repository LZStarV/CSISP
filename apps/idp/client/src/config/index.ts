/**
 * 客户端登录入口配置
 * 用于从 IdP 门户跳转到各子系统的登录页面，以确保 PKCE 流程的安全性
 */
export const CLIENT_LOGIN_URLS: Record<string, string> = {
  // 管理后台 (Next.js)
  backoffice: 'http://localhost:3000/login',

  // 教学平台/管理门户 (BFF + Vite)
  'csisp-bff': 'http://localhost:5173/login',

  // 如果有其他系统，可以在此继续添加
};
