import { expect, test } from '@playwright/test';
import { testComponentReadyState } from '../test-utilities.js';

// Component details
const componentName = 'kelp-disclosure';
const testPath = '/tests/disclosure';

/**
 * @typedef {Object} Disclosure
 * @method show    Show the disclosure content
 * @method hide    Hide the disclosure content
 * @method toggle  Toggle content visibility between shown and hidden
 */

test.describe(`<${componentName}>`, () => {
	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {
		await page.goto(`${testPath}/default.html`);

		// Get elements
		const wc = page.locator(componentName);
		const toggle = page.getByTestId('toggle');
		const content = page.locator('#content');

		// Toggle is visible
		await expect(toggle).toBeVisible();

		// Content is hidden by default
		await expect(content).not.toBeVisible();

		// Expect ARIA attributes to be added
		await expect(toggle).toHaveAttribute('aria-controls', 'content');
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');

		// Clicking the toggle reveals the content
		await toggle.click();
		await expect(content).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');

		// Clicking the toggle hides the content again
		await toggle.click();
		await expect(content).not.toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');

		// .show() method opens the content
		await wc.evaluate((/** @type Disclosure */ el) => {
			el.show();
		});
		await expect(content).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');

		// .hide() method hides the content
		await wc.evaluate((/** @type Disclosure */ el) => {
			el.hide();
		});
		await expect(content).not.toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');

		// .toggle() method toggles the content
		await wc.evaluate((/** @type Disclosure */ el) => {
			el.toggle();
		});
		await expect(content).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await wc.evaluate((/** @type Disclosure */ el) => {
			el.toggle();
		});
		await expect(content).not.toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	test('dropdown variant', async ({ page }) => {
		await page.goto(`${testPath}/dropdown.html`);

		// Get elements
		const toggle = page.getByTestId('toggle');
		const fallback = page.getByTestId('[until-ready]');
		const content = page.locator('#content');
		const button = page.getByTestId('button');

		// Fallback and content are hidden.
		// Toggle is visible.
		await expect(fallback).not.toBeVisible();
		await expect(content).not.toBeVisible();
		await expect(toggle).toBeVisible();

		// Clicking the toggle reveals the content
		await toggle.click();
		await expect(content).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');

		// Clicking outside the component closes the content
		await button.click();
		await expect(content).not.toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');

		// The Escape key hides the content
		toggle.click();
		await expect(content).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await page.keyboard.press('Escape');
		await expect(content).not.toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	test('dropdown that opens dialog', async ({ page }) => {
		await page.goto(`${testPath}/dropdown-dialog.html`);

		// Get elements
		const toggle = page.getByTestId('toggle');
		const content = page.locator('#content');
		const button = page.getByTestId('button');
		const openDialog = page.getByTestId('open modal');
		const closeDialog = page.getByTestId('close modal');
		const dialog = page.locator('#dialog');

		// Clicking the toggle reveals the content
		await toggle.click();
		await expect(content).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');

		// Opening a modal from within the dropdown does NOT close the content
		await openDialog.click();
		await expect(content).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await expect(dialog).toBeVisible();

		// Clicking within an open dialog does NOT close the content
		await closeDialog.click();
		await expect(content).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		await expect(dialog).not.toBeVisible();

		// The Escape key does NOT hide the content if the dialog is open
		await openDialog.click();
		await expect(content).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(dialog).not.toBeVisible();
		await expect(content).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');

		// Clicking outside the dropdown with an open dialog closes it
		await button.click();
		await expect(content).not.toBeVisible();
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
	});

	test('error handling', async ({ page }) => {
		await page.goto(`${testPath}/errors.html`);

		// Get elements
		const wc = page.locator(componentName);
		const toggle = page.getByTestId('toggle');
		const content = page.locator('#content');

		// no [is-ready] attribute
		await expect(wc).not.toHaveAttribute('is-ready');

		// The toggle is hidden
		await expect(toggle).not.toBeVisible();

		// The content is visible
		await expect(content).toBeVisible();
	});

	test('all content is visible before JS loads', async ({ page }) => {
		await page.goto(`${testPath}/no-js.html`);

		// Elements
		const wc = page.locator(componentName);
		const toggle = page.getByTestId('toggle');
		const content = page.locator('#content');

		// no [is-ready] attribute
		await expect(wc).not.toHaveAttribute('is-ready');

		// The toggle is hidden
		await expect(toggle).not.toBeVisible();

		// The content is visible
		await expect(content).toBeVisible();
	});

	test('dropdown fallback link is visible before JS loads', async ({
		page,
	}) => {
		await page.goto(`${testPath}/no-js-dropdown.html`);

		// Elements
		const wc1 = page.locator('[target="#content"]');
		const wc2 = page.locator('[target="#content-2"]');
		const toggle = page.getByTestId('toggle');
		const fallback = page.locator('[show-until-ready]');
		const content = page.locator('#content');

		// no [is-ready] attribute
		await expect(wc1).not.toHaveAttribute('is-ready');

		// The fallback content is visible
		await expect(fallback).toBeVisible();

		// The toggle AND content are hidden
		await expect(toggle).not.toBeVisible();
		await expect(content).not.toBeVisible();

		// The dropdown without fallback content is hidden
		await expect(wc2).not.toBeVisible();
	});
});
