import { expect, test } from '@playwright/test';
import { getFromPath } from '../../src/js/utilities/getFromPath.js';

test.describe('getFromPath()', () => {
	const arr = [
		{
			full_name: 'Rick Wolf',
			jobs: ['Clerk', 'Accountant', 'Rocket Scientist'],
			address: {
				street: '4606 Lottie Brooks',
				city: 'Lichinga',
			},
		},
		{
			full_name: 'Misty Rolling',
			address: {
				street: '35558 Rosemarie Grove',
				city: 'Outapi',
			},
		},
		{
			full_name: 'Bobbie Batz',
			address: {
				street: '0189 Novella Plains',
				city: 'Dembeni',
			},
		},
	];

	const obj = structuredClone(arr[0]);

	test('gets data from path', () => {
		// Arrays
		expect(getFromPath(arr, '[1].address.street')).toEqual(
			'35558 Rosemarie Grove',
		);
		expect(getFromPath(arr, '[1]address.street')).toEqual(
			'35558 Rosemarie Grove',
		);
		expect(getFromPath(arr, '[1].full_name')).toEqual('Misty Rolling');
		expect(getFromPath(arr, '[1]full_name')).toEqual('Misty Rolling');
		expect(getFromPath(arr, '[0]')).toEqual(obj);
		expect(getFromPath(arr, '0')).toEqual(obj);

		// Objects
		expect(getFromPath(obj, 'full_name')).toEqual('Rick Wolf');
		expect(getFromPath(obj, 'jobs[2]')).toEqual('Rocket Scientist');
		expect(getFromPath(obj, 'jobs.[2]')).toEqual('Rocket Scientist');
		expect(getFromPath(obj, 'address.street')).toEqual('4606 Lottie Brooks');
	});

	test('handles errors gracefully', () => {
		expect(getFromPath(null, '[1].address.street')).toBeUndefined();
		expect(getFromPath(obj, 'last_name')).toBeUndefined();
	});
});
