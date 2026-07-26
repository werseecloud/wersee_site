import { expect, test, type Page } from '@playwright/test';

const authFlowId = '11111111-2222-4333-8444-555555555555';

async function mockPublicAuthBoundaries(page: Page) {
  let signupRequests = 0;
  const mockUser = {
    id: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    email: 'mobiel@example.com',
    identities: [{ id: 'identity-1', provider: 'email' }],
    user_metadata: {},
    app_metadata: { provider: 'email', providers: ['email'] },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  await page.addInitScript(() => {
    localStorage.setItem('wersee:privacy-consent:v1', JSON.stringify({
      version: '2026-07-22-v1',
      anonymousId: 'auth-e2e',
      categories: { necessary: true, preferences: false, analytics: false, marketing: false, personalization: false },
      decidedAt: new Date().toISOString(),
      source: 'consent_sheet',
    }));
  });

  await page.route('**/rest/v1/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await page.route('https://api.pwnedpasswords.com/range/**', (route) => route.fulfill({ status: 200, contentType: 'text/plain', body: '00000000000000000000000000000000000:0\n' }));
  await page.route('**/functions/v1/auth-flow-session', async (route) => {
    const request = route.request();
    const body = request.postDataJSON() as { action?: string; step?: string; email?: string };
    const step = body.action === 'advance' ? body.step : 'credentials';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        session: {
          id: authFlowId,
          step,
          email: body.email || null,
          expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
        },
      }),
    });
  });
  await page.route('**/functions/v1/auth-email-2fa', async (route) => {
    const body = route.request().postDataJSON() as { action?: string };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        email: 'mobiel@example.com',
        ...(body.action === 'verify' ? { verified: true } : {}),
      }),
    });
  });
  await page.route('**/functions/v1/track-auth-device', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true }),
  }));
  await page.route('**/auth/v1/token?grant_type=password', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-mobile-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'mock-mobile-refresh-token',
        user: mockUser,
      }),
    });
  });

  await page.route('**/auth/v1/signup**', async (route) => {
    signupRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          ...mockUser,
          email: 'nieuw@example.com',
        },
        session: null,
      }),
    });
  });

  return {
    signupRequests: () => signupRequests,
  };
}

test.describe('mobile authentication', () => {
  for (const viewport of [
    { width: 360, height: 800 },
    { width: 392, height: 850 },
    { width: 412, height: 915 },
  ]) {
    test(`registration is usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await mockPublicAuthBoundaries(page);
      await page.goto('/auth?mode=signup');

      await expect(page.getByRole('heading', { name: 'Account aanmaken' })).toBeVisible();
      await expect(page.getByText('Create account', { exact: true })).toHaveCount(0);
      const submit = page.getByRole('button', { name: 'Account aanmaken', exact: true });
      await expect(submit).toBeDisabled();
      await expect(page.locator('#registration-email')).toHaveAttribute('autocomplete', 'email');
      await expect(page.locator('#registration-password')).toHaveAttribute('autocomplete', 'new-password');

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await submit.scrollIntoViewIfNeeded();
      await expect(submit).toBeVisible();
      await page.screenshot({
        path: `output/playwright/auth-registration-${viewport.width}x${viewport.height}.png`,
        fullPage: true,
      });
    });
  }

  test('login copy and password-manager semantics are correct on first render', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockPublicAuthBoundaries(page);
    await page.goto('/auth');

    await expect(page.getByRole('heading', { name: 'Welkom terug' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Inloggen met een passkey' })).toBeVisible();
    await expect(page.locator('#login-password')).toHaveAttribute('autocomplete', 'current-password');
    await expect(page.getByRole('button', { name: 'Inloggen', exact: true })).toBeDisabled();
    await expect(page.locator('html')).toHaveAttribute('lang', 'nl-NL');
  });

  test('mobile password login redirects to the preserved destination after email verification', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockPublicAuthBoundaries(page);
    await page.goto('/auth?redirect=%2Fworkspace%2Fsettings');

    await page.locator('#login-email').fill('mobiel@example.com');
    await page.locator('#login-password').fill('Mobiel-Wachtwoord-2026!');
    await page.getByRole('button', { name: 'Inloggen', exact: true }).click();

    await expect(page.locator('#login-code')).toBeVisible();
    await page.locator('#login-code').fill('123456');
    await page.getByRole('button', { name: /verifi/i }).click();

    await expect(page).toHaveURL(/\/workspace\/settings$/, { timeout: 5_000 });
  });

  test('one mobile submission skips the security round and sends the first verification email once', async ({ page }) => {
    await page.setViewportSize({ width: 392, height: 850 });
    const boundaries = await mockPublicAuthBoundaries(page);
    await page.goto('/auth?mode=signup');

    await page.locator('#registration-email').fill('nieuw@example.com');
    await page.locator('#registration-password').fill('Uniek-Wachtwoord-2026!');
    await expect(page.getByText('Geen bekende wachtwoordlekken gevonden.')).toBeVisible();
    await page.getByRole('checkbox', { name: /Ik ga akkoord/ }).check();

    const createAccount = page.getByRole('button', { name: 'Account aanmaken' });
    await expect(createAccount).toBeEnabled();
    await Promise.allSettled([
      createAccount.click({ force: true }),
      createAccount.click({ force: true }),
    ]);

    await expect(page.getByRole('heading', { name: 'Controleer je e-mail' })).toBeVisible();
    expect(boundaries.signupRequests()).toBe(1);
    await expect(page.getByText('Beveiligingscontrole', { exact: true })).toHaveCount(0);
    await expect(page.getByText(/verstuur opnieuw/i)).toBeVisible();
    await expect(page.getByText(/Code opnieuw verzenden/i)).toHaveCount(0);

    const sensitiveStorage = await page.evaluate(() => ({
      local: Object.values(localStorage),
      session: Object.values(sessionStorage),
    }));
    expect(JSON.stringify(sensitiveStorage)).not.toContain('Uniek-Wachtwoord-2026!');
    await page.screenshot({
      path: 'output/playwright/auth-registration-verification-392x850.png',
      fullPage: true,
    });
  });
});
