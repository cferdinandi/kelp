import { expect, test } from '@playwright/test';
import { testComponentReadyState } from '../test-utilities.js';

// Component details
const componentName = 'kelp-subnav';
const testPath = '/tests/subnav';

test.describe(`<${componentName}>`, () => {
	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {
		await page.goto(`${testPath}/default.html`);

		// Elements
		const details = page.locator('details');
		const summary = details.locator('summary');
		const button = page.locator('button');
		const link = details.locator('a').first();
		const anchor = details.locator('[href*="test-anchor"]').first();

		// Clicking outside of the subnav should close it
		await summary.click();
		await expect(details).toHaveAttribute('open');
		await button.click();
		await expect(details).not.toHaveAttribute('open');

		// Pressing the escape key should close any open subnavs
		await summary.click();
		await expect(details).toHaveAttribute('open');
		await button.press('Escape');
		await expect(details).not.toHaveAttribute('open');

		// Pressing the escape key while inside a subnav should close it
		// and shift focus back to the summary element
		await summary.click();
		await expect(details).toHaveAttribute('open');
		await link.press('Escape');
		await expect(details).not.toHaveAttribute('open');
		await expect(summary).toBeFocused();

		// Clicking an anchor link inside a subnav should close it
		await summary.click();
		await expect(details).toHaveAttribute('open');
		await anchor.click();
		await expect(details).not.toHaveAttribute('open');
	});

	test('error handling', async ({ page }) => {
		await page.goto(`${testPath}/errors.html`);

		// Elements
		const wc = page.locator(componentName);

		// Element should be ready
		await expect(wc).not.toHaveAttribute('is-ready');
	});
});
