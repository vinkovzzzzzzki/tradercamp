module.exports = {
  ignorePatterns: [
    'src/tests/**'
  ],
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all'
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native'
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'warn',
    'import/no-unresolved': 'off',
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'error',
    'react-native/no-inline-styles': 'off',
    'react-native/no-color-literals': 'off',
    'react-native/sort-styles': 'off',
    '@typescript-eslint/no-require-imports': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
