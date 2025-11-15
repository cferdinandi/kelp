import { expect, test } from '@playwright/test';

// Component details
const componentName = 'hide-until-ready';
const testPath = '/tests/hide-until-ready';

test.describe(`[${componentName}]`, () => {
	test('default behavior', async ({ page }) => {
		await page.goto(`${testPath}/default.html`);

		// Get elements
		const wc = page.locator('kelp-fake-component');

		// Web component should be hidden
		await expect(wc).not.toBeVisible();

		// Once ready, web component should be visible
		await wc.evaluate((elem) => elem.setAttribute('is-ready', ''));
		await expect(wc).toBeVisible();
	});
});
