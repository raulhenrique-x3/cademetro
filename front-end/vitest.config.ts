import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

import path from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.test.ts'],
  },
  define: {
    __DEV__: true,
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'expo-location': path.resolve(__dirname, 'tests/mocks/expo-location.ts'),
      'expo-secure-store': path.resolve(
        __dirname,
        'tests/mocks/expo-secure-store.ts',
      ),
      'react-native-google-mobile-ads': path.resolve(
        __dirname,
        'tests/mocks/react-native-google-mobile-ads.ts',
      ),
    },
  },
});
