/**
 * 客户端登录入口配置
 * 用于从 IdP 门户跳转到各子系统的登录页面，以确保 PKCE 流程的安全性
 */
const backofficeUrl = import.meta.env.CSISP_BACKOFFICE_URL;
const adminUrl = import.meta.env.CSISP_FRONTEND_ADMIN_URL;
if (!backofficeUrl) {
  throw new Error('Missing environment variable: CSISP_BACKOFFICE_URL');
}
if (!adminUrl) {
  throw new Error('Missing environment variable: CSISP_FRONTEND_ADMIN_URL');
}
export const CLIENT_LOGIN_URLS: Record<string, string> = {
  // 管理后台 (Next.js)
  backoffice: `${backofficeUrl}/login`,

  // 教学平台/管理门户 (BFF + Vite)
  'csisp-bff': `${adminUrl}/login`,

  // 如果有其他系统，可以在此继续添加
};
