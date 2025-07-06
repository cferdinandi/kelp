# Kelp

A UI library for people who love HTML, powered by modern CSS and Web Components.

**[Read the Docs &rarr;](https://kelpui.com)**

_**Note:** Kelp is currently under development in alpha. Please feel free to use it, experiment, and report bugs, but understand that things can and will change over time._



## Quick Start

Kelp works without any build step.

[The CDN](https://cdn.jsdelivr.net/npm/kelpui/) is the fastest and simplest way to get started, but you can [download the files from GitHub](https://github.com/cferdinandi/kelp) if you'd prefer.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/kelpui@0/css/kelp.css">
```

Kelp uses semantic versioning. You can grab a major, minor, or patch version from the CDN with the `@1.2.3` syntax. You can find all available versions [under releases](https://github.com/cferdinandi/kelp/tags).



## Demo

The included `index.html` file is a kitchen sink demo of Kelp. It includes every feature and component in one giant file.

While in beta, Kelp has no compile step. The web component use ES imports, and require a local server to run.

Use your preferred server, or use the included `http-server` by running `npm run dev`.

```bash
npm install
npm run dev
```

As Kelp nears v1, it will use a compile step to make this unnecessary.



## Tests

Kelp uses... 

- [Playwright](https://playwright.dev) for tests
- [Biome](https://biomejs.dev) for linting and formatting
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