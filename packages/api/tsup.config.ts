import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "trpc/index": "src/trpc/index.ts",
  },
  format: ["cjs", "esm"],
  // Generate DTS but don't bundle/resolve external types
  // This avoids the Prisma 'import =' syntax issue
  dts: {
    resolve: false,
  },
  clean: true,
  splitting: false,
  sourcemap: true,
  external: ["@gameview/database", "@clerk/nextjs", "@clerk/nextjs/server"],
});
