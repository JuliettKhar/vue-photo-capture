import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';

// Builds the Nuxt module (src/nuxt.ts) as a separate ES entry alongside the
// main library build. @nuxt/kit and the library itself stay external.
export default defineConfig({
    plugins: [dts({ include: ['src/nuxt.ts'], entryRoot: 'src', outDir: 'dist' })],
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        lib: {
            entry: path.resolve(__dirname, 'src/nuxt.ts'),
            formats: ['es'],
            fileName: () => 'nuxt.mjs',
        },
        rollupOptions: {
            external: ['@nuxt/kit', 'vue-photo-capture', 'vue'],
        },
    },
});
