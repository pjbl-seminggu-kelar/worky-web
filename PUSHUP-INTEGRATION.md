# Push-up camera integration

The `/sesi` screen uses MediaPipe PoseLandmarker Full and the supplied `ann_depth_v1.onnx`. Video is processed in the browser. Audio is deferred.

## Workflow

1. Open an active workout plan and select **Mulai sesi**.
2. Unsupported exercises show **Model untuk latihan ini belum tersedia** and can be skipped. They do not create a completed API session or contribute to scores.
3. For push-ups, allow the camera, position yourself sideways and expose the shoulder, elbow and wrist of the arm facing the camera.
4. Press **Kalibrasi tangan**. Calibration uses one second, at least 15 observed frames, minimum visibility 0.5 and visibility margin 0.1. The anatomical arm is locked until recalibration.
5. Return to the upper position and press **Mulai set**. An API session is created for the exercise. All sets belong to that session.
6. Only completed FSM repetitions classified as valid by ANN fill the set target. Shallow repetitions are recorded separately; incomplete/gap repetitions are unassessed.
7. Rest for 15 seconds between sets. The next set starts automatically with a fresh FSM and the same calibrated arm.
8. After the final set, save the exercise result. Rest for 30 seconds before the next exercise. The last exercise goes straight to the report.

Camera/model errors stop detection and offer retry. Session-start errors offer retry without starting the counter. Save errors retain results and offer retry without replaying the exercise. Recalibration preserves accepted rep totals and resets the incomplete movement. Leaving the screen stops camera tracks and frees model resources.

## Scientific scope

- Counting is a direct TypeScript port of `pushup_core/streaming_fsm.py`, FSM v2: trigger drop 12°, return margin 12°, minimum rebound 12°, minimum cycle 0.25s, maximum missing interval 0.20s. No additional depth or ROM acceptance filter was added.
- ANN input is `min_elbow_angle`, float32 `[1,1]`, in pixel-coordinate degrees. Scaling is inside the model. Output `prob_kurang_turun < 0.5` is valid; output at or above 0.5 is insufficient depth.
- The live depth hint is derived from the shipped ANN by numerical boundary search (approximately 81.69°). Final acceptance always invokes ANN for the completed repetition.
- Full-body landmarks 11–32 are visualized, including feet and heels. Head landmarks/connections are excluded. Hiding the skeleton leaves inference running.
- Hip guidance uses shoulder–hip–knee angle and signed hip displacement from the shoulder–ankle line, normalized by body length. Enter/exit displacement thresholds are 0.08/0.05, with 600ms stability. These are **experimental UI heuristics**, not validated biomechanical criteria or ANN features. Low-visibility, incomplete and unsuitable views suppress guidance. Hip feedback never changes the rep count or depth score.
- Mirroring is presentation-only. Geometry uses current intrinsic video dimensions. The session camera fills the viewport using centered `object-fit: cover`, with matching crop offsets for the skeleton; the preview can crop edges to fill the screen, while inference uses the original captured frame. Header, counters, a single prioritized status and controls overlay the feed. A change in frame dimensions resets the unfinished movement and preserves completed counts. Physical portrait/landscape tracking still needs device testing.

## Assets and installation

`public/vision/models/` contains the supplied ONNX models, inference contract, synthetic parity fixtures, and Full pose model from the attached ZIPs. ANN SHA-256 is checked before inference. Do not change model weights or contract thresholds as part of UI work.

`npm install` runs `scripts/prepare-vision.mjs`, which copies version-matched MediaPipe and ONNX WASM runtime files into ignored `public/vision/` subdirectories. Run `npm run postinstall` to restore these generated files manually. ONNX uses its bundled JavaScript loader and a same-origin WASM file so Vite does not import executable JavaScript from `public/`.

## Verification

```sh
npm test
npm run test:models
npx tsc --noEmit
npm run build
```

- Unit tests exercise plan progression, valid-only targets, 15/30-second rests, skips, geometry, mirroring, head exclusion, calibration and hip guidance.
- The FSM fixture contains 51 synthetic sequences / 8,049 observations from Python. Source SHA-256 `2aedd3d7731574e253504113ae7134b18eaa235fa2c36703c730f44e39178fa7` matches the attached Python FSM.
- Model checks compare both models to 14 reference probabilities each, tolerance 0.0001. They also verify the single ANN decision crossing over a synthetic 0–180° sweep.
- Browser checks used a fake camera to load actual MediaPipe and ANN, verify the skeleton toggle, viewport changes, and stream cleanup. A separate scenario mocked only pose landmarks and API responses, exercising real angle extraction, FSM and ANN through invalid/valid reps, set rest, recalibration, exercise rest, unsupported skip and the stored report. These checks do not validate human tracking or a live API write.
- Error scenarios verify denied permission, missing camera, rejected model hash, camera release after failure and retry with exactly one live video track. Unsupported exercises never request camera access or load model files.
- The repository-wide lint command includes pre-existing formatting/lint errors outside these changes. Changed push-up source files have been checked separately. Generated third-party runtime files are excluded from lint/format.

No held-out sessions s07–s08 were accessed.

## Physical camera checklist

- Use localhost on the computer or HTTPS on the phone, with the screen facing you and the device stable.
- Check portrait and landscape. Ensure the entire body remains in the captured frame and the visible arm has enough light.
- Verify successful calibration, then compare several slow push-ups with manual counts.
- Try a shallow repetition: correction increases and the target count stays unchanged.
- Complete all sets and verify 15-second rests, then a 30-second exercise rest.
- Hide the skeleton; counting must continue. Cover the selected arm; tracking must become unavailable without switching arms.
- Recalibrate and rotate the phone; accepted counts must remain. Check that no incomplete movement becomes an extra rep.
- Leave the session and verify that the device camera indicator turns off.
