import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { ArmSelector, elbowAngle, type Point } from "./pose";
import { StatefulRepCounter, type RepEvent } from "./streaming-fsm";
import { loadDepthModel, type DepthModel, type Prediction } from "./model";
import { hipGeometry, StableHipGuidance } from "./guidance";
import { drawBody } from "./drawing";

import { initialCameraStatus, type CameraStatus } from "./status";
export type CameraOptions = {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  counting: () => boolean;
  skeleton: () => boolean;
  publish: (status: CameraStatus) => void;
  onRep: (event: RepEvent, prediction: Prediction) => void;
  onPartial: () => void;
};
export function createPushupCamera(options: CameraOptions) {
  let closed = false,
    raf = 0,
    watchdog = 0,
    epoch = 0,
    processing = false;
  let stream: MediaStream | null = null,
    pose: PoseLandmarker | null = null,
    model: DepthModel | null = null;
  const selector = new ArmSelector(),
    counter = new StatefulRepCounter(),
    hipFilter = new StableHipGuidance();
  let calibrationRequested = false,
    wasCounting = false,
    lastVideo = -1,
    lastFrame = 0,
    lastPublish = 0;
  let width = 0,
    height = 0,
    framePoints: Point[] = [],
    tone = "#e2e8f0";
  let resultMessage = "",
    resultUntil = 0;
  let status = initialCameraStatus();
  function publish(patch: Partial<CameraStatus>) {
    if (closed) return;
    status = { ...status, ...patch };
    options.publish(status);
  }
  function redraw() {
    drawBody(
      options.canvas,
      options.skeleton() ? framePoints : [],
      selector.state.side,
      width,
      height,
      tone,
      status.hip.status === "high" || status.hip.status === "low",
    );
  }
  function resetMovement() {
    epoch++;
    if (wasCounting && counter.finish().length) options.onPartial();
    counter.reset();
    wasCounting = false;
    resultMessage = "";
    resultUntil = 0;
  }
  function close() {
    closed = true;
    epoch++;
    cancelAnimationFrame(raf);
    clearInterval(watchdog);
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    options.video.srcObject = null;
    // A pending inference owns its resources until it completes.
    if (!processing) {
      pose?.close();
      pose = null;
      void model?.close();
      model = null;
    }
    framePoints = [];
    redraw();
  }
  function fail(error: unknown) {
    publish({
      phase: "error",
      error: error instanceof Error ? error.message : "Kamera gagal dimulai. Coba lagi.",
      angle: null,
      feedback: "Deteksi berhenti.",
    });
    close();
  }
  function calibrate() {
    if (closed || status.phase !== "ready") return;
    resetMovement();
    selector.reset();
    hipFilter.reset();
    calibrationRequested = true;
    publish({
      calibration: selector.state,
      angle: null,
      feedback: "Kalibrasi… tahan posisi menyamping.",
    });
  }
  async function loop() {
    if (closed) return;
    try {
      const now = performance.now(),
        video = options.video;
      if (
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.currentTime !== lastVideo &&
        !document.hidden
      ) {
        lastVideo = video.currentTime;
        lastFrame = now;
        if (width && (width !== video.videoWidth || height !== video.videoHeight)) resetMovement();
        width = video.videoWidth;
        height = video.videoHeight;
        const points = pose!.detectForVideo(video, now).landmarks[0] ?? [];
        framePoints = points;
        const selection = calibrationRequested ? selector.update(now, points) : null;
        const side = selection?.phase === "locked" ? selection.side : null;
        const angle = side ? elbowAngle(points, side, width, height) : null;
        const hip = side
          ? hipFilter.update(now, hipGeometry(points, side, width, height))
          : { angle: null, offset: null, status: "unavailable" as const };
        const counting = options.counting() && !!side;
        if (counting !== wasCounting) {
          resetMovement();
          wasCounting = counting;
        }
        let feedback = "Posisikan tubuh menyamping, lalu tekan Kalibrasi tangan.";
        tone = "#e2e8f0";
        if (selection?.phase === "failed") feedback = selection.reason;
        else if (selection?.phase === "calibrating")
          feedback = "Kalibrasi… tahan posisi menyamping.";
        else if (side && angle === null)
          feedback =
            "Lengan tidak terlihat jelas. Pastikan bahu, siku, dan pergelangan masuk kamera.";
        else if (side)
          feedback = counting
            ? "Tekuk siku dan turunkan tubuh."
            : "Lengan siap. Bersiap di posisi atas.";
        if (counting) {
          const events = counter.update(now / 1000, angle);
          for (const event of events) {
            if (event.status !== "completed") {
              options.onPartial();
              continue;
            }
            const predictionEpoch = epoch;
            processing = true;
            let prediction: Prediction;
            try {
              prediction = await model!.predict(event.min_angle);
            } catch (error) {
              if (!closed && predictionEpoch === epoch) options.onPartial();
              throw error;
            } finally {
              processing = false;
            }
            if (closed) {
              pose?.close();
              pose = null;
              await model?.close();
              model = null;
              return;
            }
            if (predictionEpoch !== epoch || !options.counting()) {
              raf = requestAnimationFrame(() => void loop());
              return;
            }
            options.onRep(event, prediction);
            resultMessage = prediction.valid
              ? "Repetisi valid. Kedalaman cukup."
              : "Kurang turun. Coba lebih dalam.";
            resultUntil = performance.now() + 1600;
          }
          if (angle !== null && counter.rep) {
            const deepEnough = counter.rep.min_angle < model!.boundary;
            feedback = deepEnough
              ? "Kedalaman cukup. Dorong kembali ke atas."
              : "Turunkan sedikit lagi.";
            tone = deepEnough ? "#86efac" : "#fbbf24";
          }
          if (angle !== null && hip.status === "high")
            feedback = "Pinggul terlalu tinggi. Turunkan sedikit.";
          if (angle !== null && hip.status === "low")
            feedback = "Pinggul terlalu rendah. Angkat sedikit.";
          if (angle !== null && now < resultUntil) feedback = resultMessage;
        }
        status = {
          phase: "ready",
          error: "",
          calibration: selection,
          angle,
          hip,
          boundary: model!.boundary,
          feedback,
        };
        redraw();
        if (now - lastPublish > 100 || now < resultUntil) {
          lastPublish = now;
          options.publish(status);
        }
      }
      if (!closed) raf = requestAnimationFrame(() => void loop());
    } catch (error) {
      fail(error);
    }
  }
  async function start() {
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Kamera memerlukan HTTPS atau localhost dan browser yang mendukung kamera.",
        );
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (closed) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
        return;
      }
      stream.getVideoTracks().forEach((track) =>
        track.addEventListener(
          "ended",
          () => {
            if (!closed) fail(new Error("Kamera terputus. Tekan Coba lagi."));
          },
          { once: true },
        ),
      );
      options.video.srcObject = stream;
      await options.video.play();
      const loaded = await Promise.allSettled([
        loadDepthModel(),
        (async () => {
          const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
          const vision = await FilesetResolver.forVisionTasks("/vision/mediapipe");
          const base = {
            runningMode: "VIDEO" as const,
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
            outputSegmentationMasks: false,
          };
          try {
            return await PoseLandmarker.createFromOptions(vision, {
              ...base,
              baseOptions: {
                modelAssetPath: "/vision/models/pose_landmarker_full.task",
                delegate: "GPU",
              },
            });
          } catch {
            return PoseLandmarker.createFromOptions(vision, {
              ...base,
              baseOptions: {
                modelAssetPath: "/vision/models/pose_landmarker_full.task",
                delegate: "CPU",
              },
            });
          }
        })(),
      ]);
      if (loaded[0].status === "fulfilled") model = loaded[0].value;
      if (loaded[1].status === "fulfilled") pose = loaded[1].value;
      if (closed) {
        pose?.close();
        pose = null;
        await model?.close();
        model = null;
        return;
      }
      const failed = loaded.find((value) => value.status === "rejected");
      if (failed?.status === "rejected") throw failed.reason;
      lastFrame = performance.now();
      publish({
        phase: "ready",
        boundary: model!.boundary,
        feedback: "Posisikan tubuh menyamping, lalu tekan Kalibrasi tangan.",
      });
      watchdog = window.setInterval(() => {
        if (performance.now() - lastFrame > 750 || document.hidden) {
          if (wasCounting) resetMovement();
          framePoints = [];
          hipFilter.reset();
          redraw();
          publish({
            angle: null,
            hip: { angle: null, offset: null, status: "unavailable" },
            feedback: "Tracking terhenti. Pastikan kamera tetap aktif.",
          });
        }
      }, 250);
      raf = requestAnimationFrame(() => void loop());
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError")
        fail(new Error("Izinkan akses kamera, lalu tekan Coba lagi."));
      else if (error instanceof DOMException && error.name === "NotFoundError")
        fail(new Error("Kamera tidak ditemukan di perangkat ini."));
      else fail(error);
    }
  }
  return { start, calibrate, resetMovement, close, redraw };
}
