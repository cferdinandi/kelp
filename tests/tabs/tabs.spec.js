import { expect, test } from '@playwright/test';
import {
	testComponentReadyState,
	waitForCustomEvent,
} from '../test-utilities.js';

// Component details
const componentName = 'kelp-tabs';
const testPath = '/tests/tabs';

test.describe(`<${componentName}>`, () => {
	testComponentReadyState(componentName, testPath);

	test('default component', async ({ page }) => {
		await page.goto(`${testPath}/default.html`);

		// Get elements
		const wc = page.locator(componentName);
		const tabList = page.locator('[tabs]');
		const tabListItems = tabList.locator('li');
		const wizardTab = page.locator('[aria-controls="wizard"]');
		const sorcererTab = page.locator('[aria-controls="sorcerer"]');
		const druidTab = page.locator('[aria-controls="druid"]');
		const fairyTab = page.locator('[aria-controls="fairy"]');
		const wizardPane = page.locator('#wizard');
		const sorcererPane = page.locator('#sorcerer');
		const druidPane = page.locator('#druid');
		const tabs = [wizardTab, sorcererTab, druidTab];
		const panes = [wizardPane, sorcererPane, druidPane];
		const wizardBtn = wizardPane.locator('button');

		// All tab panes except for first should be hidden
		await expect(wizardPane).toBeVisible();
		await expect(sorcererPane).not.toBeVisible();
		await expect(druidPane).not.toBeVisible();

		// Tabs without matching content should be hidden
		await expect(fairyTab).not.toBeVisible();

		// All elements should have correct ARIA attributes
		await expect(tabList).toHaveAttribute('role', 'tablist');
		for (const item of await tabListItems.all()) {
			await expect(item).toHaveAttribute('role', 'presentation');
		}
		for (const tab of tabs) {
			const id = await tab
				.first()
				.evaluate((elem) => elem.getAttribute('aria-controls'));
			await expect(tab).toHaveAttribute('role', 'tab');
			await expect(tab).toHaveAttribute(
				'aria-selected',
				id === 'wizard' ? 'true' : 'false',
			);
		}
		await expect(sorcererTab).toHaveAttribute('tabindex', '-1');
		await expect(druidTab).toHaveAttribute('tabindex', '-1');
		for (const pane of panes) {
			await expect(pane).toHaveAttribute('role', 'tabpanel');
			await expect(pane).toHaveAttribute('aria-labelledby');
		}

		// Clicking on a tab should...
		await druidTab.click();
		// 1. Reveal it's content
		await expect(druidPane).toBeVisible();
		// 2. Hide the other content
		await expect(wizardPane).not.toBeVisible();
		await expect(sorcererPane).not.toBeVisible();
		// 3. Update ARIA on all elements
		await expect(wizardTab).toHaveAttribute('tabindex', '-1');
		await expect(wizardTab).toHaveAttribute('aria-selected', 'false');
		await expect(sorcererTab).toHaveAttribute('tabindex', '-1');
		await expect(sorcererTab).toHaveAttribute('aria-selected', 'false');
		await expect(druidTab).not.toHaveAttribute('tabindex');
		await expect(druidTab).toHaveAttribute('aria-selected', 'true');
		// 4. Not update the URL
		await expect(page).not.toHaveURL(/#druid/);

		// Pressing the left arrow key while a tab has focus should...
		await druidTab.press('ArrowLeft');
		// 1. Reveal the previous tab content
		await expect(sorcererPane).toBeVisible();
		// 2. Hide the other content
		await expect(wizardPane).not.toBeVisible();
		await expect(druidPane).not.toBeVisible();
		// 3. Update ARIA on all elements
		await expect(wizardTab).toHaveAttribute('tabindex', '-1');
		await expect(wizardTab).toHaveAttribute('aria-selected', 'false');
		await expect(druidTab).toHaveAttribute('tabindex', '-1');
		await expect(druidTab).toHaveAttribute('aria-selected', 'false');
		await expect(sorcererTab).not.toHaveAttribute('tabindex');
		await expect(sorcererTab).toHaveAttribute('aria-selected', 'true');

		// Pressing the right arrow key while a tab has focus should...
		await sorcererTab.press('ArrowRight');
		// 1. Reveal the next tab content
		await expect(druidPane).toBeVisible();
		// 2. Hide the other content
		await expect(wizardPane).not.toBeVisible();
		await expect(sorcererPane).not.toBeVisible();
		// 3. Update ARIA on all elements
		await expect(wizardTab).toHaveAttribute('tabindex', '-1');
		await expect(wizardTab).toHaveAttribute('aria-selected', 'false');
		await expect(sorcererTab).toHaveAttribute('tabindex', '-1');
		await expect(sorcererTab).toHaveAttribute('aria-selected', 'false');
		await expect(druidTab).not.toHaveAttribute('tabindex');
		await expect(druidTab).toHaveAttribute('aria-selected', 'true');

		// Pressing the right arrow key while the last tab has focus should change nothing...
		await druidTab.press('ArrowRight');
		await expect(druidPane).toBeVisible();
		await expect(wizardPane).not.toBeVisible();
		await expect(sorcererPane).not.toBeVisible();
		await expect(wizardTab).toHaveAttribute('tabindex', '-1');
		await expect(wizardTab).toHaveAttribute('aria-selected', 'false');
		await expect(sorcererTab).toHaveAttribute('tabindex', '-1');
		await expect(sorcererTab).toHaveAttribute('aria-selected', 'false');
		await expect(druidTab).not.toHaveAttribute('tabindex');
		await expect(druidTab).toHaveAttribute('aria-selected', 'true');

		// Pressing the left arrow key while the first tab has focus should change nothing...
		await wizardTab.click();
		await wizardTab.press('ArrowLeft');
		await expect(wizardPane).toBeVisible();
		await expect(druidPane).not.toBeVisible();
		await expect(sorcererPane).not.toBeVisible();
		await expect(druidTab).toHaveAttribute('tabindex', '-1');
		await expect(druidTab).toHaveAttribute('aria-selected', 'false');
		await expect(sorcererTab).toHaveAttribute('tabindex', '-1');
		await expect(sorcererTab).toHaveAttribute('aria-selected', 'false');
		await expect(wizardTab).not.toHaveAttribute('tabindex');
		await expect(wizardTab).toHaveAttribute('aria-selected', 'true');

		// Pressing the tab key should shift focus to the next visible focusable element that is NOT a tab
		await wizardTab.press('Tab');
		await expect(wizardBtn).toBeFocused();

		const beforeEventPromise = waitForCustomEvent(
			wc,
			'kelp-tabs:select-before',
		);
		const afterEventPromise = waitForCustomEvent(wc, 'kelp-tabs:select');
		await druidTab.click();
		const beforeEvent = await beforeEventPromise;
		const afterEvent = await afterEventPromise;
		await expect(beforeEvent).toHaveProperty('currentTab');
		await expect(beforeEvent).toHaveProperty('currentPane');
		await expect(beforeEvent).toHaveProperty('nextTab');
		await expect(beforeEvent).toHaveProperty('nextTab');
		await expect(afterEvent).toHaveProperty('tab');
		await expect(afterEvent).toHaveProperty('pane');
	});

	test('options and settings', async ({ page }) => {
		await page.goto(`${testPath}/options.html`);

		// Get elements
		const tabList = page.locator('[tabs]');
		const wizardTab = page.locator('[aria-controls="wizard"]');
		const sorcererTab = page.locator('[aria-controls="sorcerer"]');
		const druidTab = page.locator('[aria-controls="druid"]');
		const wizardPane = page.locator('#wizard');
		const sorcererPane = page.locator('#sorcerer');
		const druidPane = page.locator('#druid');

		// Tab list should have the aria-orientation attribute
		await expect(tabList).toHaveAttribute('aria-orientation', 'vertical');

		// Specifying a starting tab should activate that tab on instantiation
		await expect(druidPane).toBeVisible();
		await expect(wizardPane).not.toBeVisible();
		await expect(sorcererPane).not.toBeVisible();
		await expect(wizardTab).toHaveAttribute('tabindex', '-1');
		await expect(wizardTab).toHaveAttribute('aria-selected', 'false');
		await expect(sorcererTab).toHaveAttribute('tabindex', '-1');
		await expect(sorcererTab).toHaveAttribute('aria-selected', 'false');
		await expect(druidTab).not.toHaveAttribute('tabindex');
		await expect(druidTab).toHaveAttribute('aria-selected', 'true');

		// Pressing the up arrow key while a tab has focus should...
		await druidTab.press('ArrowUp');
		// 1. Reveal the previous tab content
		await expect(sorcererPane).toBeVisible();
		// 2. Hide the other content
		await expect(wizardPane).not.toBeVisible();
		await expect(druidPane).not.toBeVisible();
		// 3. Update ARIA on all elements
		await expect(wizardTab).toHaveAttribute('tabindex', '-1');
		await expect(wizardTab).toHaveAttribute('aria-selected', 'false');
		await expect(druidTab).toHaveAttribute('tabindex', '-1');
		await expect(druidTab).toHaveAttribute('aria-selected', 'false');
		await expect(sorcererTab).not.toHaveAttribute('tabindex');
		await expect(sorcererTab).toHaveAttribute('aria-selected', 'true');

		// Pressing the down arrow key while a tab has focus should...
		await sorcererTab.press('ArrowDown');
		// 1. Reveal the next tab content
		await expect(druidPane).toBeVisible();
		// 2. Hide the other content
		await expect(wizardPane).not.toBeVisible();
		await expect(sorcererPane).not.toBeVisible();
		// 3. Update ARIA on all elements
		await expect(wizardTab).toHaveAttribute('tabindex', '-1');
		await expect(wizardTab).toHaveAttribute('aria-selected', 'false');
		await expect(sorcererTab).toHaveAttribute('tabindex', '-1');
		await expect(sorcererTab).toHaveAttribute('aria-selected', 'false');
		await expect(druidTab).not.toHaveAttribute('tabindex');
		await expect(druidTab).toHaveAttribute('aria-selected', 'true');

		// Pressing the down arrow key while the last tab has focus should change nothing...
		await druidTab.press('ArrowDown');
		await expect(druidPane).toBeVisible();
		await expect(wizardPane).not.toBeVisible();
		await expect(sorcererPane).not.toBeVisible();
		await expect(wizardTab).toHaveAttribute('tabindex', '-1');
		await expect(wizardTab).toHaveAttribute('aria-selected', 'false');
		await expect(sorcererTab).toHaveAttribute('tabindex', '-1');
		await expect(sorcererTab).toHaveAttribute('aria-selected', 'false');
		await expect(druidTab).not.toHaveAttribute('tabindex');
		await expect(druidTab).toHaveAttribute('aria-selected', 'true');

		// Pressing the up arrow key while the first tab has focus should change nothing...
		await wizardTab.click();
		await wizardTab.press('ArrowUp');
		await expect(wizardPane).toBeVisible();
		await expect(druidPane).not.toBeVisible();
		await expect(sorcererPane).not.toBeVisible();
		await expect(druidTab).toHaveAttribute('tabindex', '-1');
		await expect(druidTab).toHaveAttribute('aria-selected', 'false');
		await expect(sorcererTab).toHaveAttribute('tabindex', '-1');
		await expect(sorcererTab).toHaveAttribute('aria-selected', 'false');
		await expect(wizardTab).not.toHaveAttribute('tabindex');
		await expect(wizardTab).toHaveAttribute('aria-selected', 'true');
	});

	test('manual mode', async ({ page }) => {
		await page.goto(`${testPath}/manual.html`);

		// Get elements
		const wc = page.locator(componentName);
		const tabList = page.locator('[tabs]');
		const tabListItems = tabList.locator('li');
		const wizardTab = page.locator('[aria-controls="wizard"]');
		const sorcererTab = page.locator('[aria-controls="sorcerer"]');
		const druidTab = page.locator('[aria-controls="druid"]');
		const wizardPane = page.locator('#wizard');
		const sorcererPane = page.locator('#sorcerer');
		const druidPane = page.locator('#druid');

		// Clicking on a tab should...
		await druidTab.click();
		// 1. Reveal it's content
		await expect(druidPane).toBeVisible();
		// 2. Hide the other content
		await expect(wizardPane).not.toBeVisible();
		await expect(sorcererPane).not.toBeVisible();

		// Pressing the left arrow key while a tab has focus should...
		await druidTab.press('ArrowLeft');
		// 1. Focus the previous tab
		await expect(sorcererTab).toBeFocused();
		// 2. NOT change the visible content
		await expect(druidPane).toBeVisible();
		await expect(wizardPane).not.toBeVisible();
		await expect(sorcererPane).not.toBeVisible();

		// Pressing the left arrow key again should...
		await sorcererTab.press('ArrowLeft');
		// 1. Focus the previous tab
		await expect(wizardTab).toBeFocused();
		// 2. NOT change the visible content
		await expect(druidPane).toBeVisible();
		await expect(wizardPane).not.toBeVisible();
		await expect(sorcererPane).not.toBeVisible();
	});

	test('error handling', async ({ page }) => {
		await page.goto(`${testPath}/errors.html`);

		// Get elements
		const wc = page.locator(componentName);
		const wizardPane = page.locator('#wizard');
		const sorcererPane = page.locator('#sorcerer');
		const druidPane = page.locator('#druid');

		// no [is-ready] attribute
		await expect(wc).not.toHaveAttribute('is-ready');

		// All panes should be visible
		await expect(wizardPane).toBeVisible();
		await expect(sorcererPane).toBeVisible();
		await expect(druidPane).toBeVisible();
	});

	test('all content is visible before JS loads', async ({ page }) => {
		await page.goto(`${testPath}/no-js.html`);

		// Elements
		const wizardPane = page.locator('#wizard');
		const sorcererPane = page.locator('#sorcerer');
		const druidPane = page.locator('#druid');

		// All tab content is visible
		await expect(wizardPane).toBeVisible();
		await expect(sorcererPane).toBeVisible();
		await expect(druidPane).toBeVisible();
	});
});
