import { expect, test } from '@playwright/test';

// Component details
const componentName = 'temporal inputs';
const testPath = '/tests/temporal-inputs';

test.describe(componentName, () => {
	test('should match size of text inputs', async ({ page }) => {
		await page.goto(`${testPath}/default.html`);

		// Elements
		const text = page.locator('#text').first();
		const date = page.locator('#date').first();
		const time = page.locator('#time').first();
		const datetime = page.locator('#datetime-local').first();

		// Dimensions
		const textXY = await text.evaluate((elem) => {
			const dimensions = window.getComputedStyle(elem);
			return {
				width: dimensions.width,
				height: dimensions.height,
			};
		});
		const dateXY = await date.evaluate((elem) => {
			const dimensions = window.getComputedStyle(elem);
			return {
				width: dimensions.width,
				height: dimensions.height,
			};
		});
		const timeXY = await time.evaluate((elem) => {
			const dimensions = window.getComputedStyle(elem);
			return {
				width: dimensions.width,
				height: dimensions.height,
			};
		});
		const datetimeXY = await datetime.evaluate((elem) => {
			const dimensions = window.getComputedStyle(elem);
			return {
				width: dimensions.width,
				height: dimensions.height,
			};
		});

		// Height and width of temporals should match text input
		await expect(dateXY).toEqual(textXY);
		await expect(timeXY).toEqual(textXY);
		await expect(datetimeXY).toEqual(textXY);
	});
});
