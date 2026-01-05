const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ensure workspace packages are properly transpiled
  transpilePackages: ["@gameview/api", "@gameview/database", "@gameview/ui", "@gameview/types"],

  experimental: {
    // External packages that should not be bundled into serverless functions
    // This is required for Prisma to work correctly in Vercel serverless
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },

  // Explicitly include Prisma engine files in serverless functions
  outputFileTracingIncludes: {
    "/*": [path.join(__dirname, "../../packages/database/generated/client/**/*")],
  },

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

