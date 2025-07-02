import { test, expect } from '@playwright/test';

test.describe('Example test', () => {

	test('the page loads and has a heading', async ({ page }) => {

		await page.goto('/tests/example');

		// Shows a page heading
		await expect(page.locator('h1')).toContainText('Kelp');

	});

});
