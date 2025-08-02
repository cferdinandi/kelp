import { test, expect } from '@playwright/test';

/**
 * Wait for a custom event to run
 * @param  {Locator} component The component to listen for the event on
 * @param  {String}  eventName The event name to listen for
 * @return {Promise}           Resolves to true if event emits
 */
export async function waitForCustomEvent (component, eventID) {
	return await component.evaluate((element, eventID) => {
		return new Promise((resolve) => {
			return element.addEventListener(eventID, (event) => {
				return resolve(event.detail ?? true);
			});
		});
	}, eventID);
}

/**
 * Test that component setup was completed
 * @param  {String}  selector The component selector
 * @param  {String}  url      The URL to navigate to
 */
export async function testComponentReadyState (selector, url, path = 'default.html') {
	test(`component instantiates${path !== 'default.html' ? ` - ${path}` : ''}`, async ({ page }) => {
		let isReady = false;
		page.on('console', msg => {
			if (msg.text() !== 'ready') return;
			isReady = true;
		});
		await page.goto(`${url}/${path}`);
		expect(isReady).toEqual(true);
		const component = page.locator(selector).first();
		await expect(component).toHaveAttribute('is-ready');
		await expect(component).toBeVisible();
	});
}

export async function testDebugEvent (url, id, error) {
	test(`kelp-debug${error ? ` "${error}"` : ''} catches errors`, async ({ page }) => {
		let hasError = false;
		page.on('console', msg => {
			const text = msg.text();
			if (!text.includes(error ? error : 'kelp-debug')) return;
			if (id && !text.includes(`target-${id}`)) return;
			hasError = true;
		});
		await page.goto(url);
		expect(hasError).toEqual(true);
	});
}
