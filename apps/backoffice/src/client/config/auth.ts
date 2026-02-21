/**
 * 身份认证相关的客户端配置
 * 使用 getter 延迟读取，避免构建期缺少环境变量导致报错
 */
export const authConfig = {
  get idpLoginUrl(): string {
    const url = process.env.CSISP_IDP_CLIENT_URL;
    return url ? `${url}/login` : '';
  },
};
