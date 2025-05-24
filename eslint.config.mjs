import globals from "globals";
import pluginJs from "@eslint/js";
import pluginPrettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier/flat";

/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,

  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node, // Variables globales de Node.js
        ...globals.jest, // Variables globales de Jest
      },
    },
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      semi: ["warn", "always"], // Requiere punto y coma al final
      quotes: ["warn", "double"], // Usa comillas dobles en lugar de simples para cadenas de texto
      "eol-last": ["warn", "always"], // Asegura que haya una línea en blanco al final de cada archivo
      "comma-dangle": ["warn", "always-multiline"], // Exige coma final en objetos y arrays multilínea para facilitar ediciones futuras
      eqeqeq: ["error", "always"], // Obliga el uso de === y !== para evitar conversiones implícitas de tipo
      "no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }], // Advierte sobre variables definidas pero no utilizadas
      "no-undef": "error", // Prohíbe el uso de variables no definidas para prevenir errores
      "no-trailing-spaces": "warn", // Asegura que no haya espacios en blanco innecesarios al final de las líneas
    },
  },

  // Desactivamos cualquier regla de ESLint que choque con Prettier
  configPrettier,
];
