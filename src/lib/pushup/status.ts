import type { Selection } from "./pose";
import type { HipGuidance } from "./guidance";

export type CameraStatus = {
  phase: "loading" | "ready" | "error";
  error: string;
  calibration: Selection | null;
  angle: number | null;
  hip: HipGuidance;
  boundary: number | null;
  feedback: string;
};
export const initialCameraStatus = (): CameraStatus => ({
  phase: "loading",
  error: "",
  calibration: null,
  angle: null,
  hip: { angle: null, offset: null, status: "unavailable" },
  boundary: null,
  feedback: "Menyiapkan kamera dan model…",
});
