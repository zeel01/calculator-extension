import manifest from "../manifest.json"
import defaultData from "./defaultData.js";

function isNewer(a, b) {
	if (!a || !b) return false;

	const aParts = a.split('.').map(Number);
	const bParts = b.split('.').map(Number);

	for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
		const aPart = aParts[i] || 0;
		const bPart = bParts[i] || 0;

		if (aPart > bPart) return true;
		if (aPart < bPart) return false;
	}

	return false;
}

let version = window.localStorage.getItem("version");
let manifestVersion = manifest.version;

if (!version) {
	// Check for legacy version
	if (window.localStorage.getItem("calc-history")) version = "1.0.0";
}

if (!version) {
	window.localStorage.setItem("version", manifestVersion);
	version = manifestVersion;

	console.log(`New installation with version ${manifestVersion}`);

	window.localStorage.setItem("calculator", JSON.stringify(defaultData));
}

console.log(`Current version: ${version}`);

if (isNewer(manifestVersion, version)) {
	window.localStorage.setItem("version", manifestVersion);
	console.log(`Updated to version ${manifestVersion}`);

	if (isNewer("1.0.0", version)) {

	}

	if (isNewer("1.1.0", version)) {
		const history = JSON.parse(window.localStorage.getItem("calc-history"));
		const scope = JSON.parse(window.localStorage.getItem("calc-scope"));
		const data = structuredClone(defaultData);

		data.tabs[0].history = history || [];
		data.tabs[0].scope = scope || { ans: 0 };

		window.localStorage.setItem("calculator", JSON.stringify(data));
		window.localStorage.removeItem("calc-history");
		window.localStorage.removeItem("calc-scope");
	}
}