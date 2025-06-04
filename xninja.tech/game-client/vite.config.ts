import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 3000,
    },
    plugins: [react(), cssInjectedByJsPlugin()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        cssCodeSplit: false,
        rollupOptions: {
            input: {
                app: './src/main.tsx',
            },
            output: {
                entryFileNames: `assets/entry.js`,
                chunkFileNames: `assets/chunk.js`,
            },
        },
    },
});
