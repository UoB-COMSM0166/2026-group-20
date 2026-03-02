import js from "@eslint/js";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc";
import { defineConfig } from "eslint/config";

export default defineConfig([
  jsdoc.configs["flat/recommended"],
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: {
      js,
      jsdoc,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "jsdoc/require-jsdoc": "warn",
      "camelcase": [
        "error",
      ],
      /* more rules */
    }
  },
]);
