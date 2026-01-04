/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // External packages that should not be bundled into serverless functions
  // This is required for Prisma to work correctly in Vercel serverless
  serverExternalPackages: ["@prisma/client", "prisma"],

  // Ensure workspace packages are properly transpiled
  transpilePackages: ["@gameview/api", "@gameview/database", "@gameview/ui", "@gameview/types"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;

