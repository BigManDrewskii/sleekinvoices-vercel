import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Increase chunk size warning limit (we're optimizing, but some chunks will still be large)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunks for better caching and parallel loading
        manualChunks: (id) => {
          // React core - rarely changes, cache separately
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          
          // Radix UI components - group together for caching
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }
          
          // Form handling libraries
          if (id.includes('node_modules/react-hook-form/') || 
              id.includes('node_modules/@hookform/') ||
              id.includes('node_modules/zod/')) {
            return 'vendor-forms';
          }
          
          // Charts - only loaded on Analytics page
          if (id.includes('node_modules/recharts/') || 
              id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          
          // Streamdown and its heavy dependencies (mermaid, shiki, cytoscape)
          // These will be lazy loaded with AIAssistant
          if (id.includes('node_modules/streamdown/') ||
              id.includes('node_modules/mermaid/') ||
              id.includes('node_modules/cytoscape/') ||
              id.includes('node_modules/shiki/') ||
              id.includes('node_modules/@shikijs/')) {
            return 'vendor-ai-markdown';
          }
          
          // Date utilities
          if (id.includes('node_modules/date-fns/')) {
            return 'vendor-date';
          }
          
          // tRPC and React Query
          if (id.includes('node_modules/@trpc/') || 
              id.includes('node_modules/@tanstack/react-query')) {
            return 'vendor-data';
          }
          
          // Stripe
          if (id.includes('node_modules/@stripe/') || 
              id.includes('node_modules/stripe/')) {
            return 'vendor-stripe';
          }
          
          // Lucide icons
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
