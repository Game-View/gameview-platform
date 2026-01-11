import { defineConfig } from "tsup";

// Build version: 2 - Force rebuild for production router
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "trpc/index": "src/trpc/index.ts",
  },
  format: ["cjs", "esm"],
  // Disable tsup's DTS - use tsc instead (handles Prisma's import= syntax)
  dts: false,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ["@gameview/database", "@clerk/nextjs", "@clerk/nextjs/server"],
});
