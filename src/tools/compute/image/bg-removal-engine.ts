import {
  BG_REMOVAL_SEG_EDGE,
  probabilitiesToMask,
  resizeRgbaBilinear,
  rgbaHwcToBchw,
} from "./background-removal";

/* ---------------------------------------------------------------------------
 * Client-side segmentation engine (ISNet General Use via onnxruntime-web).
 *
 * Runs entirely in the user's browser: the ONNX model and the onnxruntime-web
 * WASM binaries are served from this site's own `/models` and `/onnx` paths —
 * no API keys, no third-party service, images never leave the device.
 *
 * Both Node (vitest) and the browser are supported: Node resolves the
 * package's node build and auto-locates its WASM; the browser resolves the
 * browser build and is pointed at our vendored WASM files.
 * ------------------------------------------------------------------------- */

type OrtModule = {
  InferenceSession: {
    create(
      model: ArrayBuffer | Uint8Array,
      options?: Record<string, unknown>,
    ): Promise<{
      run(
        feeds: Record<string, unknown>,
        fetches?: Record<string, unknown>,
      ): Promise<Record<string, { data: Float32Array; dims: number[] }>>;
      release?(): Promise<void>;
    }>;
  };
  Tensor: new (
    type: "float32",
    data: Float32Array,
    shape: number[],
  ) => unknown;
  env?: {
    wasm?: {
      wasmPaths?: Record<string, string>;
      numThreads?: number;
      proxy?: boolean;
    };
  };
};

type SessionHandle = {
  run: Awaited<ReturnType<OrtModule["InferenceSession"]["create"]>>;
};

let sessionPromise: Promise<SessionHandle> | null = null;

async function loadOrt(): Promise<OrtModule> {
  const mod = await import("onnxruntime-web");
  const ort = (mod as unknown as { InferenceSession?: unknown }).InferenceSession
    ? (mod as unknown as OrtModule)
    : (((mod as unknown as { default?: OrtModule }).default) as OrtModule);
  if (!ort?.InferenceSession) {
    throw new Error("The AI engine (onnxruntime-web) could not be loaded in this browser.");
  }
  return ort;
}

async function createSession(modelBytes?: ArrayBuffer): Promise<SessionHandle> {
  const ort = await loadOrt();
  if (typeof window !== "undefined" && ort.env?.wasm) {
    ort.env.wasm.wasmPaths = {
      "ort-wasm-simd-threaded.wasm": "/onnx/ort-wasm-simd-threaded.wasm",
      "ort-wasm-simd-threaded.asyncify.wasm": "/onnx/ort-wasm-simd-threaded.asyncify.wasm",
      "ort-wasm-simd-threaded.jsep.wasm": "/onnx/ort-wasm-simd-threaded.jsep.wasm",
    };
    ort.env.wasm.numThreads = Math.min(
      4,
      typeof navigator !== "undefined" && navigator.hardwareConcurrency
        ? navigator.hardwareConcurrency
        : 4,
    );
  }
  let buffer = modelBytes;
  if (!buffer) {
    if (typeof window === "undefined") {
      throw new Error("A model file is required outside the browser (pass modelBytes).");
    }
    const modelUrl = "/models/isnet-general-use.onnx";
    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error(
        `The background-removal model could not be downloaded (HTTP ${response.status}).`,
      );
    }
    buffer = await response.arrayBuffer();
  }
  const session = await ort.InferenceSession.create(buffer, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
  return { run: session };
}

/**
 * Get (and cache) the ONNX session. The session is created once per page load
 * and reused for every image, so the ~44 MB model and WASM runtime are never
 * re-fetched or recompiled for subsequent images.
 *
 * `modelBytes` is used by Node tests (the browser always fetches the vendored
 * model from `/models/isnet-general-use.onnx`).
 */
export function getBgSegmentationSession(modelBytes?: ArrayBuffer) {
  if (!sessionPromise) {
    sessionPromise = createSession(modelBytes).catch((err) => {
      sessionPromise = null; // allow one retry on a transient failure
      throw err;
    });
  }
  return sessionPromise;
}

/** Force-release the cached session (used by tests and the reset button). */
export function releaseBgSegmentationSession(): void {
  sessionPromise = null;
}

/**
 * Run ISNet on an RGBA image and return a 0–255 foreground mask at
 * `BG_REMOVAL_SEG_EDGE`×`BG_REMOVAL_SEG_EDGE`, matching upstream expectations.
 */
export async function predictBgMask(
  rgba: Uint8Array,
  w: number,
  h: number,
  modelBytes?: ArrayBuffer,
): Promise<Uint8Array> {
  const { run } = await getBgSegmentationSession(modelBytes);
  const edge = BG_REMOVAL_SEG_EDGE;
  const resized = resizeRgbaBilinear(rgba, w, h, edge, edge);
  const input = rgbaHwcToBchw(resized, edge, edge);
  const ort = await loadOrt();
  const tensor = new ort.Tensor("float32", input, [1, 3, edge, edge]);
  const outputs = await run.run({ input: tensor });
  const output = outputs["output"];
  if (!output) {
    throw new Error("The segmentation model returned no mask. Please try again.");
  }
  const mask = probabilitiesToMask(output.data, edge * edge);
  return mask;
}