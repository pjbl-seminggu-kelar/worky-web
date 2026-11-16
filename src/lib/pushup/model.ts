import type { InferenceSession } from "onnxruntime-web";

export const MODEL_VERSION = "ann_depth_v1";
export type Prediction = { probability: number; valid: boolean };
export type DepthModel = {
  boundary: number;
  predict: (angle: number) => Promise<Prediction>;
  close: () => Promise<void>;
};

export async function loadDepthModel(): Promise<DepthModel> {
  const [ort, response, contractResponse] = await Promise.all([
    import("onnxruntime-web/wasm"),
    fetch("/vision/models/ann_depth_v1.onnx"),
    fetch("/vision/models/inference_contract_v1.json"),
  ]);
  if (!response.ok || !contractResponse.ok)
    throw new Error("Model push-up gagal dimuat. Coba lagi.");
  const contract = await contractResponse.json();
  if (
    contract.input?.feature !== "min_elbow_angle" ||
    contract.output?.threshold !== 0.5 ||
    contract.input?.scaler_included_in_model !== true
  )
    throw new Error("Kontrak model tidak cocok.");
  const bytes = await response.arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  if (hash !== contract.models?.ann?.sha256) throw new Error("File model tidak sesuai kontrak.");
  // Keep the bundled JS loader; Vite must not import executable JS from public/.
  ort.env.wasm.wasmPaths = { wasm: "/vision/ort/ort-wasm-simd-threaded.wasm" };
  ort.env.wasm.numThreads = 1;
  const session: InferenceSession = await ort.InferenceSession.create(bytes, {
    executionProviders: ["wasm"],
  });
  async function predict(angle: number): Promise<Prediction> {
    if (!Number.isFinite(angle) || angle < 0 || angle > 180)
      throw new Error("Sudut siku tidak valid.");
    const tensor = new ort.Tensor("float32", Float32Array.of(angle), [1, 1]);
    let outputs: InferenceSession.ReturnType | undefined;
    try {
      outputs = await session.run({ elbow_angle: tensor }, ["prob_kurang_turun"]);
      const output = outputs["prob_kurang_turun"];
      const probability = Number(output?.data[0]);
      if (
        output?.type !== "float32" ||
        output.dims[0] !== 1 ||
        output.dims[1] !== 1 ||
        !Number.isFinite(probability) ||
        probability < 0 ||
        probability > 1
      )
        throw new Error("Hasil model tidak valid.");
      return { probability, valid: probability < contract.output.threshold };
    } finally {
      tensor.dispose();
      if (outputs) Object.values(outputs).forEach((value) => value.dispose());
    }
  }
  try {
    // Derive the live depth hint from the actual shipped ANN, not a new judging threshold.
    let low = 0,
      high = 180;
    for (let i = 0; i < 22; i++) {
      const middle = (low + high) / 2;
      if ((await predict(middle)).valid) low = middle;
      else high = middle;
    }
    return { boundary: (low + high) / 2, predict, close: () => session.release() };
  } catch (error) {
    await session.release();
    throw error;
  }
}
