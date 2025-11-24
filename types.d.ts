interface KelpWCInstance extends HTMLElement {
	init: () => void;
}

declare global {
	namespace PlaywrightTest {
		interface Matchers<R> {
			toHaveError(): R;
		}
	}
}
