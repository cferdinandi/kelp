/**
 * Automatically toggle dark mode based on users prefers-color-scheme OS setting
 */
const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");
document.documentElement.classList.toggle("dark", prefersDarkMode.matches);

prefersDarkMode.addEventListener("change", (event) => {
	document.documentElement.classList.toggle("dark", event.matches);
});
