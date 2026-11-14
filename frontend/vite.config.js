import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { handleAiProxy } from './server/aiProxy.mjs'

const root = path.dirname(fileURLToPath(import.meta.url))

function ignisAiProxy(env) {
  const apiOrigin = env.IGNIS_API_ORIGIN || 'http://127.0.0.1:8001'
  const nimApiKey = env.IGNIS_NIM_API_KEY
  return {
    name: 'ignis-ai-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleAiProxy(req, res, { apiOrigin, nimApiKey }).then((handled) => {
          if (!handled) next()
        })
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handleAiProxy(req, res, { apiOrigin, nimApiKey }).then((handled) => {
          if (!handled) next()
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '')
  return {
    plugins: [react(), ignisAiProxy(env)],
    resolve: {
      alias: {
        '@': root,
      },
    },
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
    preview: {
      host: '127.0.0.1',
      port: 5173,
    },
  }
})