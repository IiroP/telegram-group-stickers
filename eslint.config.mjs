import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/*", "**/dist/*"] },
  pluginJs.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  { rules: { "no-console": ["warn", { allow: ["error", "info"] }] } },
);
