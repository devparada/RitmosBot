import js from "@eslint/js";
import globals from "globals";
import parser from "@typescript-eslint/parser";
import pluginTs from "@typescript-eslint/eslint-plugin";
import pluginPrettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier/flat";

const commonGlobals = {
  ...globals.node, // Variables globales de Node.js
  ...globals.jest, // Variables globales de Jest
};

export default [
  js.configs.recommended,

  {
    plugins: { prettier: pluginPrettier },
    rules: {
      "prettier/prettier": "warn",
    },
  },

  // Configuración para archivos TypeScript
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: process.cwd(),
      },
      globals: commonGlobals,
    },
    plugins: {
      "@typescript-eslint": pluginTs,
    },
    rules: {
      ...pluginTs.configs.recommended.rules,
      "prettier/prettier": "warn",
    },
  },

  // Configuración para archivos JavaScript
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: commonGlobals,
    },
    rules: {
      semi: ["warn", "always"],
      quotes: ["warn", "double"],
      "eol-last": ["warn", "always"],
      "comma-dangle": ["warn", "always-multiline"],
      eqeqeq: ["error", "always"],
      "no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }],
      "no-undef": "error",
      "no-trailing-spaces": "warn",
      "prettier/prettier": "warn",
    },
  },

  // Desactivamos cualquier regla de ESLint que choque con Prettier
  configPrettier,

  {
    files: ["eslint.config.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
