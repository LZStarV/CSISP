/**
 * 身份认证相关的客户端配置
 */
const idpClientUrl = process.env.CSISP_IDP_CLIENT_URL;
if (!idpClientUrl) {
  throw new Error('Missing environment variable: CSISP_IDP_CLIENT_URL');
}
export const authConfig = {
  /**
   * IdP 登录页地址
   */
  idpLoginUrl: `${idpClientUrl}/login`,
};
