import * as esbuild from 'esbuild';
import { glob } from 'glob';
import pkg from './package.json' with { type: "json" };

const banner = `/*! ${pkg.name} v${pkg.version} | (c) ${pkg.author.name} | ${pkg.repository.url} */`;

// Build the files
await esbuild.build({
	entryPoints: [
		{
			in: 'modules/css/kelp.css',
			out: 'css/kelp',
		},
		{
			in: 'modules/js/kelp.js',
			out: 'js/kelp',
		},
		{
			in: 'modules/js/dark-mode-auto.js',
			out: 'js/dark-mode-auto',
		}
	],
	outdir: './',
	banner: {
		js: banner,
		css: banner,
	},
	bundle: true,
	write: true,
});
