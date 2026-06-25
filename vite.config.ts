import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// alias should resolve to the *src* folder, not the repo root

export default defineConfig({
  resolve: {
    alias: {
      // `@` is used throughout the codebase to mean `src/`
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [react()],
  base: '/DUK/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
})
