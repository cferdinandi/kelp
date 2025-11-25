import { expect, test } from '@playwright/test';
import { testComponentReadyState } from '../test-utilities.js';

// Component details
const componentName = 'kelp-form-ajax';
const testPath = '/tests/form-ajax';

test.describe(`<${componentName}>`, () => {
	test.beforeEach(async ({ page }) => {
		const success = {
			ok: true,
			message: 'Your form was submitted.',
			url: 'success.html',
		};

		const failed = {
			ok: false,
			error: `Oh no! It didn't work.`,
		};

		await page.route('**/api/api-merge.json', (route, request) => {
			const params = new URL(request.url()).searchParams;
			const hasMerged =
				params.get('id') === 'abc123' &&
				params.get('features') === 'kitchen sink';
			const status = hasMerged ? 200 : 400;
			const body = hasMerged ? JSON.stringify(failed) : JSON.stringify(success);

			return route.fulfill({
				status,
				contentType: 'application/json',
				body,
			});
		});
	});

	test.afterEach(async ({ page }) => {
		await page.unroute('**/api/api-merge.json');
	});

	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {
		await page.goto(`${testPath}/default.html`);

		// Get elements
		const wc = page.locator(componentName);
		const announce = page.locator('[role="status"]');
		const nameField = page.locator('[name="username"]');
		const submitBtn = page.locator('button');

		// Listen for success event
		let isSuccess = false;
		page.on('console', (msg) => {
			if (msg.text() !== 'success') return;
			isSuccess = true;
		});

		// A status element is rendered after the form with an ARIA live region
		await expect(announce).toBeEmpty();
		const previousSibling = await announce.evaluate((elem) => {
			return elem.previousElementSibling?.tagName.toLowerCase();
		});
		expect(previousSibling).toBe('form');

		// Submit the form
		await nameField.fill('Merlin');
		await submitBtn.click();

		// The fields are cleared on success
		await expect(nameField).toBeEmpty();

		// The form no longer has an [is-submitting] attribute
		await expect(wc).not.toHaveAttribute('is-submitting');

		// The status element is empty and hidden
		await expect(announce).toBeEmpty();

		// The success event was emitted
		expect(isSuccess).toEqual(true);
	});

	test('options and settings', async ({ page }) => {
		await page.goto(`${testPath}/options.html`);

		// Get elements
		const wc = page.locator(componentName);
		const announce = page.locator('[role="status"]');
		const nameField = page.locator('[name="username"]');
		const submitBtn = page.locator('button');

		// Listen for success event
		let isSuccess = false;
		page.on('console', (msg) => {
			if (msg.text() !== 'success') return;
			isSuccess = true;
		});

		// A status element is rendered before the form
		const nextSibling = await announce.evaluate((elem) => {
			return elem.nextElementSibling?.tagName.toLowerCase();
		});
		expect(nextSibling).toBe('form');

		// Submit the form
		await nameField.fill('Merlin');
		await submitBtn.click();

		// The fields are NOT cleared on success
		await expect(nameField).not.toBeEmpty();

		// A custom success message is rendered
		await expect(announce).toHaveText('Form submitted!');

		// The status message has custom classes
		await expect(announce).toHaveClass('success callout');

		// The form remains inactive for a few moments
		await expect(wc).toHaveAttribute('is-submitting');

		// The success message is cleared
		await expect(announce).toBeEmpty();

		// A custom event key is emitted with the success event
		expect(isSuccess).toEqual(true);
	});

	test('default error message', async ({ page }) => {
		await page.goto(`${testPath}/error-default.html`);

		// Get elements
		const wc = page.locator(componentName);
		const announce = page.locator('[role="status"]');
		const nameField = page.locator('[name="username"]');
		const submitBtn = page.locator('button');

		// Listen for failed event
		let isFailed = false;
		page.on('console', (msg) => {
			if (msg.text() !== 'failed') return;
			isFailed = true;
		});

		// Submit the form
		await nameField.fill('Merlin');
		await submitBtn.click();

		// The fields are NOT cleared on success
		await expect(nameField).not.toBeEmpty();

		// The form no longer has an [is-submitting] attribute
		await expect(wc).not.toHaveAttribute('is-submitting');

		// The status element has the default error message
		await expect(announce).toHaveText(
			'Something went wrong. Unable to submit form.',
		);

		// The failed event was emitted
		expect(isFailed).toEqual(true);
	});

	test('custom error message', async ({ page }) => {
		await page.goto(`${testPath}/error-custom.html`);

		// Get elements
		const announce = page.locator('[role="status"]');
		const nameField = page.locator('[name="username"]');
		const submitBtn = page.locator('button');

		// Submit the form
		await nameField.fill('Merlin');
		await submitBtn.click();

		// The status element has the default error message
		await expect(announce).toHaveText('Oh no! Please try again.');
	});

	test('error message from API response path', async ({ page }) => {
		await page.goto(`${testPath}/error-response.html`);

		// Get elements
		const announce = page.locator('[role="status"]');
		const nameField = page.locator('[name="username"]');
		const submitBtn = page.locator('button');

		// Submit the form
		await nameField.fill('Merlin');
		await submitBtn.click();

		// The status element has the default error message
		await expect(announce).toHaveText(`Oh no! It didn't work.`);
	});

	test('success message from API response path', async ({ page }) => {
		await page.goto(`${testPath}/success-response.html`);

		// Get elements
		const announce = page.locator('[role="status"]');
		const nameField = page.locator('[name="username"]');
		const submitBtn = page.locator('button');

		// Submit the form
		await nameField.fill('Merlin');
		await submitBtn.click();

		// The status element has the default error message
		await expect(announce).toHaveText('Your form was submitted.');
	});

	test('form removed after success', async ({ page }) => {
		await page.goto(`${testPath}/success-remove-form.html`);

		// Get elements
		const form = page.locator('form');
		const announce = page.locator('[role="status"]');
		const nameField = page.locator('[name="username"]');
		const submitBtn = page.locator('button');

		// Submit the form
		await nameField.fill('Merlin');
		await submitBtn.click();

		// The status element has a custom error message
		await expect(announce).toHaveText('Success!');

		// The form no longer exists
		await expect(form).not.toBeVisible();
	});

	test('redirect on success', async ({ page }) => {
		await page.goto(`${testPath}/success-redirect.html`);

		// Get elements
		const nameField = page.locator('[name="username"]');
		const submitBtn = page.locator('button');

		// Submit the form
		await nameField.fill('Merlin');
		await submitBtn.click();

		// The URL has changed
		await expect(page).toHaveURL(/success\.html/);
	});

	test('redirect from API response path on success', async ({ page }) => {
		await page.goto(`${testPath}/success-redirect-from-response.html`);

		// Get elements
		const nameField = page.locator('[name="username"]');
		const submitBtn = page.locator('button');

		// Submit the form
		await nameField.fill('Merlin');
		await submitBtn.click();

		// The URL has changed
		await expect(page).toHaveURL(/success\.html/);
	});

	test('loading spinner displays', async ({ page }) => {
		await page.goto(`${testPath}/loading.html`);

		// Get elements
		const form = page.getByTestId('form');
		const loadingIcon = page.locator('[data-testid="wc"] [loading-icon]');
		const spinner = page.locator('[submit-loading="size-m success"] .spinner');

		// Form should be visually hidden but still have height and width
		const height = await form.evaluate((el) =>
			Number.parseInt(window.getComputedStyle(el).height, 10),
		);
		const width = await form.evaluate((el) =>
			Number.parseInt(window.getComputedStyle(el).width, 10),
		);
		await expect(form).not.toBeVisible();
		expect(height).toBeGreaterThan(0);
		expect(width).toBeGreaterThan(0);

		// Spinner should be visible
		await expect(loadingIcon).toBeVisible();

		// Spinner custom styles should be applied
		await expect(spinner).toHaveClass('spinner size-m success');
	});

	test('include data from other forms in request', async ({ page }) => {
		await page.goto(`${testPath}/external-forms.html`);

		// Get elements
		const featuresField = page.locator('[name="features"]');
		const announce = page.locator('[role="status"]');
		const submitBtn = page.locator('button');

		// The field starts empty
		await expect(featuresField).toBeEmpty();

		// Submit the form
		await featuresField.fill('kitchen sink');
		await submitBtn.click();

		// The fields are cleared on success
		await expect(featuresField).toBeEmpty();

		// A success message to be rendered
		await expect(announce).toHaveText('success');
	});

	test('keep external form fields on success', async ({ page }) => {
		await page.goto(`${testPath}/external-form-options.html`);

		// Get elements
		const featuresField = page.locator('[name="features"]');
		const announce = page.locator('[role="status"]');
		const submitBtn = page.locator('button');

		// The field starts empty
		await expect(featuresField).toBeEmpty();

		// Submit the form
		await featuresField.fill('kitchen sink');
		await submitBtn.click();

		// The fields are NOT cleared on success
		await expect(featuresField).not.toBeEmpty();

		// A success message to be rendered
		await expect(announce).toHaveText('success');
	});

	test('error handling', async ({ page }) => {
		await page.goto(`${testPath}/errors.html`);

		// Get elements
		const wc = page.locator(componentName);

		// no [is-ready] attribute
		await expect(wc).not.toHaveAttribute('is-ready');
	});
});
