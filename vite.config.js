import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        target: 'esnext',
    },
    server: {
        port: 3000,
        open: true
    },
    optimizeDeps: {
        include: ['three', 'gsap'],
    },
    resolve: {
        alias: {
            'three': 'three',
            '@': '/js'
        }
    }
}); 