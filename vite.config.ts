import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env file from project root and client directory
const mode = process.env.NODE_ENV ?? 'development'
const rootEnv = loadEnv(mode, process.cwd(), '')
const clientEnv = loadEnv(mode, './client', '')

// Combine environment variables
const env = { ...rootEnv, ...clientEnv }

// Debug: Check env loading
console.log('Vite config debug info:', {
  mode,
  rootEnvKeys: Object.keys(rootEnv),
  clientEnvKeys: Object.keys(clientEnv),
  combinedEnvKeys: Object.keys(env),
})

export default defineConfig({
  envDir: './client',

  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true,
    hmr: {
      clientPort: 5174,
      host: 'localhost'
    }
  },
  root: path.resolve(__dirname, 'client'),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
