import { test, expect } from '@playwright/test';
import { testComponentReadyState, testDebugEvent } from '../test-utilities.js';

// Component details
const componentName = 'kelp-toggle-pw';
const testPath = '/tests/toggle-pw';

test.describe(`<${componentName}>`, () => {

	testComponentReadyState(componentName, testPath);
	testDebugEvent(testPath, 'toc-8');

	test('password is visible when checkbox is checked', async ({ page }) => {
		await page.goto(testPath);
	});

	test('password visibility is toggled when button is pressed', async ({ page }) => {
		await page.goto(testPath);
	});

	test('password is visible by default when [visible] attribute is used', async ({ page }) => {
		await page.goto(testPath);
	});

	test('[is-visible] and [is-hidden] attributes conditionally show content', async ({ page }) => {
		await page.goto(testPath);
	});

	test('.toggle(), .show(), and .hide() methods work', async ({ page }) => {
		await page.goto(testPath);
	});

	test('[aria-pressed] is added to button and toggled based on state', async ({ page }) => {
		await page.goto(testPath);
	});

});
