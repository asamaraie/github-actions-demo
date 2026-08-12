const { test, expect } = require('@playwright/test');

test('shows the Hello, World! message on load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#message')).toHaveText('Hello, World!');
});

test('clicking "Say Hello Again" reloads the message', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#message')).toHaveText('Hello, World!');

  await page.click('#refresh');

  await expect(page.locator('#message')).toHaveText('Hello, World!');
});
