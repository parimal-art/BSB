import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

// Get canister IDs from environment
const getCanisterIds = () => {
  const DFX_NETWORK = process.env.DFX_NETWORK || 'local';
  let canisterIds = {};

  try {
    canisterIds = require('../../.dfx/local/canister_ids.json');
  } catch (error) {
    console.warn('No canister IDs found. Continuing with empty object.');
  }

  const canisterIdsEnv = Object.entries(canisterIds).reduce((acc, [canisterName, ids]) => {
    const canisterId = ids[DFX_NETWORK];
    acc[`CANISTER_ID_${canisterName.toUpperCase()}`] = canisterId;
    return acc;
  }, {});

  return canisterIdsEnv;
};

export default defineConfig({
  build: {
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split the agent into a separate chunk
          "@dfinity/agent": ["@dfinity/agent", "@dfinity/auth-client", "@dfinity/principal", "@dfinity/candid"],
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      "/_/": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
      "/api/v2/canister/": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      }
    },
    host: "127.0.0.1", // Changed from 0.0.0.0 to avoid CORS issues
    cors: true,
    port: 3000,
  },
  define: {
    // Add canister IDs to the build
    ...getCanisterIds(),
    'process.env.DFX_NETWORK': JSON.stringify(process.env.DFX_NETWORK || 'local'),
  },
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(
          new URL("../declarations", import.meta.url)
        ),
      },
    ],
    dedupe: ['@dfinity/agent', '@dfinity/auth-client', '@dfinity/principal', '@dfinity/candid'],
  },
});

