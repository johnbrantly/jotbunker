import { defineConfig } from 'vitest/config'
import path from 'path'

const sharedAlias = {
  '@jotbunker/shared': path.resolve(__dirname, 'packages/shared/src'),
}

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'shared',
          include: ['packages/shared/__tests__/**/*.test.ts'],
          environment: 'node',
        },
        resolve: { alias: sharedAlias },
      },
      {
        test: {
          name: 'mobile',
          include: ['packages/mobile/__tests__/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['packages/mobile/__tests__/setup.ts'],
        },
        resolve: { alias: sharedAlias },
      },
      {
        test: {
          name: 'desktop',
          include: ['packages/desktop/__tests__/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['packages/desktop/__tests__/setup.ts'],
        },
        resolve: { alias: sharedAlias },
      },
    ],
  },
})
