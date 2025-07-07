import { test, expect } from '@playwright/test';
import { testComponentReadyState, testDebugEvent } from '../test-utilities.js';

// Component details
const componentName = 'kelp-toggle-pw';
const testPath = '/tests/toggle-pw';

test.describe(`<${componentName}>`, () => {

	testComponentReadyState(componentName, testPath);
	testDebugEvent(testPath, 'wc-6', 'No password fields');
	testDebugEvent(testPath, 'wc-7', 'No password toggle');

	test('password is visible when checkbox is checked', async ({ page }) => {
		await page.goto(testPath);
		const checkbox = await page.getByTestId('toggle-1');
	});

	test('password visibility is toggled when button is pressed', async ({ page }) => {
		await page.goto(testPath);
		const button = await page.getByTestId('toggle-2');
	});

	test('password is visible by default when [visible] attribute is used', async ({ page }) => {
		await page.goto(testPath);
		const button = await page.getByTestId('toggle-3');
		const input = await page.getByTestId('input-3');
	});

	test('[is-visible] and [is-hidden] attributes conditionally show content', async ({ page }) => {
		await page.goto(testPath);
		const button = await page.getByTestId('toggle-3');
	});

	test('.toggle(), .show(), and .hide() methods work', async ({ page }) => {
		await page.goto(testPath);
		const wc = await page.getByTestId('wc-4');
	});

	test('[aria-pressed] is added to button and toggled based on state', async ({ page }) => {
		await page.goto(testPath);
		const button = await page.getByTestId('toggle-5');
	});

});
