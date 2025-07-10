import { test, expect } from '@playwright/test';
import { testComponentReadyState } from '../test-utilities.js';

// Component details
const componentName = 'kelp-heading-anchors';
const testPath = '/tests/heading-anchors';

test.describe(`<${componentName}>`, () => {

	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {

		await page.goto(`${testPath}/default.html`);

		// Get elements
		const wc = page.locator('kelp-heading-anchors');
		const headings = wc.locator('.anchor-h');
		const count = await headings.count();
		const hasHTML = page.getByTestId('code').locator('.anchor-link code');

		// All headings targeted
		await expect(count).toEqual(5);

		// Every heading...
		for (const heading of await headings.all()) {

			// Elements & Attributes
			const link = heading.locator('.anchor-link').first();
			const id = await heading.evaluate((elem) => elem.id);
			const children = link.locator('> *');
			const last = await children.last();

			// Has an ID
			await expect(id).toBeTruthy();

			// Has an anchor link that points to the ID
			await expect(link).toHaveAttribute('href', `#${id}`);

			// Has an icon after the text
			await expect(last).toHaveClass('anchor-icon');

			// Icon should be hidden from screen readers
			await expect(last).toHaveAttribute('aria-hidden', 'true');

		}

		// HTML in the heading is preserved
		await expect(hasHTML).toBeTruthy();

	});

	test('options and settings', async ({ page }) => {

		await page.goto(`${testPath}/options.html`);

		// Get elements
		const wc = page.locator('kelp-heading-anchors');
		const headings = wc.locator('.anchor-h');
		const count = await headings.count();

		// Targets only specified heading [levels]
		await expect(count).toEqual(2);

		// Every heading...
		for (const heading of await headings.all()) {

			// Elements & Attributes
			const icon = heading.locator('.anchor-icon');
			const link = heading.locator('.anchor-link').first();
			const children = link.locator('> *');
			const first = await children.first();

			// Uses custom icon
			await expect(icon).toContainText('🎉');

			// Icon is before the text, not after
			await expect(first).toHaveClass('anchor-icon');

		}

	});

	test('error handling', async ({ page }) => {

		await page.goto(`${testPath}/errors.html`);

		// Get elements
		const wc = page.locator('kelp-heading-anchors');

		// no [is-ready] attribute
		await expect(wc).not.toHaveAttribute('is-ready');

		// no heading links rendered
		await expect(wc).toBeEmpty();

	});

});
