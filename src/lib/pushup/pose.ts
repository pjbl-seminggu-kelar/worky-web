export type Side = "left" | "right";
export type Point = { x: number; y: number; visibility?: number };
export const ARMS = { left: [11, 13, 15], right: [12, 14, 16] } as const;
export const CALIBRATION = { durationMs: 1000, minFrames: 15, visibility: 0.5, margin: 0.1 };
export function validPoint(p: Point | undefined): p is Point {
  return (
    !!p &&
    Number.isFinite(p.x) &&
    Number.isFinite(p.y) &&
    Number.isFinite(p.visibility) &&
    p.visibility! >= CALIBRATION.visibility &&
    p.visibility! <= 1
  );
}
export function armVisibility(points: Point[], side: Side): number {
  return (
    ARMS[side].reduce((sum, id) => {
      const p = points[id];
      return (
        sum +
        (p &&
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        Number.isFinite(p.visibility) &&
        p.visibility! >= 0 &&
        p.visibility! <= 1
          ? p.visibility!
          : 0)
      );
    }, 0) / 3
  );
}
export function elbowAngle(
  points: Point[],
  side: Side,
  width: number,
  height: number,
): number | null {
  if (!(width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height))) return null;
  const [s, e, w] = ARMS[side].map((id) => points[id]);
  if (!validPoint(s) || !validPoint(e) || !validPoint(w)) return null;
  const ax = (s.x - e.x) * width,
    ay = (s.y - e.y) * height;
  const bx = (w.x - e.x) * width,
    by = (w.y - e.y) * height;
  const norm = Math.hypot(ax, ay) * Math.hypot(bx, by);
  if (!Number.isFinite(norm) || norm < 1e-10) return null;
  const cosine = (ax * bx + ay * by) / norm;
  return (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI;
}
export type Selection = {
  phase: "calibrating" | "locked" | "failed";
  side: Side | null;
  frames: number;
  elapsed: number;
  left: number;
  right: number;
  reason: string;
};
export class ArmSelector {
  private start: number | null = null;
  private last = -Infinity;
  private sums = { left: 0, right: 0 };
  state: Selection = this.empty();
  private empty(): Selection {
    return {
      phase: "calibrating",
      side: null,
      frames: 0,
      elapsed: 0,
      left: 0,
      right: 0,
      reason: "",
    };
  }
  reset() {
    this.start = null;
    this.last = -Infinity;
    this.sums = { left: 0, right: 0 };
    this.state = this.empty();
  }
  update(timestamp: number, points: Point[]): Selection {
    if (this.state.phase !== "calibrating" || !Number.isFinite(timestamp) || timestamp <= this.last)
      return this.state;
    this.last = timestamp;
    this.start ??= timestamp;
    this.sums.left += armVisibility(points, "left");
    this.sums.right += armVisibility(points, "right");
    const frames = this.state.frames + 1;
    const elapsed = timestamp - this.start;
    const left = this.sums.left / frames,
      right = this.sums.right / frames;
    this.state = { ...this.state, frames, elapsed, left, right };
    if (elapsed >= CALIBRATION.durationMs) {
      const reason =
        frames < CALIBRATION.minFrames
          ? "Frame kalibrasi kurang dari 15. Coba lagi dengan pencahayaan lebih baik atau tutup aplikasi berat."
          : Math.max(left, right) < CALIBRATION.visibility
            ? "Lengan belum cukup terlihat. Pastikan bahu, siku, dan pergelangan masuk kamera."
            : Math.abs(left - right) + 1e-12 < CALIBRATION.margin
              ? "Visibilitas kedua lengan terlalu mirip. Posisikan tubuh menyamping lalu kalibrasi ulang."
              : "";
      this.state = {
        ...this.state,
        phase: reason ? "failed" : "locked",
        side: reason ? null : left > right ? "left" : "right",
        reason,
      };
    }
    return this.state;
  }
}
