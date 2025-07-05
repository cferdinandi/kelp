import { test, expect } from '@playwright/test';
import { testComponentReadyState, testDebugEvent } from '../test-utilities.js';


test.describe('<kelp-toc-nested>', () => {

	testComponentReadyState('kelp-toc-nested', '/tests/toc-nested');
	testDebugEvent('/tests/toc-nested', 'toc-8');

	test('one nav item is generated per heading', async ({ page }) => {
		await page.goto('/tests/toc-nested');
		const links = await page.getByTestId('toc-1').getByRole('listitem').count();
		const headings = await page.getByTestId('content').getByRole('heading').count();
		expect(links).toEqual(headings);
	});

	test('anchor links are generated', async ({ page }) => {
		await page.goto('/tests/toc-nested');
		const heading = page.getByTestId('heading-with-id').first();
		const id = await heading.evaluate((elem) => elem.id);
		const toc = page.getByTestId('toc-1');
		await expect(toc.locator(`[href*="#${id}"]`)).toBeVisible();
	});

	test('missing IDs are dynamically generated', async ({ page }) => {
		await page.goto('/tests/toc-nested');
		const heading = page.getByTestId('heading-no-id').first();
		const id = await heading.evaluate((elem) => elem.id);
		expect(id).toBeTruthy();
		const toc = page.getByTestId('toc-1');
		await expect(toc.locator(`[href*="#${id}"]`)).toBeVisible();
	});

	test('[heading] added to TOC', async ({ page }) => {
		await page.goto('/tests/toc-nested');
		const toc = page.getByTestId('toc-2');
		const headingText = await toc.getByRole('heading').first().evaluate((elem) => elem.textContent);
		const headingAtt = await toc.evaluate((elem) => elem.getAttribute('heading'));
		expect(headingText).toBe(headingAtt);
	});

	test('correct [heading-level] is used', async ({ page }) => {
		await page.goto('/tests/toc-nested');
		const toc = page.getByTestId('toc-3');
		const headingLevel = await toc.getByRole('heading').first().evaluate((elem) => elem.tagName.toLowerCase());
		const headingLevelAtt = await toc.evaluate((elem) => elem.getAttribute('heading-level'));
		expect(headingLevel).toBe(headingLevelAtt);
	});

	test('correct heading [levels] are targeted', async ({ page }) => {
		await page.goto('/tests/toc-nested');
		const toc = page.getByTestId('toc-4');
		const levels = await toc.evaluate((elem) => elem.getAttribute('levels'));
		const heading = page.getByTestId('content').locator(levels).first();
		const headingText = await heading.evaluate((elem) => elem.textContent);
		await expect(toc.locator('ul').getByText(headingText)).toBeVisible();
		const ignoredHeading = page.getByTestId('content').locator('h2').first();
		const ignoredHeadingText = await ignoredHeading.evaluate((elem) => elem.textContent);
		await expect(toc.locator('ul').getByText(ignoredHeadingText)).not.toBeVisible();
	});

	test('headings scoped to [target] subsection', async ({ page }) => {
		await page.goto('/tests/toc-nested');
		const toc = page.getByTestId('toc-5');
		const headings = page.getByTestId('subsection').getByRole('heading');
		expect(await toc.locator('li').count()).toBe(await headings.count());
	});

	test('list has [list-class] class', async ({ page }) => {
		await page.goto('/tests/toc-nested');
		const toc = page.getByTestId('toc-6');
		const classNames = await toc.evaluate((elem) => elem.getAttribute('list-class'));
		const listClass = await toc.locator('ul').first().evaluate((elem) => elem.className);
		expect(listClass).toEqual(classNames);
	});

	test('correct [list-type] is used', async ({ page }) => {
		await page.goto('/tests/toc-nested');
		const toc = page.getByTestId('toc-7');
		const listType = await toc.getByRole('list').first().evaluate((elem) => elem.tagName.toLowerCase());
		const listTypeAtt = await toc.evaluate((elem) => elem.getAttribute('list-type'));
		expect(listType).toBe(listTypeAtt);
	});

});
