import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import { defineConfig } from 'eslint/config';

export default defineConfig([
    // jsdoc.configs['flat/recommended'],
    // js.configs.recommended,
    {
        files: ['**/*.js'],
        plugins: {
            js,
            jsdoc,
        },
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            camelcase: ['error'],
            /* more rules */
        },
    },
    eslintConfigPrettier,
]);
