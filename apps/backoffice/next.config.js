/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@csisp/idl', '@csisp/rpc', '@csisp/utils'],
  env: {
    CSISP_IDP_CLIENT_URL: process.env.CSISP_IDP_CLIENT_URL,
  },
  webpack: config => {
    config.module.rules.push({
      test: /\.js$/,
      include: /dist\/esm/,
      type: 'javascript/auto',
    });
    return config;
  },
};
export default nextConfig;
