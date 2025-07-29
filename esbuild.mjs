import * as esbuild from 'esbuild';
import pkg from './package.json' with { type: 'json' };

const banner = `/*! ${pkg.name} v${pkg.version} | (c) ${pkg.author.name} | ${pkg.repository.url} */`;

await esbuild.build({
	entryPoints: [
		'modules/js/*.js',
		'modules/js/components/*.js',
		'modules/css/*.css',
	],
	outbase: 'modules',
	outdir: './',
	banner: {
		js: banner,
		css: banner,
	},
	bundle: true,
	write: true,
});
