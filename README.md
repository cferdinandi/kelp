# Kelp

A UI library for people who love HTML, powered by modern CSS and Web Components.

**[Read the Docs &rarr;](https://kelpui.com)**



## Quick Start

Kelp works without any build step.

[The CDN](https://cdn.jsdelivr.net/npm/kelpui/) is the fastest and simplest way to get started.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/kelpui@1/css/kelp.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/kelpui@1/js/kelp.js"></script>
```

Kelp uses semantic versioning. You can grab a major, minor, or patch version from the CDN with the `@1.2.3` syntax. You can find all available versions [under releases](https://github.com/cferdinandi/kelp/tags).



## Source Code

Kelp's compiled CSS and JS files are located in the `/css` and `/js` directories. The source files are located in the `/src` directory.

Kelp uses [ESBuild](https://esbuild.github.io) to combine all of the modular files into a single file [for performance reasons](https://gomakethings.com/gzip-performance-is-wild/).

To run your own build, comment out the imports you don't want in the `src/css` and/or `/src/js` files, then run `npm run build`.

```bash
npm install
npm run build
```

Kelp is unminified by default. In performance testing, [minification had almost no performance impact](https://gomakethings.com/minification-doesnt-matter-much/) when gzip or brotli are used.

If you'd prefer to minify anyways, you can add `minify: true` to the `esbuild.mjs` build function.

```js
await esbuild.build({
	entryPoints: [
		'src/js/*.js',
		'src/css/*.css',
	],
	minify: true,
	// ...
});
```



## Demo

The included `index.html` file is a kitchen sink demo of Kelp. It includes every feature and component in one giant file.

The web component use ES imports, and require a local server to run.

Use your preferred server, or use the included `http-server` by running `npm run dev`.

```bash
npm install
npm run dev
```



## Tests

Kelp uses... 

- [Playwright](https://playwright.dev) for tests
- [Biome](https://biomejs.dev) for linting and formatting
- [Typescript with JSDoc](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html#handbook-content) for more friendly (and fully optional) type checking
- A continuous integration process on deploys and PRs

```bash
# Run tests
npm run test

# Run linter
npm run lint
```

The test suite uses port `8080`. If that's already in use, you can set a different `PORT` when running your test, like this...

```bash
# Run tests on port 8082
PORT=8082 npm run test
```



## License

Free to use under the [Kelp Commons License](https://github.com/cferdinandi/kelp/blob/main/LICENSE.md). There are also [commercial license options](/license/) available.