import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig, loadEnv} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR override only needed when running behind a TLS proxy (e.g. Replit).
      // Set VITE_HMR_HOST in .env to enable it; omit for local development.
      ...(env.VITE_HMR_HOST
        ? { hmr: { protocol: 'wss', host: env.VITE_HMR_HOST, clientPort: 443 } }
        : {}),
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      chunkSizeWarningLimit: 2000,
      minify: 'esbuild',
      // Keep sourcemaps available by default, but allow constrained production
      // builders to disable them without changing the checked-in build policy.
      sourcemap: env.VITE_BUILD_SOURCEMAP !== 'false',
      modulePreload: {
        resolveDependencies: (_filename, dependencies, context) => (
          context.hostType === 'html'
            ? dependencies.filter((dependency) => !dependency.includes('vendor-three'))
            : dependencies
        ),
      },
      rollupOptions: {
        input: {
          app: path.resolve(__dirname, 'index.html'),
          'front-channel-logout': path.resolve(__dirname, 'src/auth/frontChannelLogoutClient.ts'),
        },
        output: {
          entryFileNames: (chunk) => (
            chunk.name === 'front-channel-logout'
              ? 'assets/front-channel-logout.js'
              : 'assets/[name]-[hash].js'
          ),
          manualChunks(id) {
            const moduleId = id.replace(/\\/g, '/');
            if (moduleId.includes('vite/preload-helper')) return 'vendor-runtime';
            if (!moduleId.includes('/node_modules/')) return undefined;
            if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(moduleId)) return 'vendor-react';
            if (/\/node_modules\/(framer-motion|motion|lucide-react)\//.test(moduleId)) return 'vendor-ui';
            if (moduleId.includes('/node_modules/@stripe/')) return 'vendor-stripe';
            if (moduleId.includes('/node_modules/@supabase/')) return 'vendor-supabase';
            if (/\/node_modules\/(@firebase|firebase)\//.test(moduleId)) return 'vendor-firebase';
            if (/\/node_modules\/(recharts|react-is)\//.test(moduleId)) return 'vendor-charts';
            if (/\/node_modules\/(three|@react-three)\//.test(moduleId)) return 'vendor-three';
            if (moduleId.includes('/node_modules/@tiptap/')) return 'vendor-editor';
            if (/\/node_modules\/(@react-pdf|jspdf|jspdf-autotable)\//.test(moduleId)) return 'vendor-pdf';
            if (/\/node_modules\/(zod|clsx|tailwind-merge|date-fns)\//.test(moduleId)) return 'vendor-utils';
            return undefined;
          },
        },
      },
    },
  };
});
