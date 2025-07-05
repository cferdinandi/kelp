
<div align="right">
  <details>
    <summary >🌐 Language</summary>
    <div>
      <div align="right">
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=en">English</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=zh-CN">简体中文</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=zh-TW">繁體中文</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=ja">日本語</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=ko">한국어</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=hi">हिन्दी</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=th">ไทย</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=fr">Français</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=de">Deutsch</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=es">Español</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=it">Itapano</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=ru">Русский</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=pt">Português</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=nl">Nederlands</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=pl">Polski</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=ar">العربية</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=fa">فارسی</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=tr">Türkçe</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=vi">Tiếng Việt</a></p>
        <p><a href="https://openaitx.github.io/view.html?user=cferdinandi&project=kelp&lang=id">Bahasa Indonesia</a></p>
      </div>
    </div>
  </details>
</div>

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



## License

Free to use under the [Kelp Commons License](https://github.com/cferdinandi/kelp/blob/main/LICENSE.md). There are also [commercial license options](/license/) available.