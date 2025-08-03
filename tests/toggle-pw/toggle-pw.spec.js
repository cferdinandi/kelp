import { test, expect } from '@playwright/test';
import { testComponentReadyState, waitForCustomEvent } from '../test-utilities.js';

// Component details
const componentName = 'kelp-toggle-pw';
const testPath = '/tests/toggle-pw';

test.describe(`<${componentName}>`, () => {

	testComponentReadyState(componentName, testPath, 'default-checkbox.html');
	testComponentReadyState(componentName, testPath, 'default-button.html');

	test('default component with checkbox', async ({ page }) => {

		await page.goto(`${testPath}/default-checkbox.html`);

		// Elements
		const wc = page.locator('kelp-toggle-pw').first();
		const password = page.locator('#password');
		const toggle = page.locator('kelp-toggle-pw [toggle]');
		const label = page.getByTestId('label');

		// Label should be visible
		await expect(label).toBeVisible();

		// Checking checkbox should make password visible
		const eventShow = waitForCustomEvent(wc, 'kelp-toggle-pw:show');
		await expect(password).toHaveAttribute('type', 'password');
		await toggle.setChecked(true);
		await expect(password).toHaveAttribute('type', 'text');
		await expect(eventShow).toBeTruthy();

		// Unchecking it should hide the password
		const eventHide = waitForCustomEvent(wc, 'kelp-toggle-pw:hide');
		await toggle.setChecked(false);
		await expect(password).toHaveAttribute('type', 'password');
		await expect(eventHide).toBeTruthy();

		// .show() method should show password
		await wc.evaluate((elem) => elem.show());
		await expect(password).toHaveAttribute('type', 'text');
		await expect(toggle).toBeChecked();

		// .hide() method should hide password
		await wc.evaluate((elem) => elem.hide());
		await expect(password).toHaveAttribute('type', 'password');
		await expect(toggle).not.toBeChecked();

		// .toggle() method should toggle password
		await wc.evaluate((elem) => elem.toggle());
		await expect(password).toHaveAttribute('type', 'text');
		await expect(toggle).toBeChecked();
		await wc.evaluate((elem) => elem.toggle());
		await expect(password).toHaveAttribute('type', 'password');
		await expect(toggle).not.toBeChecked();

	});

	test('default component with button', async ({ page }) => {

		await page.goto(`${testPath}/default-button.html`);

		// Elements
		const wc = page.locator('kelp-toggle-pw').first();
		const password = page.locator('#password');
		const toggle = page.locator('kelp-toggle-pw [toggle]');
		const showText = toggle.locator('[is-hidden]');
		const hideText = toggle.locator('[is-visible]');

		// Button should be visible
		await expect(toggle).toBeVisible();

		// Default element states
		await expect(password).toHaveAttribute('type', 'password');
		await expect(showText).toBeVisible();
		await expect(hideText).not.toBeVisible();
		await expect(toggle).toHaveAttribute('aria-pressed', 'false');

		// Clicking button should make password visible and update attributes
		const eventShow = waitForCustomEvent(wc, 'kelp-toggle-pw:show');
		await toggle.click();
		await expect(password).toHaveAttribute('type', 'text');
		await expect(showText).not.toBeVisible();
		await expect(hideText).toBeVisible();
		await expect(toggle).toHaveAttribute('aria-pressed', 'true');
		await expect(eventShow).toBeTruthy();

		// Clicking it again should hide the password
		const eventHide = waitForCustomEvent(wc, 'kelp-toggle-pw:hide');
		await toggle.click();
		await expect(password).toHaveAttribute('type', 'password');
		await expect(showText).toBeVisible();
		await expect(hideText).not.toBeVisible();
		await expect(toggle).toHaveAttribute('aria-pressed', 'false');
		await expect(eventHide).toBeTruthy();

		// .show() method should show password
		await wc.evaluate((elem) => elem.show());
		await expect(password).toHaveAttribute('type', 'text');
		await expect(toggle).toHaveAttribute('aria-pressed', 'true');

		// .hide() method should hide password
		await wc.evaluate((elem) => elem.hide());
		await expect(password).toHaveAttribute('type', 'password');
		await expect(toggle).toHaveAttribute('aria-pressed', 'false');

		// .toggle() method should toggle password
		await wc.evaluate((elem) => elem.toggle());
		await expect(password).toHaveAttribute('type', 'text');
		await expect(toggle).toHaveAttribute('aria-pressed', 'true');
		await wc.evaluate((elem) => elem.toggle());
		await expect(password).toHaveAttribute('type', 'password');
		await expect(toggle).toHaveAttribute('aria-pressed', 'false');

	});

	test('options and settings with checkbox', async ({ page }) => {

		await page.goto(`${testPath}/options-checkbox.html`);

		// Elements
		const password = page.locator('#password');
		const toggle = page.locator('kelp-toggle-pw [toggle]');

		// Password should be visible by default
		await expect(password).toHaveAttribute('type', 'text');
		await expect(toggle).toBeChecked();

		// Unchecking it should hide password
		await toggle.setChecked(false);
		await expect(password).toHaveAttribute('type', 'password');

	});

	test('options and settings with button', async ({ page }) => {

		await page.goto(`${testPath}/options-button.html`);

		// Elements
		const password = page.locator('#password');
		const toggle = page.locator('kelp-toggle-pw [toggle]');

		// Password should be visible by default
		await expect(password).toHaveAttribute('type', 'text');
		await expect(toggle).toHaveAttribute('aria-pressed', 'true');

		// Clicking button should hide password
		await toggle.click();
		await expect(password).toHaveAttribute('type', 'password');
		await expect(toggle).toHaveAttribute('aria-pressed', 'false');

	});

	test('error handling', async ({ page }) => {

		await page.goto(`${testPath}/errors.html`);

		// Elements
		const wc1 = page.getByTestId('wc-1');
		const wc2 = page.getByTestId('wc-2');
		const toggle = wc1.locator('[toggle]');

		// Neither element should be ready
		await expect(wc1).not.toHaveAttribute('is-ready');
		await expect(wc2).not.toHaveAttribute('is-ready');

		// Toggle should be hidden if no password
		await expect(toggle).not.toBeVisible();

	});

	test('toggles are hidden before JS loads', async ({ page }) => {

		await page.goto(`${testPath}/no-js.html`);

		// Elements
		const label = page.getByTestId('label');
		const button = page.locator('button');

		// Neither element should be visible
		await expect(label).not.toBeVisible();
		await expect(button).not.toBeVisible();

	});

});
