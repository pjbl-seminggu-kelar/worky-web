import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ArmSelector, elbowAngle, type Point } from "@/lib/pushup/pose";
import { StatefulRepCounter, type RepEvent } from "@/lib/pushup/streaming-fsm";
import { BODY_CONNECTIONS, containRect, coverRect } from "@/lib/pushup/drawing";
import { hipGeometry, StableHipGuidance } from "@/lib/pushup/guidance";
import {
  initialWorkoutState,
  pushupSupported,
  reduceWorkout,
  type WorkoutAction,
} from "@/lib/pushup/session";
import type { WorkoutPlanItem } from "@/lib/workouts";

function landmarks() {
  return Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
}
const item = (slug = "push_up", sets = 3, targetReps = 12): WorkoutPlanItem => ({
  id: slug,
  planId: "plan",
  exerciseId: slug,
  dayOfWeek: 1,
  orderIndex: 0,
  sets,
  targetReps,
  targetDurationSeconds: null,
  restSeconds: 99,
  notes: null,
  exercise: { id: slug, slug, name: slug, category: "UPPER", equipmentRequired: [] },
});
const rep = (valid: boolean): WorkoutAction => ({
  type: "rep",
  valid,
  minAngle: valid ? 70 : 100,
  probability: valid ? 0.1 : 0.9,
  timeSeconds: 10,
});

describe("push-up session progression", () => {
  it("requires 12 ANN-valid reps per set, rests item.restSeconds between sets and 30 between exercises", () => {
    const items = [item(), { ...item(), id: "second" }];
    let state = initialWorkoutState();
    const send = (action: WorkoutAction) => {
      state = reduceWorkout(state, action, items);
    };
    send({ type: "start" });
    send(rep(false));
    expect(state.setValid).toBe(0);
    expect(state.stats.invalid).toBe(1);
    for (let set = 1; set <= 3; set++) {
      for (let n = 0; n < 11; n++) send(rep(true));
      expect(state.phase).toBe("work");
      expect(state.setValid).toBe(11);
      send(rep(true));
      if (set < 3) {
        expect(state.phase).toBe("set-rest");
        expect(state.remaining).toBe(99);
        send(rep(true));
        expect(state.stats.valid).toBe(set * 12);
        send({ type: "tick", seconds: 98 });
        expect(state.phase).toBe("set-rest");
        send({ type: "tick", seconds: 1 });
        expect(state.phase).toBe("work");
        expect(state.setValid).toBe(0);
        expect(state.set).toBe(set + 1);
      }
    }
    expect(state.phase).toBe("exercise-done");
    expect(state.stats.valid).toBe(36);
    send({ type: "saved" });
    expect(state.remaining).toBe(30);
    expect(state.phase).toBe("exercise-rest");
    send({ type: "tick", seconds: 30 });
    expect(state.index).toBe(1);
    expect(state.phase).toBe("setup");
    expect(state.stats.valid).toBe(0);
    expect(state.completed.valid).toBe(36);
  });
  it("skips unsupported exercises without recording completions and finishes without a final rest", () => {
    const items = [item("squat"), item("push-up", 1, 1), item("plank")];
    let state = reduceWorkout(initialWorkoutState(), { type: "skip" }, items);
    expect(state.skipped).toEqual(["squat"]);
    expect(state.index).toBe(1);
    state = reduceWorkout(state, { type: "start" }, items);
    state = reduceWorkout(state, rep(true), items);
    state = reduceWorkout(state, { type: "saved" }, items);
    state = reduceWorkout(state, { type: "tick", seconds: 30 }, items);
    state = reduceWorkout(state, { type: "skip" }, items);
    expect(state.phase).toBe("finished");
    expect(state.completedNames).toEqual(["push-up"]);
    expect(state.completed.valid).toBe(1);
    const only = [item("push_up", 1, 1)];
    let last = reduceWorkout(initialWorkoutState(), { type: "start" }, only);
    last = reduceWorkout(last, rep(true), only);
    last = reduceWorkout(last, { type: "saved" }, only);
    expect(last.phase).toBe("finished");
    expect(last.remaining).toBe(0);
  });
  it("never counts during setup, rest, save or on partial movement", () => {
    const items = [item("push_up", 1, 1)];
    let state = initialWorkoutState();
    expect(reduceWorkout(state, rep(true), items)).toBe(state);
    state = reduceWorkout(state, { type: "start" }, items);
    state = reduceWorkout(state, { type: "unassessed" }, items);
    expect(state.setValid).toBe(0);
    expect(state.stats.unassessed).toBe(1);
    state = reduceWorkout(state, rep(true), items);
    expect(reduceWorkout(state, rep(true), items)).toBe(state);
  });
  it("rejects missing or duration-only push-up targets rather than inventing a target", () => {
    expect(pushupSupported({ ...item(), targetReps: null })).toBe(false);
    expect(pushupSupported({ ...item(), targetDurationSeconds: 30 })).toBe(false);
    expect(pushupSupported(item("push-up"))).toBe(true);
  });
});

