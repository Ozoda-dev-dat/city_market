const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    ignores: ["dist/**/*", "node_modules/**/*", "build/**/*", "**/*.config.js"],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // React Native globals
        React: 'readonly',
        ReactNative: 'readonly',
        Expo: 'readonly',
        __DEV__: 'readonly',
        
        // Browser/Web globals (for web platform)
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        WebSocket: 'readonly',
        EventSource: 'readonly',
        Worker: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        FocusEvent: 'readonly',
        
        // Node.js globals (for server code)
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        
        // TypeScript/Node types
        NodeJS: 'readonly',
        
        // React Navigation
        router: 'readonly',
        useNavigation: 'readonly',
        useRoute: 'readonly',
        
        // Expo specific
        AsyncStorage: 'readonly',
        apiRequest: 'readonly',
        
        // React Native specific
        Alert: 'readonly',
        Linking: 'readonly',
        Platform: 'readonly',
        Dimensions: 'readonly',
        PixelRatio: 'readonly',
        StatusBar: 'readonly',
        Keyboard: 'readonly',
        NetInfo: 'readonly',
      },
    },
    rules: {
      // Basic ESLint rules
      'no-unused-vars': 'off', // Handled by TypeScript
      'no-console': 'warn',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
      'no-undef': 'warn',
      'no-unreachable': 'warn',
      'no-useless-concat': 'warn',
      'no-useless-return': 'warn',
      'no-constant-condition': 'warn',
      'no-empty': 'warn',
      'no-extra-boolean-cast': 'warn',
      'no-ex-assign': 'warn',
      'no-func-assign': 'warn',
      'no-inner-declarations': 'warn',
      'no-invalid-regexp': 'warn',
      'no-irregular-whitespace': 'warn',
      'no-obj-calls': 'warn',
      'no-sparse-arrays': 'warn',
      'no-unsafe-negation': 'warn',
      'valid-typeof': 'warn',
      
      // Best practices
      'eqeqeq': 'warn',
      'no-eval': 'warn',
      'no-implied-eval': 'warn',
      'no-new-func': 'warn',
      'no-script-url': 'warn',
      'no-self-compare': 'warn',
      'no-sequences': 'warn',
      'no-throw-literal': 'warn',
      'no-unmodified-loop-condition': 'warn',
      'no-unused-expressions': 'warn',
      'no-useless-call': 'warn',
      'no-useless-constructor': 'warn',
      'no-void': 'warn',
      'radix': 'warn',
      'wrap-iife': 'warn',
      'yoda': 'warn',
    },
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
      globals: {
        // React Native globals
        React: 'readonly',
        ReactNative: 'readonly',
        Expo: 'readonly',
        __DEV__: 'readonly',
        
        // Browser/Web globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        WebSocket: 'readonly',
        EventSource: 'readonly',
        Worker: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        ResizeObserver: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        FocusEvent: 'readonly',
        
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        
        // TypeScript/Node types
        NodeJS: 'readonly',
        
        // React Navigation
        router: 'readonly',
        useNavigation: 'readonly',
        useRoute: 'readonly',
        
        // Expo specific
        AsyncStorage: 'readonly',
        apiRequest: 'readonly',
        
        // React Native specific
        Alert: 'readonly',
        Linking: 'readonly',
        Platform: 'readonly',
        Dimensions: 'readonly',
        PixelRatio: 'readonly',
        StatusBar: 'readonly',
        Keyboard: 'readonly',
        NetInfo: 'readonly',
      },
    },
    rules: {
      // JavaScript specific rules
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'warn',
      'no-console': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
    },
  },
  {
    // Test file overrides
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/*.test.jsx'],
    rules: {
      'no-unused-vars': 'off',
      'no-console': 'off',
      'no-debugger': 'off',
      'no-undef': 'warn',
    },
  },
  {
    // Config file overrides
    files: ['**/*.config.js', '**/*.config.ts'],
    rules: {
      'no-unused-vars': 'off',
      'no-console': 'off',
      'no-undef': 'warn',
    },
  },
  {
    // Server file overrides
    files: ['server/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'warn',
    },
  },
  {
    // Component file overrides
    files: ['src/components/**/*.tsx', 'app/**/*.tsx'],
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'warn',
      'no-console': 'warn',
      'prefer-const': 'warn',
      'no-var': 'warn',
    },
  },
]);
