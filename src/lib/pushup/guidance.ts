import { validPoint, type Point, type Side } from "./pose";

export type HipGuidance = {
  angle: number | null;
  offset: number | null;
  status: "unavailable" | "aligned" | "high" | "low";
};
// Experimental visual guidance only. These thresholds never enter ANN or rep acceptance.
export const HIP_GUIDANCE = { enter: 0.08, exit: 0.05, stableMs: 600 };
export function hipGeometry(
  points: Point[],
  side: Side,
  width: number,
  height: number,
): HipGuidance {
  const ids = side === "left" ? [11, 23, 25, 27] : [12, 24, 26, 28];
  const [shoulder, hip, knee, ankle] = ids.map((id) => points[id]);
  const unavailable: HipGuidance = { angle: null, offset: null, status: "unavailable" };
  if (
    !(width > 0 && height > 0) ||
    !validPoint(shoulder) ||
    !validPoint(hip) ||
    !validPoint(knee) ||
    !validPoint(ankle)
  )
    return unavailable;
  const s = { x: shoulder.x * width, y: shoulder.y * height };
  const h = { x: hip.x * width, y: hip.y * height };
  const k = { x: knee.x * width, y: knee.y * height };
  const a = { x: ankle.x * width, y: ankle.y * height };
  const dx = a.x - s.x,
    dy = a.y - s.y,
    length = Math.hypot(dx, dy);
  // A side view with a roughly horizontal body is necessary to interpret up/down.
  if (length < Math.min(width, height) * 0.2 || Math.abs(dx) < length * 0.7) return unavailable;
  const projection = ((h.x - s.x) * dx + (h.y - s.y) * dy) / (length * length);
  if (projection < 0 || projection > 1) return unavailable;
  const offset = (h.y - (s.y + projection * dy)) / length;
  const u = { x: s.x - h.x, y: s.y - h.y },
    v = { x: k.x - h.x, y: k.y - h.y };
  const norm = Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y);
  if (norm < 1e-10) return unavailable;
  const angle =
    (Math.acos(Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y) / norm))) * 180) / Math.PI;
  return {
    angle,
    offset,
    status: offset < -HIP_GUIDANCE.enter ? "high" : offset > HIP_GUIDANCE.enter ? "low" : "aligned",
  };
}

export class StableHipGuidance {
  private candidate: HipGuidance["status"] = "unavailable";
  private since = 0;
  private status: HipGuidance["status"] = "unavailable";
  reset() {
    this.candidate = "unavailable";
    this.status = "unavailable";
    this.since = 0;
  }
  update(now: number, geometry: HipGuidance): HipGuidance {
    if (geometry.status === "unavailable") {
      this.reset();
      return geometry;
    }
    let next = geometry.status;
    if (this.status === "high" && geometry.offset! < -HIP_GUIDANCE.exit) next = "high";
    if (this.status === "low" && geometry.offset! > HIP_GUIDANCE.exit) next = "low";
    if (next !== this.candidate) {
      this.candidate = next;
      this.since = now;
    }
    if (now - this.since >= HIP_GUIDANCE.stableMs) this.status = next;
    return { ...geometry, status: this.status };
  }
}
