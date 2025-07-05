import { test, expect } from '@playwright/test';
import { testComponentReadyState } from '../test-utilities.js';


test.describe('<kelp-toc>', () => {

	testComponentReadyState('kelp-toc', '/tests/toc');

	test('one nav item is generated per heading', async ({ page }) => {
		await page.goto('/tests/toc');
		const links = await page.getByTestId('toc-1').locator('ul li a').count();
		const h2s = await page.locator('h2').count();
		expect(links).toEqual(h2s);
	});

	test('anchor links are generated', async ({ page }) => {
		await page.goto('/tests/toc');
		const heading = page.getByTestId('heading-with-id').first();
		const id = await heading.evaluate((elem) => elem.id);
		const toc = page.getByTestId('toc-1');
		await expect(toc.locator(`[href*="#${id}"]`)).toBeVisible();
	});

	test('missing IDs are dynamically generated', async ({ page }) => {
		await page.goto('/tests/toc');
		const heading = page.getByTestId('heading-no-id').first();
		const id = await heading.evaluate((elem) => elem.id);
		expect(id).toBeTruthy();
		const toc = page.getByTestId('toc-1');
		await expect(toc.locator(`[href*="#${id}"]`)).toBeVisible();
	});

	test('[heading] added to TOC', async ({ page }) => {
		await page.goto('/tests/toc');
		const toc = page.getByTestId('toc-2');
		const headingText = await toc.locator('li').first().evaluate((elem) => elem.textContent);
		const headingAtt = await toc.evaluate((elem) => elem.getAttribute('heading'));
		expect(headingText).toBe(headingAtt);
	});

	test('correct heading [level] is targeted', async ({ page }) => {
		await page.goto('/tests/toc');
		const toc = page.getByTestId('toc-3');
		const level = await toc.evaluate((elem) => elem.getAttribute('level'));
		const heading = page.locator(level).first();
		const headingText = await heading.evaluate((elem) => elem.textContent);
		await expect(toc.locator('ul').getByText(headingText)).toBeVisible();
		const ignoredHeading = page.locator('h2').first();
		const ignoredHeadingText = await ignoredHeading.evaluate((elem) => elem.textContent);
		await expect(toc.locator('ul').getByText(ignoredHeadingText)).not.toBeVisible();
	});

	test('headings scoped to [target] subsection', async ({ page }) => {
		await page.goto('/tests/toc');
		const toc = page.getByTestId('toc-4');
		const headings = page.getByTestId('subsection').locator('h2');
		expect(await toc.locator('li').count()).toBe(await headings.count());
	});

	test('list has [list-class] class', async ({ page }) => {
		await page.goto('/tests/toc');
		const toc = page.getByTestId('toc-5');
		const classNames = await toc.evaluate((elem) => elem.getAttribute('list-class'));
		const listClass = await toc.locator('ul').evaluate((elem) => elem.className);
		expect(listClass).toEqual(classNames);
	});

	// Validate classic synchronous (parser-blocking) <script> tags. If this component is defined early, its
	// connectedCallback will run immediately and runs the risk of not finding the headings if they are not yet parsed.
	test('classic <script>: one nav item is generated per heading', async ({ page }) => {
		await page.goto('/tests/toc/classic-script.html');
		const links = await page.locator('kelp-toc').locator('ul li a').count();
		const h2s = await page.locator('h2').count();
		expect(links).toEqual(h2s);
	});
});
