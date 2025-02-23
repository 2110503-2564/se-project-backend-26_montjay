import pluginJs from "@eslint/js";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
  pluginJs.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      ecmaVersion: 2023,
      globals: {
        ...globals.node,
        process: true,
        __dirname: true,
        require: true,
      },
    },
    rules: {
      //   Possible Problems
      "no-unused-vars": [
        "warn",
        {
          vars: "all",
          args: "after-used",
          caughtErrors: "all",
          ignoreRestSiblings: false,
          reportUsedIgnorePattern: false,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-undef": "warn",
      "no-console": [
        "warn",
        {
          allow: ["log", "error", "warn"],
        },
      ],

      // Express.js Specific
      "no-process-exit": "warn",
      "handle-callback-err": ["error", "^(err|error)$"],

      // Code Style
      quotes: [
        "warn",
        "double",
        {
          avoidEscape: true,
          allowTemplateLiterals: true,
        },
      ],
      "space-before-function-paren": [
        "error",
        {
          anonymous: "always",
          named: "never",
          asyncArrow: "always",
        },
      ],

      // Variables & Functions
      "no-var": "error",
      "prefer-const": [
        "error",
        {
          destructuring: "all",
        },
      ],
      "no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
        },
      ],

      // Best Practices
      curly: ["error", "multi-line"],
      "dot-notation": "error",
      eqeqeq: ["error", "always"],
      "no-multi-spaces": "warn",
      "no-multiple-empty-lines": [
        "warn",
        {
          max: 2,
          maxEOF: 1,
        },
      ],

      // Modern JS Features
      "object-shorthand": ["error", "always"],
      "prefer-template": "error",
      "template-curly-spacing": ["error", "never"],
    },
  },
  {
    ignores: ["node_modules/*", "build/*"],
  },
];
