import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  external: ["@prisma/client", ".prisma/client"],
  noExternal: [],
  clean: true,
});
