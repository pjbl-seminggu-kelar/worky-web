import fs from "node:fs";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import * as ort from "onnxruntime-web/wasm";

ort.env.wasm.numThreads = 1;
const root = new URL("../public/vision/models/", import.meta.url);
const contract = JSON.parse(fs.readFileSync(new URL("inference_contract_v1.json", root)));
const fixture = JSON.parse(fs.readFileSync(new URL("browser_parity_fixtures_v1.json", root)));
assert.equal(contract.final_test_used, false);
for (const name of ["logreg", "ann"]) {
  const bytes = fs.readFileSync(new URL(contract.models[name].filename, root));
  assert.equal(
    crypto.createHash("sha256").update(bytes).digest("hex"),
    contract.models[name].sha256,
  );
  const session = await ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] });
  try {
    const input = new ort.Tensor("float32", Float32Array.from(fixture.angles), [
      fixture.angles.length,
      1,
    ]);
    const outputs = await session.run({ elbow_angle: input });
    try {
      const actual = Array.from(outputs.prob_kurang_turun.data);
      const error = Math.max(
        ...actual.map((value, index) => Math.abs(value - fixture.expected[name][index])),
      );
      assert.ok(actual.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
      assert.ok(error <= fixture.tolerance);
      console.log(`${name}: 14/14 fixture outputs matched; max error ${error}`);
    } finally {
      input.dispose();
      Object.values(outputs).forEach((output) => output.dispose());
    }
    if (name === "ann") {
      const angles = Array.from({ length: 18001 }, (_, i) => i / 100);
      const input = new ort.Tensor("float32", Float32Array.from(angles), [angles.length, 1]);
      const outputs = await session.run({ elbow_angle: input });
      try {
        const probabilities = Array.from(outputs.prob_kurang_turun.data);
        const crossings = angles.filter(
          (_, i) => i > 0 && probabilities[i] < 0.5 !== probabilities[i - 1] < 0.5,
        );
        assert.deepEqual(crossings, [81.7]);
        console.log("ANN depth guidance: one decision boundary, between 81.69 and 81.70 degrees.");
      } finally {
        input.dispose();
        Object.values(outputs).forEach((output) => output.dispose());
      }
    }
  } finally {
    await session.release();
  }
}
console.log("Synthetic fixtures only; held-out sessions s07–s08 were not accessed.");
