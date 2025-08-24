import { test, expect } from '@playwright/test';
import { testComponentReadyState, waitForCustomEvent } from '../test-utilities.js';

// Component details
const componentName = 'kelp-dialog';
const testPath = '/tests/dialog';


test.describe(`<${componentName}>`, () => {

	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {

		await page.goto(`${testPath}/default.html`);

		// Get elements
		const wc = page.locator(componentName);

		// Clicking the button shows the modal

		// Clicking a button inside the modal closes it

		// Clicking outside the modal closes it

		// Pressing the Esc key closes the modal

		// The autofocus attribute focuses on the thing after opening

		// Closing the modal returns focus to the trigger button

		// open event emits on the dialog

	});

	test('options and settings', async ({ page }) => {

		await page.goto(`${testPath}/options.html`);

		// Get elements

	});

	test('error handling', async ({ page }) => {

		await page.goto(`${testPath}/errors.html`);

		// Get elements
		const wc = page.locator(componentName);

		// If there's no target provided, the component doesn't instantiate

		// If there's no matching dialog, the component doesn't instantiate

	});

});
