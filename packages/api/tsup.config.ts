import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "trpc/index": "src/trpc/index.ts",
  },
  format: ["cjs", "esm"],
  // Skip DTS bundling - Prisma's generated types use 'import =' syntax
  // which tsup's DTS rollup plugin doesn't support
  dts: false,
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ["@gameview/database", "@clerk/nextjs", "@clerk/nextjs/server"],
});
