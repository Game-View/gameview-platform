/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure workspace packages are properly transpiled
  transpilePackages: ["@gameview/api", "@gameview/database", "@gameview/types"],

  experimental: {
    // External packages that should not be bundled into serverless functions
    // This is required for Prisma to work correctly in Vercel serverless
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

export default nextConfig;
