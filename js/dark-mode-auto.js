/*! kelpui v0.20.0 | (c) Chris Ferdinandi | http://github.com/cferdinandi/kelp */
"use strict";
(() => {
  // modules/js/dark-mode-auto.js
  var prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)");
  document.documentElement.classList.toggle("dark", prefersDarkMode.matches);
  prefersDarkMode.addEventListener("change", (event) => {
    document.documentElement.classList.toggle("dark", event.matches);
  });
})();
