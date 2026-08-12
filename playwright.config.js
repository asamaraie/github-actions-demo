const { defineConfig, devices } = require('@playwright/test');

// Set E2E_BASE_URL to point tests at a deployed site (e.g. staging) instead of
// building and starting the app locally.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

module.exports = defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run build && npm start',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});
