//#region src/options.ts
/**
* The wasm binding validates everything it receives, but a JS stack trace
* pointing at the offending call is worth more than one pointing at
* `postMessage`, so the same rules are applied here first.
*/
const ENUMS = {
	preset: [
		"bw",
		"poster",
		"photo"
	],
	clustering: [
		"color-cluster",
		"binary",
		"watershed"
	],
	mode: [
		"pixel",
		"polygon",
		"spline"
	],
	hierarchical: ["stacked", "cutout"]
};
const UINT32_MAX = 4294967295;
const NUMBERS = {
	filterSpeckle: {
		min: 0,
		max: UINT32_MAX,
		integer: true
	},
	colorPrecision: {
		min: 1,
		max: 8,
		integer: true
	},
	layerDifference: {
		min: 0,
		max: 255,
		integer: true
	},
	cornerThreshold: {
		min: 0,
		max: 180,
		integer: true
	},
	lengthThreshold: { min: 0 },
	maxIterations: {
		min: 0,
		max: UINT32_MAX,
		integer: true
	},
	spliceThreshold: {
		min: 0,
		max: 180,
		integer: true
	},
	simplify: {
		min: 0,
		nullable: true
	},
	pathPrecision: {
		min: 0,
		max: 10,
		integer: true,
		nullable: true
	},
	maxColors: {
		min: 0,
		max: UINT32_MAX,
		integer: true,
		nullable: true
	},
	optimize: {
		min: 0,
		max: 2,
		integer: true
	},
	binaryThreshold: {
		min: 0,
		max: 255,
		integer: true
	},
	binaryAdaptiveWindow: {
		min: 0,
		max: UINT32_MAX,
		integer: true
	},
	binaryAdaptiveT: {
		min: 0,
		max: 100
	},
	watershedDetail: {
		min: 0,
		max: UINT32_MAX,
		integer: true
	}
};
const BOOLEANS = /* @__PURE__ */ new Set(["binaryAdaptive"]);
const MAX_DIMENSION = 2147483647;
function describe(value) {
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "number" || typeof value === "boolean" || value === null) return String(value);
	return typeof value;
}
function normalizeConfig(source, call, handled) {
	const config = {};
	if (source === void 0 || source === null) return config;
	if (typeof source !== "object" || Array.isArray(source)) throw new TypeError(`${call}: options must be an object, got ${describe(source)}`);
	for (const [key, value] of Object.entries(source)) {
		if (value === void 0 || handled.includes(key)) continue;
		const allowed = ENUMS[key];
		if (allowed) {
			if (typeof value !== "string" || !allowed.includes(value)) throw new TypeError(`${call}: option "${key}" must be one of ${allowed.map((name) => JSON.stringify(name)).join(", ")}, got ${describe(value)}`);
			config[key] = value;
			continue;
		}
		const spec = NUMBERS[key];
		if (spec) {
			if (value === null) {
				if (!spec.nullable) throw new TypeError(`${call}: option "${key}" must be a number, got null`);
				config[key] = null;
				continue;
			}
			if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${call}: option "${key}" must be a finite number, got ${describe(value)}`);
			if (spec.integer && !Number.isInteger(value)) throw new TypeError(`${call}: option "${key}" must be an integer, got ${value}`);
			if (value < spec.min || spec.max !== void 0 && value > spec.max) {
				const range = spec.max === void 0 ? `at least ${spec.min}` : `between ${spec.min} and ${spec.max}`;
				throw new RangeError(`${call}: option "${key}" must be ${range}, got ${value}`);
			}
			config[key] = value;
			continue;
		}
		if (BOOLEANS.has(key)) {
			if (typeof value !== "boolean") throw new TypeError(`${call}: option "${key}" must be a boolean, got ${describe(value)}`);
			config[key] = value;
			continue;
		}
		throw new TypeError(`${call}: unknown option "${key}"; see the VTracerOptions type for the accepted names`);
	}
	return config;
}
function normalizeDimension(value, key, call) {
	if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > MAX_DIMENSION) throw new TypeError(`${call}: "${key}" must be a positive integer, got ${describe(value)}`);
	return value;
}
function normalizeProgress(value, call) {
	if (typeof value !== "function") throw new TypeError(`${call}: "onProgress" must be a function, got ${describe(value)}`);
	return value;
}
function normalizeConvertOptions(options, call = "vtracer.convert") {
	const normalized = { config: normalizeConfig(options, call, [
		"width",
		"height",
		"onProgress"
	]) };
	if (options === void 0 || options === null) return normalized;
	if (options.width !== void 0) normalized.width = normalizeDimension(options.width, "width", call);
	if (options.height !== void 0) normalized.height = normalizeDimension(options.height, "height", call);
	if (options.onProgress !== void 0) normalized.onProgress = normalizeProgress(options.onProgress, call);
	return normalized;
}
function normalizePixelsOptions(options, call = "vtracer.convertPixels") {
	const normalized = { config: normalizeConfig(options, call, ["onProgress"]) };
	if (options === void 0 || options === null) return normalized;
	if (options.onProgress !== void 0) normalized.onProgress = normalizeProgress(options.onProgress, call);
	return normalized;
}
//#endregion
//#region src/index.ts
/**
* Emitted next to this module by the build (`dist/worker.js`), so the plain
* relative URL is also what the runtime needs — no bundler rewriting required
* for the published package. See README for consumers that inline
* dependencies into their own bundle.
*/
const WORKER_URL = new URL("./worker.js", import.meta.url);
function createVTracer() {
	const worker = new Worker(WORKER_URL, { type: "module" });
	const tasks = /* @__PURE__ */ new Map();
	let nextId = 0;
	/**
	* Set once the worker itself is gone (script failed to load, uncaught
	* error, terminated). Every queued task is rejected with it and later
	* calls fail fast, instead of hanging on a worker that will never answer.
	*/
	let failure = null;
	function fail(error) {
		failure ??= error;
		for (const task of tasks.values()) task.reject(error);
		tasks.clear();
	}
	worker.addEventListener("message", (event) => {
		const response = event.data;
		const task = tasks.get(response.id);
		if (!task) return;
		if (response.type === "progress") {
			task.onProgress?.({
				phase: response.phase,
				fraction: response.fraction
			});
			return;
		}
		tasks.delete(response.id);
		if (response.type === "success") task.resolve(response.svg);
		else task.reject(new Error(response.error));
	});
	worker.addEventListener("error", (event) => {
		const where = event.filename ? ` (${event.filename}:${event.lineno})` : "";
		fail(/* @__PURE__ */ new Error(`VTracer worker failed${where}: ${event.message || "the worker script could not be loaded"}`));
	});
	worker.addEventListener("messageerror", () => {
		fail(/* @__PURE__ */ new Error("VTracer worker could not deserialize a message"));
	});
	function enqueue(message, transfer, onProgress) {
		return new Promise((resolve, reject) => {
			if (failure) {
				reject(failure);
				return;
			}
			tasks.set(message.id, {
				resolve,
				reject,
				onProgress
			});
			try {
				worker.postMessage(message, transfer);
			} catch (error) {
				tasks.delete(message.id);
				reject(error instanceof Error ? error : new Error(String(error)));
			}
		});
	}
	function assertUsable() {
		if (failure) throw failure;
	}
	async function convert(input, options) {
		assertUsable();
		const { config, width, height, onProgress } = normalizeConvertOptions(options);
		const bitmap = await createImageBitmap(input);
		return enqueue({
			id: ++nextId,
			type: "convert",
			bitmap,
			maxWidth: width,
			maxHeight: height,
			options: config,
			reportProgress: onProgress !== void 0
		}, [bitmap], onProgress);
	}
	async function convertPixels(pixels, width, height, options) {
		assertUsable();
		const { config, onProgress } = normalizePixelsOptions(options);
		assertPixels(pixels, width, height);
		const buffer = new Uint8Array(pixels);
		return enqueue({
			id: ++nextId,
			type: "convert-pixels",
			pixels: buffer,
			width,
			height,
			options: config,
			reportProgress: onProgress !== void 0
		}, [buffer.buffer], onProgress);
	}
	function terminate() {
		worker.terminate();
		fail(/* @__PURE__ */ new Error("VTracer was terminated; create a new instance to trace again"));
	}
	return {
		convert,
		convertPixels,
		terminate
	};
}
function assertPixels(pixels, width, height) {
	const call = "vtracer.convertPixels";
	if (!(pixels instanceof Uint8Array) && !(pixels instanceof Uint8ClampedArray)) throw new TypeError(`${call}: "pixels" must be a Uint8Array or Uint8ClampedArray`);
	for (const [name, value] of [["width", width], ["height", height]]) if (typeof value !== "number" || !Number.isInteger(value) || value < 1) throw new TypeError(`${call}: "${name}" must be a positive integer, got ${String(value)}`);
	const expected = width * height * 4;
	if (pixels.length !== expected) throw new RangeError(`${call}: "pixels" holds ${pixels.length} bytes but a ${width}x${height} RGBA image needs ${expected}`);
}
//#endregion
export { createVTracer };
