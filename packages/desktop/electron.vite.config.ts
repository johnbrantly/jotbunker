import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const sharedAlias = {
  '@jotbunker/shared': resolve(__dirname, '../shared/src')
}

export default defineConfig({
  main: {
    resolve: { alias: sharedAlias },
    plugins: [externalizeDepsPlugin({ exclude: ['@jotbunker/shared'] })]
  },
  preload: {
    resolve: { alias: sharedAlias },
    plugins: [externalizeDepsPlugin({ exclude: ['@jotbunker/shared'] })]
  },
  renderer: {
    resolve: { alias: sharedAlias },
    plugins: [react()]
  }
})