describe("pose geometry and calibration", () => {
  it("preserves angle in landscape, a 90-degree rotation and mirrored preview", () => {
    const width = 1280,
      height = 720,
      theta = (80 * Math.PI) / 180;
    const pixel = [
      { x: 600, y: 300 },
      { x: 500, y: 300 },
      { x: 500 + 100 * Math.cos(theta), y: 300 + 100 * Math.sin(theta) },
    ];
    const angle = (pixels: { x: number; y: number }[], w: number, h: number) => {
      const points = landmarks();
      [11, 13, 15].forEach((id, index) => {
        points[id] = { x: pixels[index]!.x / w, y: pixels[index]!.y / h, visibility: 1 };
      });
      return elbowAngle(points, "left", w, h);
    };
    expect(angle(pixel, width, height)).toBeCloseTo(80, 10);
    expect(
      angle(
        pixel.map((p) => ({ x: height - p.y, y: p.x })),
        height,
        width,
      ),
    ).toBeCloseTo(80, 10);
    expect(
      angle(
        pixel.map((p) => ({ x: width - p.x, y: p.y })),
        width,
        height,
      ),
    ).toBeCloseTo(80, 10);
    expect(elbowAngle([], "left", width, height)).toBeNull();
  });
  it("locks the visible anatomical arm, fails ambiguous calibration, and clears it on reset", () => {
    const points = landmarks();
    for (const id of [11, 13, 15]) points[id] = { x: 0.5, y: 0.5, visibility: 0.9 };
    for (const id of [12, 14, 16]) points[id] = { x: 0.5, y: 0.5, visibility: 0.5 };
    const selector = new ArmSelector();
    for (let n = 0; n <= 20; n++) selector.update(n * 50, points);
    expect(selector.state.side).toBe("left");
    expect(selector.update(1100, []).side).toBe("left");
    selector.reset();
    for (const id of [12, 14, 16]) points[id]!.visibility = 0.9;
    for (let n = 0; n <= 20; n++) selector.update(n * 50, points);
    expect(selector.state.phase).toBe("failed");
    expect(selector.state.side).toBeNull();
  });
  it("uses a contained frame and excludes every head landmark from the skeleton", () => {
    expect(containRect(1280, 720, 400, 800)).toEqual({ x: 0, y: 287.5, width: 400, height: 225 });
    expect(BODY_CONNECTIONS.flat().every((id) => id >= 11)).toBe(true);
    expect(BODY_CONNECTIONS.flat()).toContain(32);
  });
  it("maps full-screen cover cropping correctly in portrait and landscape", () => {
    const portrait = coverRect(1280, 720, 400, 800)!;
    expect(portrait.height).toBe(800);
    expect(portrait.x).toBeCloseTo(-511.111111, 5);
    expect(portrait.y).toBe(0);
    expect(portrait.x + portrait.width * 0.5).toBeCloseTo(200);
    const landscape = coverRect(720, 1280, 800, 400)!;
    expect(landscape.width).toBe(800);
    expect(landscape.y).toBeCloseTo(-511.111111, 5);
    expect(landscape.y + landscape.height * 0.5).toBeCloseTo(200);
    expect(coverRect(0, 720, 400, 800)).toBeNull();
  });
  it("distinguishes raised/sagging hips, remains mirror-invariant and suppresses low-quality or brief warnings", () => {
    const points: Point[] = landmarks();
    for (const [id, x, y] of [
      [11, 0.1, 0.4],
      [23, 0.5, 0.2],
      [25, 0.7, 0.4],
      [27, 0.9, 0.4],
    ])
      points[id!] = { x: x!, y: y!, visibility: 1 };
    const high = hipGeometry(points, "left", 1000, 1000);
    expect(high.status).toBe("high");
    expect(
      hipGeometry(
        points.map((p) => ({ ...p, x: 1 - p.x })),
        "left",
        1000,
        1000,
      ).status,
    ).toBe("high");
    points[23]!.y = 0.6;
    expect(hipGeometry(points, "left", 1000, 1000).status).toBe("low");
    const stable = new StableHipGuidance();
    expect(stable.update(0, high).status).toBe("unavailable");
    expect(stable.update(599, high).status).toBe("unavailable");
    expect(stable.update(600, high).status).toBe("high");
    points[27]!.visibility = 0.1;
    expect(hipGeometry(points, "left", 1000, 1000).status).toBe("unavailable");
  });
});

describe("FSM v2 Python parity", () => {
  it("matches all synthetic reference frames, events, finish and reset", () => {
    type Frame = {
      emitted: RepEvent[];
      state: string;
      rep: RepEvent | null;
      top_angle: number | null;
      top_time: number | null;
      last_valid_t: number | null;
      last_timestamp: number | null;
    };
    const fixtures = JSON.parse(
      readFileSync("src/test/fixtures/fsm-python-reference.json", "utf8"),
    ) as {
      synthetic_only: boolean;
      cases: {
        name: string;
        samples: [number, number | null][];
        frames: Frame[];
        finished: RepEvent[];
        events: RepEvent[];
      }[];
    };
    expect(fixtures.synthetic_only).toBe(true);
    for (const fixture of fixtures.cases) {
      const counter = new StatefulRepCounter();
      fixture.samples.forEach(([time, angle], index) => {
        const expected = fixture.frames[index]!;
        expect(counter.update(time, angle), `${fixture.name} frame ${index}`).toEqual(
          expected.emitted,
        );
        for (const key of [
          "state",
          "rep",
          "top_angle",
          "top_time",
          "last_valid_t",
          "last_timestamp",
        ] as const)
          expect(counter[key], `${fixture.name} ${key}`).toEqual(expected[key]);
      });
      expect(counter.finish()).toEqual(fixture.finished);
      expect(counter.events).toEqual(fixture.events);
      counter.reset();
      expect(counter).toEqual(new StatefulRepCounter());
    }
  }, 15_000);
});
