import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import {defineConfig, loadEnv} from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const geminiApiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
    },
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
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['framer-motion', 'motion', 'lucide-react'],
            'vendor-stripe': ['@stripe/react-stripe-js', '@stripe/stripe-js', '@stripe/react-connect-js', '@stripe/connect-js'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/messaging'],
            'vendor-charts': ['recharts', 'react-is'],
            'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
            'vendor-editor': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-image', '@tiptap/extension-link'],
            'vendor-pdf': ['@react-pdf/renderer', 'jspdf', 'jspdf-autotable'],
            'vendor-utils': ['zod', 'clsx', 'tailwind-merge', 'date-fns'],
          },
        },
      },
    },
  };
});
