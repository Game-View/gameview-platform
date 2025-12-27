import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  external: ["@gameview/database", "bullmq", "ioredis", "@supabase/supabase-js"],
  clean: true,
});
