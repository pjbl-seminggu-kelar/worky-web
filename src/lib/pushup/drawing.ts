import { ARMS, validPoint, type Point, type Side } from "./pose";

export const BODY_CONNECTIONS = [
  [11, 12],
  [11, 13],
  [13, 15],
  [15, 17],
  [15, 19],
  [15, 21],
  [17, 19],
  [12, 14],
  [14, 16],
  [16, 18],
  [16, 20],
  [16, 22],
  [18, 20],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [27, 29],
  [29, 31],
  [27, 31],
  [24, 26],
  [26, 28],
  [28, 30],
  [30, 32],
  [28, 32],
] as const;
export function containRect(fw: number, fh: number, bw: number, bh: number) {
  if (![fw, fh, bw, bh].every((value) => Number.isFinite(value) && value > 0)) return null;
  const scale = Math.min(bw / fw, bh / fh);
  return {
    x: (bw - fw * scale) / 2,
    y: (bh - fh * scale) / 2,
    width: fw * scale,
    height: fh * scale,
  };
}
// Match object-fit: cover and centered object-position, including negative crop offsets.
export function coverRect(fw: number, fh: number, bw: number, bh: number) {
  if (![fw, fh, bw, bh].every((value) => Number.isFinite(value) && value > 0)) return null;
  const scale = Math.max(bw / fw, bh / fh);
  return {
    x: (bw - fw * scale) / 2,
    y: (bh - fh * scale) / 2,
    width: fw * scale,
    height: fh * scale,
  };
}
export function drawBody(
  canvas: HTMLCanvasElement,
  points: Point[],
  side: Side | null,
  fw: number,
  fh: number,
  tone: string,
  hipWarning: boolean,
) {
  const width = canvas.clientWidth,
    height = canvas.clientHeight,
    dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const rect = coverRect(fw, fh, width, height);
  if (!rect) return;
  const selected: readonly number[] = side ? ARMS[side] : [];
  const point = (id: number) => {
    const p = points[id];
    return validPoint(p) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1
      ? { x: rect.x + p.x * rect.width, y: rect.y + p.y * rect.height }
      : null;
  };
  ctx.lineCap = "round";
  for (const [from, to] of BODY_CONNECTIONS) {
    const a = point(from),
      b = point(to);
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = "rgba(0,0,0,.7)";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle =
      selected.includes(from) && selected.includes(to)
        ? tone
        : hipWarning && [23, 24].includes(to)
          ? "#fbbf24"
          : "#e2e8f0";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  for (let id = 11; id <= 32; id++) {
    const p = point(id);
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, selected.includes(id) ? 4 : 3, 0, Math.PI * 2);
    ctx.fillStyle = selected.includes(id)
      ? tone
      : hipWarning && [23, 24].includes(id)
        ? "#fbbf24"
        : "#e2e8f0";
    ctx.fill();
  }
}
