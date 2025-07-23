import * as esbuild from 'esbuild';
import { glob } from 'glob';
import pkg from './package.json' with { type: "json" };

const banner = `/*! ${pkg.name} v${pkg.version} | (c) ${pkg.author.name} | ${pkg.repository.url} */`;

// Get all the modular files
const files = await glob([
	'modules/js/*.js',
	'modules/js/components/*.js',
	'modules/css/*.css'
]);

// Generate the input/output object for the files
const entryPoints = files.map((file) => {
	const output = file.replace('modules/', '').replace('.js', '').replace('.css', '');
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
