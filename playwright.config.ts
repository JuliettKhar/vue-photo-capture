import { defineConfig, devices } from '@playwright/test';

const PORT = 5188;

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: 'list',
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Feed getUserMedia a synthetic camera and auto-grant permission.
                launchOptions: {
                    args: [
                        '--use-fake-device-for-media-stream',
                        '--use-fake-ui-for-media-stream',
                    ],
                },
            },
        },
    ],
    // Build the library and serve the demo (index.html + dist/) for the tests.
    webServer: {
        command: `npm run build && npx vite --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
