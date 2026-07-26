import { test, expect } from '@playwright/test';

// These run against the demo with a Chromium fake camera
// (--use-fake-device-for-media-stream / --use-fake-ui-for-media-stream).

test.describe('demo', () => {
    test('starts the fake camera and captures a photo', async ({ page }) => {
        await page.goto('/');

        await expect(page.getByText('getUserMedia: yes')).toBeVisible();
        // The demo auto-starts the camera on mount; wait for the stream.
        await expect(page.getByText('stream: active')).toBeVisible({ timeout: 15_000 });

        const capture = page.getByRole('button', { name: 'Capture photo' });
        await expect(capture).toBeEnabled({ timeout: 15_000 });
        await capture.click();

        await expect(page.locator('.preview img')).toBeVisible();
    });

    test('flips the camera and stays active', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('stream: active')).toBeVisible({ timeout: 15_000 });

        await page.getByRole('button', { name: 'Flip front/back' }).click();

        // After switching, the capture button becomes ready again.
        await expect(page.getByRole('button', { name: 'Capture photo' })).toBeEnabled({ timeout: 15_000 });
    });

    test('records a short clip', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('stream: active')).toBeVisible({ timeout: 15_000 });

        await page.getByRole('button', { name: '● Record' }).click();
        await expect(page.getByRole('button', { name: /Stop \(\d+s\)/ })).toBeVisible();
        await page.waitForTimeout(1200);
        await page.getByRole('button', { name: /Stop \(\d+s\)/ }).click();

        // A clip element appears with the recorded video.
        await expect(page.locator('.clip video')).toBeVisible({ timeout: 15_000 });
    });
});
