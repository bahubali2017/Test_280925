const js = require('@eslint/js');
const react = require('eslint-plugin-react');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const jsdoc = require('eslint-plugin-jsdoc');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: require('@babel/eslint-parser'),
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
    plugins: {
      react,
      jsxA11y,
      jsdoc,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['error', { 
        'varsIgnorePattern': 'React|Switch|Route|Redirect|Router|QueryClientProvider|AuthProvider|ProtectedRoute|ChatPage|ChevronRight|MoreHorizontal|ChevronDown|ChevronUp|Search|CheckIcon|ChevronsUpDown|Circle|X|Plus|Minus|Slot|Check|Button|Input|MessageBubble|SocialLoginButton|FcGoogle|FaMicrosoft|FaApple|OTPInput|OTPInputContext|Dot|Dialog|DialogContent|Label|LabelPrimitive|Controller|DayPicker|ChevronLeft|ArrowLeft|ArrowRight|Link|GripVertical|PanelLeft|Separator|Sheet|SheetContent|SheetDescription|SheetHeader|SheetTitle|SheetTrigger|Toast|ToastClose|ToastDescription|ToastProvider|ToastTitle|ToastViewport|App|Skeleton|Tooltip|TooltipContent|TooltipProvider|TooltipTrigger|Comp',
        'argsIgnorePattern': '^_' 
      }],
      'jsdoc/require-jsdoc': ['warn', {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: true,
          FunctionExpression: true,
        },
        contexts: [
          'ExportDefaultDeclaration',
          'ExportNamedDeclaration',
        ],
      }],
      'jsdoc/require-param': 'warn',
      'jsdoc/require-returns': 'warn',
      'jsdoc/check-tag-names': 'warn',
      'jsdoc/check-types': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
