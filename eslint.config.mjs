import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // three.js scenes mutate refs, buffers and uniforms inside useFrame by design; the compiler-purity
    // rules can't model that, so they're relaxed for the 3D folders only.
    files: ["features/water/**/*.{ts,tsx}", "features/exhibits/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scratch/**",
    // Vendored Draco decoder (three.js), served as-is.
    "public/draco/**",
    ".captures/**",
  ]),
]);

export default eslintConfig;
