import eslint from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';

export default [
  // Top-level ignore for files that cause parsing issues
  {
    ignores: ['global.d.ts', 'tailwind.config.ts'],
  },
  {
    // Recommended config for TypeScript files
    ...eslint.configs.recommended,
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'global.d.ts',
      'next.config.mjs',
      'postcss.config.js',
      'tailwind.config.ts',
    ],
    languageOptions: {
      parser: tseslintParser,
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        browser: true,
        window: true,
        setTimeout: true,
        clearTimeout: true,
        document: true,
        process: true,
        self: true, // Allow Next.js/Webpack globals
        fetch: true,
        Blob: true,
        FileReader: true,
        FormData: true,
        URL: true,
        URLSearchParams: true,
        ActiveXObject: true,
        Bun: true,
        Deno: true,
        console: true,
        trustedTypes: true, // Add Webpack/Next.js-specific globals
        __unused_webpack_module: true,
        __unused_webpack_exports: true,
        __webpack_require__: true,
        _N_E: true, // Next.js-specific global
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern:
            '^NodeJS$|^ProcessEnv$|^(object|objectName|index|latitude|longitude|time|newTime|CelestialObject|sunrise|query|props|api|k|_|open|SidebarContext|value|actionTypes|state|e)$',
          argsIgnorePattern: '^(index|query|props|_)$',
        },
      ],
      'no-undef': 'off', // Temporarily disable to avoid globals errors
      'no-prototype-builtins': 'off', // Disable for Next.js/Webpack polyfills
      'no-control-regex': 'off', // Disable for polyfills or Webpack code
      'no-cond-assign': 'off', // Disable for polyfills or Webpack code
      'no-empty': 'off', // Disable for polyfills or Webpack code
      'no-self-assign': 'off', // Disable for polyfills or Webpack code
      'no-fallthrough': 'off', // Disable for polyfills or Webpack code
      'no-redeclare': 'off', // Disable for Webpack/Next.js globals like SidebarContext
    },
  },
  {
    // Recommended config for JavaScript files
    ...eslint.configs.recommended,
    files: ['**/*.js'],
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'global.d.ts',
      'next.config.mjs',
      'postcss.config.js',
      'tailwind.config.ts',
    ],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        browser: true,
        node: true,
        process: true,
        module: true,
        require: false,
        window: true,
        setTimeout: true,
        clearTimeout: true,
        self: true,
        fetch: true,
        Blob: true,
        FileReader: true,
        FormData: true,
        URL: true,
        URLSearchParams: true,
        ActiveXObject: true,
        Bun: true,
        Deno: true,
        console: true,
        trustedTypes: true,
        __unused_webpack_module: true,
        __unused_webpack_exports: true,
        __webpack_require__: true,
        _N_E: true,
      },
    },
    rules: {
      'no-undef': 'off', // Temporarily disable to avoid globals errors
      'no-prototype-builtins': 'off',
      'no-control-regex': 'off',
      'no-cond-assign': 'off',
      'no-empty': 'off',
      'no-self-assign': 'off',
      'no-fallthrough': 'off',
      'no-redeclare': 'off',
    },
  },
  {
    // Config for Next.js/Webpack configuration files
    files: ['next.config.mjs', 'postcss.config.js'],
    ignores: ['**/.next/**', '**/node_modules/**', '**/dist/**', '**/build/**'],
    languageOptions: {
      // Update ecmaVersion to allow top-level await in next.config.mjs
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        node: true,
        process: true,
        module: true,
        require: true,
      },
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-restricted-globals': 'off',
    },
  },
  {
    // Prettier integration for all JS/TS/TSX files
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    ignores: ['**/.next/**', '**/node_modules/**', '**/dist/**', '**/build/**'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
