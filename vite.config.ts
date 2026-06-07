import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze'
  const enableSourceMaps = process.env.VITE_ENABLE_SOURCEMAPS === 'true'

  return {
    plugins: [
      react(),
      isAnalyze
        ? visualizer({
            emitFile: true,
            filename: 'bundle-report.html',
            template: 'treemap',
            gzipSize: true,
            brotliSize: true,
            open: false,
          })
        : null,
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'es2022',
      outDir: 'dist',
      sourcemap: enableSourceMaps,
      emptyOutDir: true,
      modulePreload: {
        resolveDependencies: (_filename, deps) => deps.filter((dep) => !dep.includes('chart-vendor')),
      },
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          manualChunks(id) {
            const normalizedId = id.replaceAll('\\', '/')

            if (normalizedId.includes('node_modules/react') || normalizedId.includes('node_modules/react-dom') || normalizedId.includes('node_modules/react-router-dom')) {
              return 'react-vendor'
            }

            if (normalizedId.includes('node_modules/@tanstack/react-query') || normalizedId.includes('node_modules/@tanstack/react-table')) {
              return 'query-vendor'
            }

            if (normalizedId.includes('node_modules/lucide-react') || normalizedId.includes('node_modules/@radix-ui')) {
              return 'ui-vendor'
            }
          },
        },
      },
    },
  }
})
