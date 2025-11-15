import { expect, test } from '@playwright/test';
import { testComponentReadyState } from '../test-utilities.js';

// Component details
const componentName = 'kelp-autogrow';
const testPath = '/tests/autogrow';

const wizards = `merlin
radagast
gandalf
ursula
morgan
rand
moraine
nynaeve`;

test.describe(`<${componentName}>`, () => {
	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {
		await page.goto(`${testPath}/default.html`);

		// Get elements
		const text = page.locator('textarea');
		const height = await text.evaluate((elem) =>
			Number.parseFloat(window.getComputedStyle(elem).height),
		);

		// Textarea should expand with long text
		await text.fill(wizards);
		const longHeight = await text.evaluate((elem) =>
			Number.parseFloat(window.getComputedStyle(elem).height),
		);
		await expect(longHeight).toBeGreaterThan(height);

		// Textarea should shrink again with short text
		await text.fill('Merlin');
		const shortHeight = await text.evaluate((elem) =>
			Number.parseFloat(window.getComputedStyle(elem).height),
		);
		await expect(shortHeight).toBeLessThan(longHeight);
	});

	test('preloaded content', async ({ page }) => {
		await page.goto(`${testPath}/preloaded.html`);

		// Get elements
		const text = page.locator('textarea');
		const height = await text.evaluate((elem) =>
			Number.parseFloat(window.getComputedStyle(elem).height),
		);

		// Textarea to autoexpand with default value
		await expect(height).toBeGreaterThan(144);
	});

	test('error handling', async ({ page }) => {
		await page.goto(`${testPath}/errors.html`);

		// Get elements
		const wc = page.locator('kelp-autogrow').first();

		// no [is-ready] attribute
		await expect(wc).not.toHaveAttribute('is-ready');
	});
});
