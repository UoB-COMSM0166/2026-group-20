import { defineConfig } from 'vite';

export default defineConfig({
    // Project root directory
    root: './',
    // Base public path when served in production
    base: '/2026-group-20/main-game/',
    build: {
        outDir: 'dist',
    },
});
