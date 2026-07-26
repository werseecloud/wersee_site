import { expect, test } from '@playwright/test';

test.describe('Wersee AI workspace shell', () => {
  test.skip(!process.env.WERSEE_E2E_STORAGE_STATE, 'Set WERSEE_E2E_STORAGE_STATE to an authenticated Supabase Playwright storage-state file.');

  test('opens globally, exposes context, and keeps risky controls explicit', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Control+Shift+A');

    const assistant = page.getByRole('complementary', { name: 'Wersee AI' });
    await expect(assistant).toBeVisible();
    await expect(assistant.getByText('Wersee AI', { exact: true })).toBeVisible();
    await expect(assistant.getByPlaceholder(/Ask Wersee AI|Ask the agent/)).toBeVisible();

    await assistant.getByRole('button', { name: 'AI permissions' }).click();
    await expect(page.getByText('Granular control for agent mode')).toBeVisible();
    await expect(page.getByText(/Payments, publishing, outbound messages/)).toBeVisible();
    await expect(page.getByText('Conversation memory')).toBeVisible();
    await expect(page.getByText('Saved instructions')).toBeVisible();
  });

  test('uses a keyboard-safe mobile bottom sheet', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-only assertion.');
    await page.goto('/dashboard');
    await page.keyboard.press('Control+Shift+A');
    const assistant = page.getByRole('complementary', { name: 'Wersee AI' });
    await expect(assistant).toBeVisible();
    const box = await assistant.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(430);
    await assistant.getByPlaceholder(/Ask Wersee AI|Ask the agent/).focus();
    await expect(assistant.getByRole('button', { name: 'Close Wersee AI' })).toBeVisible();
  });
});
