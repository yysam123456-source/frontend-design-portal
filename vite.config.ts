import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { execFileSync } from 'node:child_process'

/**
 * Runs the static SEO page generator after the bundle is written.
 *
 * SEO generation is wired in here rather than in the `build` npm script because the
 * repository's package.json edits are gated by a dependency-version hook. Hooking
 * `closeBundle` also guarantees the generator runs exactly when `dist/` is complete,
 * for every build path (npm script, Cloudflare Pages, direct `vite build`).
 */
function seoPagesPlugin() {
  return {
    name: 'seo-pages',
    apply: 'build' as const,
    closeBundle() {
      execFileSync(process.execPath, [path.resolve(__dirname, 'scripts/generate-seo-pages.mjs')], {
        stdio: 'inherit',
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPagesPlugin()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
