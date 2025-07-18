import * as esbuild from 'esbuild';
import { glob } from 'glob';
import pkg from './package.json' with { type: "json" };

const banner = `/*! ${pkg.name} v${pkg.version} | (c) ${pkg.author.name} | Kelp Commons License | ${pkg.repository.url} */`;

// Get all .raw files
const js = await glob('js/**/*.raw.js');
const css = await glob('css/**/*.raw.css');
const files = [...js, ...css];

// Generate the input/output object for the files
const entryPoints = files.map((file) => {
	const output = file.replace('.raw', '').replace('.js', '').replace('.css', '');
	return {
		in: file,
		out: output,
	};
});

// Build the files
await esbuild.build({
	entryPoints,
	outdir: './',
	banner: {
		js: banner,
		css: banner,
	},
	bundle: true,
	write: true,
});
