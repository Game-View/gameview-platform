const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Ensure workspace packages are properly transpiled
  transpilePackages: ["@gameview/api", "@gameview/database", "@gameview/ui", "@gameview/types"],

  // External packages that should not be bundled into serverless functions
  // This is required for Prisma to work correctly in Vercel serverless
  serverExternalPackages: ["@prisma/client", "prisma"],

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure Prisma client is properly resolved
      config.externals = config.externals || [];
      config.externals.push("@prisma/client");
    }
    return config;
  },

  // Explicitly include Prisma engine files in serverless functions
  // Using broader path patterns to ensure engine binaries are included
  outputFileTracingIncludes: {
    "/*": [
      path.join(__dirname, "../../packages/database/generated/client/**/*"),
      path.join(__dirname, "../../node_modules/.prisma/client/**/*"),
      path.join(__dirname, "../../node_modules/@prisma/client/**/*"),
    ],
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
