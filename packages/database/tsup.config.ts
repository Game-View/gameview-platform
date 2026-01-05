import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  // Mark generated client as external - it will be imported at runtime
  external: [/\.\.\/generated\/client/, "@prisma/client", ".prisma/client"],
  noExternal: [],
  clean: true,
});
