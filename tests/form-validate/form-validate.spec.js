import { expect, test } from '@playwright/test';
import { testComponentReadyState } from '../test-utilities.js';

// Component details
const componentName = 'kelp-form-validate';
const testPath = '/tests/form-validate';

// Add custom validator
expect.extend({
	async toHaveError(locator) {
		const hasError = await locator.evaluate((field) => {
			if (!(field instanceof HTMLElement)) return false;

			// Check if field is part of a validation input group
			const isGroup = field.closest('[validate-group]');

			// Has [aria-invalid="true"] attribute
			if (field.getAttribute('aria-invalid') !== 'true') return false;

			// Has an [aria-describedby] attribute
			const errorID = field.getAttribute('aria-describedby');
			if (!errorID) return false;

			// Has an element with an error message directly after it (or the last child for fieldset elements)
			// The error message has an ID that matches the [aria-describedby] value
			// The error message has the .validation-error class
			const errorEl = isGroup
				? field.lastElementChild
				: field.nextElementSibling;

			if (
				!errorEl ||
				!errorEl.textContent.length ||
				errorEl.id !== errorID ||
				!errorEl.classList.contains('validation-error')
			)
				return false;

			// If field has the [validate-msg] attribute, it should display its value as a custom error message
			const customMsg = field.getAttribute('validate-msg');
			if (customMsg && errorEl.textContent !== customMsg) return false;

			return true;
		});

		if (hasError) {
			return {
				message: () => 'Field has an error.',
				pass: true,
			};
		}

		return {
			message: () => 'Field has no error.',
			pass: false,
		};
	},
});

test.describe(`<${componentName}>`, () => {
	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {
		await page.goto(`${testPath}/default.html`);

		// Get elements
		const form = page.locator('form');
		const username = page.locator('#username');
		const email = page.locator('#email');
		const auth = page.locator('#code');
		const description = page.locator('#description');
		const wizard = page.locator('#wizard');
		const radio = page.getByTestId('radio');
		const checkbox = page.getByTestId('checkbox');
		const firstRadio = page.locator('#up');
		const firstCheckbox = page.locator('#up-2');
		const submit = page.locator('button');

		// Field collections
		const constrainedFields = [email, auth, description, wizard];
		const constrainedGroups = [radio, checkbox];

		// Listen for success event
		let isSuccess = false;
		page.on('console', (msg) => {
			if (msg.text() !== 'success') return;
			isSuccess = true;
		});

		// Listen for failed event
		let isFailed = false;
		page.on('console', (msg) => {
			if (msg.text() !== 'failed') return;
			isFailed = true;
		});

		// Form has [novalidate] attribute
		await expect(form).toHaveAttribute('novalidate');

		// Enter invalid data into a single field
		// No error should be displayed
		await email.fill('merlin');
		// @ts-expect-error Custom method
		await expect(email).not.toHaveError();

		// Leave the field
		// An error should be displayed
		await auth.focus();
		// @ts-expect-error Custom method
		await expect(email).toHaveError();

		// Try to submit form with empty/invalid fields
		// Form should not submit
		await submit.click();
		await expect(form).toBeVisible();

		// The failed event was emitted
		expect(isFailed).toEqual(true);

		// Unconstrained field should have no errors
		// @ts-expect-error Custom method
		await expect(username).not.toHaveError();

		// Focus shifts to the first invalid field
		await expect(email).toBeFocused();

		// All constrained fields should have errors
		for (const field of constrainedFields) {
			// @ts-expect-error Custom method
			await expect(field).toHaveError();
		}

		// Once invalid, fields should re-validate as the user types
		await email.fill('merlin@wizardschool.com');
		// @ts-expect-error Custom method
		await expect(email).not.toHaveError();

		// All constrained fieldsets should have errors
		for (const group of constrainedGroups) {
			// @ts-expect-error Custom method
			await expect(group).toHaveError();
		}

		// Resolve all text fields (but not fieldset groups)
		await auth.fill('12345');
		await description.fill('abcdefghijklmnop');
		await wizard.selectOption('merlin');

		// Try to submit again
		// Form still does not submit
		await submit.click();
		await expect(form).toBeVisible();

		// Valid and unconstrained fields should have no errors
		for (const field of [username, ...constrainedFields]) {
			// @ts-expect-error Custom method
			await expect(field).not.toHaveError();
		}

		// Focus shifts to the first checkbox or radio element within the fieldgroup
		await expect(firstRadio).toBeFocused();

		// Checking an item within the fieldset group should remove the error
		await firstRadio.check();
		// @ts-expect-error Custom method
		await expect(radio).not.toHaveError();
		// @ts-expect-error Custom method
		await expect(checkbox).toHaveError();
		await firstCheckbox.check();
		// @ts-expect-error Custom method
		await expect(checkbox).not.toHaveError();

		// The form should submit successfully
		await submit.click();
		await expect(form).not.toBeVisible();

		// Success event should be emitted
		expect(isSuccess).toEqual(true);
	});

	test('with the kelp-form-ajax component', async ({ page }) => {
		await page.goto(`${testPath}/ajax.html`);

		// Get elements
		const form = page.locator('form');
		const username = page.locator('#username');
		const submit = page.locator('button');

		// Form does not submit while there are errors
		await submit.click();
		// @ts-expect-error Custom method
		await expect(username).toHaveError();
		await expect(form).toBeVisible();

		// Fix errors
		await username.fill('merlin');
		// @ts-expect-error Custom method
		await expect(username).not.toHaveError();

		// The form submits
		await submit.click();
		await expect(form).not.toBeVisible();
	});

	test('error handling', async ({ page }) => {
		await page.goto(`${testPath}/errors.html`);

		// Get elements
		const wc = page.locator(componentName);

		// no [is-ready] attribute
		await expect(wc).not.toHaveAttribute('is-ready');
	});
});
