import { expect, test } from '@playwright/test';

// Component details
const componentName = 'kelp-hide-until-selected';
const testPath = '/tests/hide-until-selected';

test.describe(`<${componentName}>`, () => {
	test('component instantiates', async ({ page }) => {
		let isReady = false;
		page.on('console', (msg) => {
			if (msg.text() !== 'ready') return;
			isReady = true;
		});
		await page.goto(`${testPath}/default.html`);
		expect(isReady).toEqual(true);
		const component = page.locator(componentName).first();
		await expect(component).toHaveAttribute('is-ready');
	});

	test('default component', async ({ page }) => {
		await page.goto(`${testPath}/default.html`);

		// Get elements
		const targetEl1 = page.getByTestId('content 1');
		const targetEl2 = page.getByTestId('content 2');
		const upEl = page.locator('#up');
		const walleEl = page.locator('#wall-e');

		// Target content should be hidden by default
		await expect(targetEl1).not.toBeVisible();
		await expect(targetEl2).not.toBeVisible();

		// Checking any checkbox should show the target content
		await upEl.check();
		await expect(targetEl1).toBeVisible();
		await expect(targetEl2).toBeVisible();

		// As long as at least one checkbox is checked, unchecking others should NOT hide the content
		await walleEl.check();
		await upEl.uncheck();
		await expect(targetEl1).toBeVisible();
		await expect(targetEl2).toBeVisible();

		// Unchecking all checkboxes should hide the content
		await walleEl.uncheck();
		await expect(targetEl1).not.toBeVisible();
		await expect(targetEl2).not.toBeVisible();
	});

	test('options and settings', async ({ page }) => {
		await page.goto(`${testPath}/options.html`);

		// Get elements
		const targetEl1 = page.getByTestId('content 1');
		const targetEl2 = page.getByTestId('content 2');
		const targetEl3 = page.getByTestId('content 3');
		const upEl = page.locator('#up');
		const selectEl = page.getByTestId('select');
		const checkboxEl = page.getByTestId('checkbox');
		const inputEl = page.getByTestId('input');
		const btnEl = page.getByTestId('btn');

		// When at least one checkbox is checked, the content it controls should be visible by default
		await expect(upEl).toBeChecked();
		await expect(targetEl1).toBeVisible();
		await expect(targetEl2).toBeVisible();
		await expect(targetEl3).toBeVisible();

		// Unchecking the checkbox should hide the target content unless it has [action="disabled"]
		await upEl.uncheck();
		await expect(targetEl1).not.toBeVisible();
		await expect(targetEl2).not.toBeVisible();
		await expect(targetEl3).toBeVisible();

		// [action="disabled"] should disable inputs within the container
		await expect(selectEl).toHaveAttribute('disabled');
		await expect(checkboxEl).toHaveAttribute('disabled');
		await expect(inputEl).toHaveAttribute('disabled');
		await expect(btnEl).toHaveAttribute('disabled');

		// The [invisible] attribute should hide the element but maintain its space in the DOM
		const height = await targetEl2.evaluate((el) =>
			Number.parseInt(window.getComputedStyle(el).height, 10),
		);
		const width = await targetEl2.evaluate((el) =>
			Number.parseInt(window.getComputedStyle(el).width, 10),
		);
		expect(height).toBeGreaterThan(0);
		expect(width).toBeGreaterThan(0);
	});

	test('unchecked while focused within', async ({ page }) => {
		await page.goto(`${testPath}/focus.html`);

		// Get elements
		const targetEl = page.getByTestId('content');
		const btnEl = page.getByTestId('button');
		const upEl = page.locator('#up');
		const toyStoryEl = page.locator('#toy-story');

		// Show content and focus on button
		await toyStoryEl.check();
		await expect(targetEl).toBeVisible();
		await btnEl.focus();

		// Activate the button
		// (this unchecks toyStoryEl and emits a custom event)
		await btnEl.press('Enter');

		// Content should be hidden.
		// Focus should shift to the first checkbox.
		await expect(upEl).toBeFocused();
		await expect(targetEl).not.toBeVisible();
	});

	test('with <kelp-select-all>', async ({ page }) => {
		await page.goto(`${testPath}/with-select-all.html`);

		// Get elements
		const targetEl1 = page.getByTestId('content 1');
		const targetEl2 = page.getByTestId('content 2');
		const targetEl3 = page.getByTestId('content 3');
		const selectAllEl = page.locator('#select-all');
		const selectEl = page.getByTestId('select');
		const checkboxEl = page.getByTestId('checkbox');
		const inputEl = page.getByTestId('input');
		const btnEl = page.getByTestId('btn');

		// Checking the select-all checkbox should show the target content
		await selectAllEl.check();
		await expect(targetEl1).toBeVisible();
		await expect(targetEl2).toBeVisible();
		await expect(targetEl3).toBeVisible();

		// Unchecking the select-all checkbox should hide the target content unless it has [action="disabled"]
		await selectAllEl.uncheck();
		await expect(targetEl1).not.toBeVisible();
		await expect(targetEl2).not.toBeVisible();
		await expect(targetEl3).toBeVisible();

		// Content in the [action="disabled"] target should be disabled
		await expect(selectEl).toHaveAttribute('disabled');
		await expect(checkboxEl).toHaveAttribute('disabled');
		await expect(inputEl).toHaveAttribute('disabled');
		await expect(btnEl).toHaveAttribute('disabled');
	});

	test('error handling', async ({ page }) => {
		await page.goto(`${testPath}/errors.html`);

		// Get elements
		const wc = page.locator(componentName);

		// No [is-ready] attribute
		await expect(wc).not.toHaveAttribute('is-ready');
	});

	test('content should be visible if JS has not loaded', async ({ page }) => {
		await page.goto(`${testPath}/no-js.html`);

		// Get elements
		const targetEl1 = page.getByTestId('content 1');
		const targetEl2 = page.getByTestId('content 2');
		const targetEl3 = page.getByTestId('content 3');

		// The content is visible
		await expect(targetEl1).toBeVisible();
		await expect(targetEl2).toBeVisible();
		await expect(targetEl3).toBeVisible();
	});
});
