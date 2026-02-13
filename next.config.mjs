/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@resvg/resvg-js'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
