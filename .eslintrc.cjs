
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },

  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:jsdoc/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  overrides: [
    {
      files: ["client/**/*.js", "client/**/*.jsx"],
      env: {
        browser: true,
        es2022: true,
      },
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        MouseEvent: "readonly",
        alert: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
      },
    },
    {
      files: ["server/**/*.js"],
      env: {
        node: true,
        es2022: true,
      },
    },
  ],
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    requireConfigFile: false,
    babelOptions: {
      presets: ["@babel/preset-react"]
    },
    ecmaFeatures: {
      jsx: true,
      modules: true
    }
  },
  plugins: ["react", "react-hooks", "jsdoc"],
  settings: {
    react: {
      version: "detect",
    },
    jsdoc: {
      mode: "jsdoc",
      tagNamePreference: {
        returns: "returns"
      },
    },
  },
  rules: {
    // React rules
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off", // Props are documented with JSDoc
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    
    // General rules
    "no-unused-vars": ["warn", { 
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_"
    }],
    "no-console": ["warn", { allow: ["warn", "error"] }],
    
    // JSDoc rules
    "jsdoc/require-jsdoc": ["warn", {
      "publicOnly": true,
      "require": {
        "FunctionDeclaration": true,
        "MethodDefinition": true,
        "ClassDeclaration": true,
        "ArrowFunctionExpression": true,
        "FunctionExpression": true
      },
      "contexts": [
        "ExportDefaultDeclaration",
        "ExportNamedDeclaration"
      ]
    }],
    "jsdoc/require-param": "warn",
    "jsdoc/require-param-type": "warn",
    "jsdoc/require-param-description": "warn",
    "jsdoc/require-returns": "warn",
    "jsdoc/require-returns-type": "warn",
    "jsdoc/require-returns-description": "warn",
    "jsdoc/valid-types": "warn",
  },
};
