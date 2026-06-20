const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 45 * 1000,
  fullyParallel: false,
  workers: 1, // Windows : lancer plusieurs instances de Chromium en parallèle cause des erreurs EBUSY
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
