import globals from "globals";
import pluginJs from "@eslint/js";


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
    rules: {
      // Requiere punto y coma al final de cada línea
      semi: ["warn", "always"],

      // Usa comillas dobles en lugar de simples para cadenas de texto
      "quotes": ["warn", "double"],

      // Asegura que haya una línea en blanco al final de cada archivo
      "eol-last": ["error", "always"],

      // Exige coma final en objetos y arrays multilínea para facilitar ediciones futuras
      "comma-dangle": ["warn", "always-multiline"],

      // Obliga el uso de === y !== para evitar conversiones implícitas de tipo
      "eqeqeq": ["error", "always"],

      // Advierte sobre variables definidas pero no utilizadas, ignorando argumentos no usados
      "no-unused-vars": ["warn", { "args": "none", "ignoreRestSiblings": true }],

      // Prohíbe el uso de variables no definidas para prevenir errores
      "no-undef": "error",

      // Prohíbe espacios en blanco innecesarios al final de las líneas
      "no-trailing-spaces": "error",

      // Exige espacios consistentes antes y después de las flechas en funciones flecha
      "arrow-spacing": ["error", { "before": true, "after": true }],

      // Asegura un espaciado consistente alrededor de los dos puntos en los objetos
      "key-spacing": ["error", { "beforeColon": false, "afterColon": true }],
    },
  },
];
