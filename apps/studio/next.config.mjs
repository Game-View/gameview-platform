import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure workspace packages are properly transpiled
  transpilePackages: ["@gameview/api", "@gameview/database", "@gameview/types"],

  experimental: {
    // External packages that should not be bundled into serverless functions
    // This is required for Prisma to work correctly in Vercel serverless
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },

  // Explicitly include Prisma engine files in serverless functions
  outputFileTracingIncludes: {
    "/*": [path.join(__dirname, "../../packages/database/generated/client/**/*")],
  },
};

export default nextConfig;
