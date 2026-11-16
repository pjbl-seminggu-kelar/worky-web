import { mkdir, readdir, copyFile } from "node:fs/promises";
import path from "node:path";

// Keep JS and WASM from the same installed package version, served same-origin.
for (const [source, destination, pattern] of [
  ["node_modules/@mediapipe/tasks-vision/wasm", "public/vision/mediapipe", /\.(js|wasm)$/],
  [
    "node_modules/onnxruntime-web/dist",
    "public/vision/ort",
    /^ort-wasm-simd-threaded\.(mjs|wasm)$/,
  ],
]) {
  await mkdir(destination, { recursive: true });
  for (const file of await readdir(source)) {
    if (pattern.test(file)) await copyFile(path.join(source, file), path.join(destination, file));
  }
}
