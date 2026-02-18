/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable server actions
  experimental: {
    serverActions: {
      enabled: true,
    },
  },
}

module.exports = nextConfig
