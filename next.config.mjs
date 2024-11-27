/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
      type: 'javascript/auto',
    });
    return config;
  },
};

export default nextConfig;
