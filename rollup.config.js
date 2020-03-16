import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

export default {
  input: "src/index.js",
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {})
  ],
  output: [
    {
      file: pkg.main, // CommonJS (for Node) (for bundlers) build.
      format: "cjs"
    },
    {
      file: pkg.module, // ES module (for bundlers) build.
      format: "es"
    }
  ],
  plugins: [
    json(),
    terser({ mangle: false })
  ]
};
