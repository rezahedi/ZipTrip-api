import globals from "globals";
import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginPrettier from "eslint-plugin-prettier";
import configPrettier from "eslint-config-prettier";

export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    // Include the recommended configuration directly, no need for 'extends'
    rules: js.configs.recommended.rules,
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { react: pluginReact },
    rules: pluginReact.configs.flat.recommended.rules,
  },
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { prettier: pluginPrettier },
    rules: {
      ...configPrettier.rules, // Disable conflicting ESLint rules
      "prettier/prettier": "error", // Treat Prettier formatting issues as ESLint errors
    },
  },
];