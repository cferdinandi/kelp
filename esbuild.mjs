import * as esbuild from 'esbuild';
import pkg from './package.json' with { type: 'json' };

const banner = `/*! ${pkg.name} v${pkg.version} | (c) ${pkg.author.name} | ${pkg.repository.url} */`;

await esbuild.build({
	entryPoints: [
		'src/js/*.js',
		'src/css/*.css',
	],
	outbase: 'src',
	outdir: './',
	banner: {
		js: banner,
		css: banner,
	},
	bundle: true,
	write: true,
	legalComments: 'inline',
});
