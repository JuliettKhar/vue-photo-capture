import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'Vue Photo Capture',
    description:
        'A Vue 3 Composition API library for capturing photos and video from a webcam or camera device.',
    lang: 'en-US',
    // Deployed under the GitHub Pages project subpath.
    base: '/vue-photo-capture/',
    lastUpdated: true,
    themeConfig: {
        nav: [
            { text: 'Guide', link: '/guide/getting-started' },
            { text: 'Nuxt', link: '/guide/nuxt' },
            { text: 'API', link: '/api' },
            { text: 'Recipes', link: '/guide/recipes' },
            { text: 'Demo', link: 'https://juliettkhar.github.io/vue-photo-capture/demo/' },
        ],
        sidebar: {
            '/': [
                {
                    text: 'Guide',
                    items: [
                        { text: 'Getting Started', link: '/guide/getting-started' },
                        { text: 'usePhotoCapture', link: '/guide/use-photo-capture' },
                        { text: '<CameraCapture>', link: '/guide/camera-capture' },
                        { text: 'Nuxt', link: '/guide/nuxt' },
                        { text: 'Recipes', link: '/guide/recipes' },
                    ],
                },
                {
                    text: 'Reference',
                    items: [{ text: 'API', link: '/api' }],
                },
            ],
        },
        socialLinks: [
            { icon: 'github', link: 'https://github.com/JuliettKhar/vue-photo-capture' },
        ],
        search: { provider: 'local' },
        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © Julia Kharlamova',
        },
    },
});
