import { defineConfig, devices } from '@playwright/test';

// Default port to use for testing, but override in case 8080 is in use
const port = process.env.PORT || 8080

export default defineConfig({

	testDir: './tests',

	// Run tests in files in parallel
	fullyParallel: true,

	// Fail the build on CI if you accidentally left test.only in the source code.
	forbidOnly: !!process.env.CI,

	// Retry on CI only
	retries: process.env.CI ? 2 : 0,

	// Opt out of parallel tests on CI.
	workers: process.env.CI ? 1 : undefined,

	// Reporter to use. See https://playwright.dev/docs/test-reporters
	reporter: [
		['list'],
		[
			'html',
			{ outputFolder: 'playwright-report_e2e' }
		]
	],

	// Run your local dev server before starting the tests
	webServer: {
		command: 'npm run start',
		url: 'http://localhost:' + port,
		reuseExistingServer: !process.env.CI,
	},

	// Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
	use: {
		// Base URL to use in actions like `await page.goto('/')`.
		baseURL: 'http://localhost:' + port,

		// Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
		trace: 'on-first-retry',
	},

	// Configure projects for major browsers
	// Only running chromium for speed
	// Uncomment to run more
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},

		// {
		// 	name: 'firefox',
		// 	use: { ...devices['Desktop Firefox'] },
		// },

		// {
		// 	name: 'webkit',
		// 	use: { ...devices['Desktop Safari'] },
		// },

		// Test against mobile viewports
		// {
		// 	name: 'Mobile Chrome',
		// 	use: { ...devices['Pixel 7'] },
		// },
		// {
		// 	name: 'Mobile Safari',
		// 	use: { ...devices['iPhone 13'] },
		// },

	],

});
