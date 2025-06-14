import EventEmitter from "events";
import fs from "fs/promises";

export function hooks(options, emitter = new EventEmitter()) {
	Object.entries(options).forEach(([key, value]) => {
		if (typeof value === "function") {
			emitter.on(key, value);
		} else if (Array.isArray(value)) {
			value.forEach(fn => emitter.on(key, fn));
		}
	});

	return {
		name: "hooks",
		setup(build) {
			build.onStart((...args) => {
				emitter.emit("onStart", ...args);
				emitter.emit("start", ...args);
			});
			build.onResolve({ filter: /.*/ }, (...args) => {
				emitter.emit("onResolve", ...args);
				emitter.emit("resolve", ...args);
			});
			build.onLoad({ filter: /.*/ }, (...args) => {
				emitter.emit("onLoad", ...args);
				emitter.emit("load", ...args);
			});
			build.onEnd((...args) => {
				emitter.emit("onEnd", ...args);
				emitter.emit("end", ...args);
			});
			build.onDispose((...args) => {
				emitter.emit("onDispose", ...args);
				emitter.emit("dispose", ...args);
			});
		}
	};
}

export async function getDependencies() {
	const deps = new Set();
	const packageLock = JSON.parse(await fs.readFile("package-lock.json"));
	const packages = Object.values(packageLock.packages);

	Object.values(packages).forEach(pkg => {
		if (!pkg.dependencies) return;
		Object.keys(pkg.dependencies).forEach(dependency => deps.add(dependency));
	});

	return Array.from(deps);
}