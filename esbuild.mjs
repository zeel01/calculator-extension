import * as esbuild from "esbuild";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";
import copyStaticFiles from "esbuild-copy-static-files";
import { parseArgs } from "util";
import { getDependencies, hooks } from "./buildUtils.js";
import Dotenv from 'dotenv-esbuild';
import litplugin from "esbuild-plugin-lit";

import ImportGlobPlugin from "esbuild-plugin-import-glob";
const ImportGlob = ImportGlobPlugin.default

const { values, positionals } = parseArgs({
	options: {
		watch: {
			type: "boolean",
			default: false,
			short: "w",
			help: "Watch for changes"
		},
		dev: {
			type: "boolean",
			default: true,
			short: "d",
			help: "Development mode"
		},
		production: {
			type: "boolean",
			default: false,
			short: "p",
			help: "Production mode"
		},
		serve: {
			type: "boolean",
			default: false,
			short: "s",
			help: "Serve the application"
		}
	}
});

const args = values

const frontend = await esbuild.context({
	entryPoints: ["src/scripts/main.js"],
	format: "esm",
	bundle: true,
	outdir: "dist/scripts",
	minify: args.production,
	sourcemap: args.dev,
	platform: "browser",
	target: ["es2020"],
	loader: {
		".woff": "copy",
		".woff2": "copy",
		".ttf": "copy",
		".eot": "copy",
		".svg": "copy",
		".png": "copy",
		".jpg": "copy",
		".jpeg": "copy"
	},
	plugins: [
		hooks({
			start: () => console.time("Frontend build completed in"),
			end: () => console.timeEnd("Frontend build completed in")
		}),
		ImportGlob(),
		nodeModulesPolyfillPlugin({
			globals: {
				process: true
			}
		}),
		copyStaticFiles({
			src: "src/resources",
			dest: "dist/resources",
			dereference: true,
			preserveTimestamps: true,
			recursive: true
		}),
		copyStaticFiles({
			src: "src/index.html",
			dest: "dist/index.html",
			dereference: true,
			preserveTimestamps: true
		}),
		copyStaticFiles({
			src: "src/manifest.json",
			dest: "dist/manifest.json",
			dereference: true,
			preserveTimestamps: true
		}),
		new Dotenv(),
		litplugin()
	],
});

const styles = await esbuild.context({
	entryPoints: [
		"src/styles/styles.css"
	],
	outdir: "dist/styles",
	minify: args.production,
	sourcemap: args.dev,
	bundle: true,
	loader: {
		".woff": "copy",
		".woff2": "copy",
		".ttf": "copy",
		".eot": "copy",
		".svg": "copy",
		".png": "copy",
		".jpg": "copy",
		".jpeg": "copy"
	},
	plugins: [
		hooks({
			start: () => console.time("Styles build completed in"),
			end: () => console.timeEnd("Styles build completed in")
		}),
		ImportGlob()
	]
});

console.time("Build completed in");

if (args.watch) {
	await Promise.all([
		frontend.watch(),
		styles.watch()
	]);
	
	console.log("Watching for changes...");
}
else {
	await Promise.all([
		frontend.rebuild(),
		styles.rebuild()
	]);
}

if (args.serve) {
	console.log("Starting server...");
	let { host, port } = await frontend.serve({
		servedir: "dist",
		host: "localhost",
		port: 8000
	});

	console.log(`Server running at http://${host}:${port}`); // Added log for server URL
}

if (!args.watch && !args.serve) {
	frontend.dispose();
	styles.dispose();
	console.log("");
	console.timeEnd("Build completed in");
}