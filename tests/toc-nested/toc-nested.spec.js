import { test, expect } from '@playwright/test';
import { testComponentReadyState } from '../test-utilities.js';

// Component details
const componentName = 'kelp-toc-nested';
const testPath = '/tests/toc-nested';

test.describe(`<${componentName}>`, () => {

	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {

		await page.goto(`${testPath}/default.html`);

		// Get elements
		const links = page.locator('kelp-toc-nested li a');
		const numberOfLinks = await links.count();
		const heading = page.locator('#content h2');
		const headingID = await heading.first().evaluate((elem) => elem.id);
		const skipLevel = await page.locator('kelp-toc-nested').getByText('Sea Legs');
		const skipLevelListParent = await skipLevel.evaluate((elem) => elem.closest('ul').parentElement.tagName.toLowerCase());

		// Number of links should match number of headings
		await expect(numberOfLinks).toEqual(14);

		// Missing IDs are dynamically generated
		// and their values are used in the ToC
		await expect(headingID).toBeTruthy();
		await expect(links.first()).toHaveAttribute('href', `#${headingID}`);

		// Heading level jumps are correctly handled
		// @TODO fix in future PR
		// await expect(skipLevelListParent).toEqual('li');

	});

	test('options and settings', async ({ page }) => {

		await page.goto(`${testPath}/options.html`);

		// Get elements
		const links = page.locator('kelp-toc-nested li a');
		const numberOfLinks = await links.count();
		const listHeading = page.locator('kelp-toc-nested h3').first();
		const scopedLink = page.locator('kelp-toc-nested li a[href*="#man-of-war"]');
		const className = await page.locator('kelp-toc-nested ul').first().evaluate((elem) => elem.className);

		// [heading] is added to ToC and uses correct [heading-level]
		await expect(listHeading).toHaveText('On this page...');

		// Correct heading [levels] are targeted
		await expect(numberOfLinks).toEqual(4);

		// Headings are scoped to [target] container
		await expect(scopedLink).toBeVisible();

		// The [list-class] is used on the list
		await expect(className).toEqual('list-unstyled');

		// The [list-type] is used on the list

	});

	test('error handling', async ({ page }) => {

		await page.goto(`${testPath}/errors.html`);

		// Get elements
		const toc = page.locator('kelp-toc-nested').first();

		// no [is-ready] attribute
		await expect(toc).not.toHaveAttribute('is-ready');

		// no table of contents generated
		await expect(toc).toBeEmpty();

	});

});
