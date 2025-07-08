import { test, expect } from '@playwright/test';
import { testComponentReadyState } from '../test-utilities.js';

// Component details
const componentName = 'kelp-toc';
const testPath = '/tests/toc';

test.describe(`<${componentName}>`, () => {

	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {

		await page.goto(`${testPath}/default.html`);

		// Get elements
		const links = page.locator('kelp-toc li a');
		const numberOfLinks = await links.count();
		const heading = page.locator('h2');
		const headingID = await heading.first().evaluate((elem) => elem.id);

		// Number of links should match number of H2 headings
		await expect(numberOfLinks).toEqual(5);

		// Missing IDs are dynamically generated
		// and their values are used in the ToC
		await expect(headingID).toBeTruthy();
		await expect(links.first()).toHaveAttribute('href', `#${headingID}`);

	});

	test('options and settings', async ({ page }) => {

		await page.goto(`${testPath}/options.html`);

		// Get elements
		const links = page.locator('kelp-toc li a');
		const numberOfLinks = await links.count();
		const listHeading = page.locator('kelp-toc li').first();
		const scopedLink = page.locator('kelp-toc li a[href*="#man-of-war"]');
		const className = await page.locator('kelp-toc ul').first().evaluate((elem) => elem.className);

		// [heading] is added to ToC
		await expect(listHeading).toHaveText('On this page...');

		// Correct heading [level] is targeted
		await expect(numberOfLinks).toEqual(3);

		// Headings are scoped to [target] container
		await expect(scopedLink).toBeVisible();

		// The [list-class] is used on the list
		await expect(className).toEqual('list-unstyled');

	});

	test('error handling', async ({ page }) => {

		await page.goto(`${testPath}/errors.html`);

		// Get elements
		const toc = page.locator('kelp-toc').first();

		// no [is-ready] attribute
		await expect(toc).not.toHaveAttribute('is-ready');

		// no table of contents generated
		await expect(toc).toBeEmpty();

	});

});
