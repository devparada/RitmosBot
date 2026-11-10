import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["src/**/*.ts", "src/**/*.js"],
    format: ["esm"],
    unbundle: true,
    clean: true,
    shims: true,
    outDir: "dist",
    target: "node24",
    fixedExtensions: false,
});
