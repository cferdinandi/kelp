import { test, expect } from '@playwright/test';
import { testComponentReadyState, testDebugEvent } from '../test-utilities.js';

// Component details
const componentName = 'kelp-{component name}';
const testPath = '/tests/{test directory path}';

test.describe(`<${componentName}>`, () => {

	// Test that ready event is emitted, [is-ready] attribute is added, and debug event is emitted
	testComponentReadyState(componentName, testPath);
	testDebugEvent(testPath, '{data-testid attribute value}');

	test('Component-specific details', async ({ page }) => {
		await page.goto(testPath);
		// Do test stuff...
		expect(true).toEqual(true);
	});

});
