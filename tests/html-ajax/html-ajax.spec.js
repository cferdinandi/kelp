import { expect, test } from '@playwright/test';
import { testComponentReadyState } from '../test-utilities.js';

// Component details
const componentName = 'kelp-html-ajax';
const testPath = '/tests/html-ajax';

test.describe(`<${componentName}>`, () => {
	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {
		await page.goto(`${testPath}/default.html`);
		const startingText = 'Hello world!';

		// Elements
		const textEl = page.getByTestId('text');
		const btnEl = page.locator('#demo-button');

		// Component should have starting text
		await expect(textEl).toHaveText(startingText);

		// Update the component text manually
		await textEl.evaluate(elem => {
			elem.innerHTML = 'abc123';
		});
		await expect(textEl).toHaveText('abc123');

		// Focus on the button element
		await btnEl.focus();

		// Emit a custom event
		await page.evaluate(() => {
			const event = new CustomEvent('test-event', { bubbles: true });
			document.dispatchEvent(event);
		});

		// Component should update itself and revert to starting text
		await expect(textEl).toHaveText(startingText);

		// The replacement button should have focus
		await expect(btnEl).toBeFocused();
	});

	test('options and settings', async ({ page }) => {
		await page.goto(`${testPath}/options.html`);
		const startingText = 'Hello world!';

		// Elements
		const wc = page.locator(componentName);

		// Component should have starting text
		await expect(wc).toHaveText(startingText);

		// Update the component text manually
		await wc.evaluate(elem => {
			elem.innerHTML = 'abc123';
		});
		await expect(wc).toHaveText('abc123');
		await expect(wc).not.toHaveText(startingText);

		// Emit a custom event *without* the event-key
		await page.evaluate(() => {
			const event = new CustomEvent('test-event', { bubbles: true });
			document.dispatchEvent(event);
		});

		// Component should NOT update
		await expect(wc).not.toHaveText(startingText);

		// Emit a custom event *with* the event-key
		await page.evaluate(() => {
			const event = new CustomEvent('test-event', {
				bubbles: true,
				detail: { eventKeys: ['no-way'] },
			});
			document.dispatchEvent(event);
		});

		// Component should update itself and revert to starting text
		await expect(wc).toHaveText(startingText);
	});

	test('error handling', async ({ page }) => {
		await page.goto(`${testPath}/errors.html`);

		// Elements
		const wc = page.locator(componentName);

		// Element should be ready
		await expect(wc).not.toHaveAttribute('is-ready');
	});
});
