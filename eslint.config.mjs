import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Salvaged/aborted build dirs (e.g. `.next-stale-*`, `.next-failed-*`)
    // left behind when a build is interrupted — never lint their output.
    ".next-*/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
    // Cursor/editor config — not our source code.
    ".cursor/**",
    // iCloud conflict copies ("foo 2.ts") — junk artifacts, never lint them.
    "**/* [0-9].*",
  ]),
  // Honor the `_` prefix convention for intentionally-unused args/vars (e.g.
  // `(request, _admin) =>` in adminApiHandler routes) so lint flags only real
  // dead code.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
]);

export default eslintConfig;
