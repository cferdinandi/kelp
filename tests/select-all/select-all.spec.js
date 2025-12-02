import { expect, test } from '@playwright/test';
import { testComponentReadyState } from '../test-utilities.js';

// Component details
const componentName = 'kelp-select-all';
const testPath = '/tests/select-all';

test.describe(`<${componentName}>`, () => {
	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {
		await page.goto(`${testPath}/default.html`);

		// Get elements
		const selectAllEl = page.locator('#select-all');
		const upEl = page.locator('#up');
		const walleEl = page.locator('#wall-e');
		const toyStoryEl = page.locator('#toy-story');
		const uncontrolledEl = page.locator('#uncontrol');

		// Checking the select all checkbox should check all associated checkboxes
		await selectAllEl.check();
		await expect(upEl).toBeChecked();
		await expect(walleEl).toBeChecked();
		await expect(toyStoryEl).toBeChecked();

		// The uncontrolled checkbox should NOT be checked
		await expect(uncontrolledEl).not.toBeChecked();

		// Unchecking a controlled checkbox should set the indeterminate state on the controller
		await toyStoryEl.uncheck();
		const controlState = await selectAllEl.evaluate(
			(el) => 'indeterminate' in el && el.indeterminate,
		);
		expect(controlState).toBeTruthy();

		// Click the controller gain should re-select all controlled checkboxes
		await selectAllEl.check();
		await expect(upEl).toBeChecked();
		await expect(walleEl).toBeChecked();
		await expect(toyStoryEl).toBeChecked();

		// Checking an unchecking the uncontrolled checkbox should NOT affect the controller state
		await uncontrolledEl.check();
		await uncontrolledEl.uncheck();
		await expect(selectAllEl).toBeChecked();

		// Unchecking all controlled checkboxes should uncheck the controller
		await upEl.uncheck();
		await walleEl.uncheck();
		await toyStoryEl.uncheck();
		await expect(selectAllEl).not.toBeChecked();

		// Checking all controlled checkboxes should set a checked state on the controller
		await upEl.check();
		await walleEl.check();
		await toyStoryEl.check();
		await expect(selectAllEl).toBeChecked();

		// Clicking the controller while in a checked state should uncheck all controlled checkboxes
		await selectAllEl.uncheck();
		await expect(upEl).not.toBeChecked();
		await expect(walleEl).not.toBeChecked();
		await expect(toyStoryEl).not.toBeChecked();
	});

	test('options and settings', async ({ page }) => {
		await page.goto(`${testPath}/options.html`);

		// Get elements
		const selectAllEl = page.locator('#select-all');
		const upEl = page.locator('#up');
		const walleEl = page.locator('#wall-e');
		const toyStoryEl = page.locator('#toy-story');
		const uncontrolledEl = page.locator('#uncontrol');

		// Controller checkbox and all controlled checkboxes should be checked
		await expect(selectAllEl).toBeChecked();
		await expect(upEl).toBeChecked();
		await expect(walleEl).toBeChecked();
		await expect(toyStoryEl).toBeChecked();

		// The uncontrolled checkbox should NOT be checked
		await expect(uncontrolledEl).not.toBeChecked();
	});

	test('error handling', async ({ page }) => {
		await page.goto(`${testPath}/errors.html`);

		// Get elements
		const noTargetEl = page.getByTestId('no target');
		const noCheckboxEl = page.getByTestId('no checkbox');

		// No [is-ready] attribute
		await expect(noTargetEl).not.toHaveAttribute('is-ready');
		await expect(noCheckboxEl).not.toHaveAttribute('is-ready');
	});

	test('checkbox should be hidden until JS loads', async ({ page }) => {
		await page.goto(`${testPath}/no-js.html`);

		// Get elements
		const selectAllEl = page.locator('#select-all');

		// The checkbox is hidden
		await expect(selectAllEl).not.toBeVisible();
	});
});
