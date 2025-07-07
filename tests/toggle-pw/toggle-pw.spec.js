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
		const checkbox = page.getByTestId('toggle-1');
		const password = page.getByTestId('input-1');
		await expect(password).toHaveAttribute('type', 'password');
		await checkbox.setChecked(true);
		await expect(password).toHaveAttribute('type', 'text');
		await checkbox.setChecked(false);
		await expect(password).toHaveAttribute('type', 'password');
	});

	test('password visibility is toggled when button is pressed', async ({ page }) => {
		await page.goto(testPath);
		const button = page.getByTestId('toggle-2');
		const password = page.getByTestId('input-2');
		await expect(password).toHaveAttribute('type', 'password');
		await button.click();
		await expect(password).toHaveAttribute('type', 'text');
		await button.click();
		await expect(password).toHaveAttribute('type', 'password');
	});

	test('password is visible by default when [visible] attribute is used', async ({ page }) => {
		await page.goto(testPath);
		const button = page.getByTestId('toggle-3');
		const passwordButton = page.getByTestId('input-3');
		const checkbox = page.getByTestId('toggle-4');
		const passwordCheckbox = page.getByTestId('input-4');
		await expect(passwordButton).toHaveAttribute('type', 'text');
		await expect(button).toHaveAttribute('aria-pressed', 'true');
		await expect(passwordCheckbox).toHaveAttribute('type', 'text');
		await expect(checkbox).toBeChecked();
		await button.click();
		await expect(passwordButton).toHaveAttribute('type', 'password');
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

	test('toggles are hidden until script loads', async ({ page }) => {
		await page.goto(`${testPath}/no-js.html`);
		const label = await page.getByTestId('label-1');
		const button = await page.getByTestId('toggle-2');
	});

});
