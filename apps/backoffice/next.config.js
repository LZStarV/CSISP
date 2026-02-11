/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@csisp/idl', '@csisp/rpc', '@csisp/utils'],
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
