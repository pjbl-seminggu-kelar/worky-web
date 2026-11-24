import { describe, expect, it, vi } from "vitest";

import {
  abandonWorkoutSession,
  initialWorkoutState,
  reduceWorkout,
  syncSessionRepEvents,
  type RepRecord,
} from "@/lib/pushup/session";
import {
  getWorkoutDay,
  mapSessionDetailToWorkoutResult,
  shouldRunSessionTimer,
  type WorkoutPlan,
} from "@/lib/workouts";

const plan: WorkoutPlan = {
  id: "plan-1",
  userId: "user-1",
  name: "Plan pemula",
  goal: "GENERAL_FITNESS",
  status: "ACTIVE",
  createdAt: "2026-11-12T00:00:00.000Z",
  updatedAt: "2026-11-12T00:00:00.000Z",
  workoutPlanItems: [
    {
      id: "item-1",
      planId: "plan-1",
      exerciseId: "exercise-1",
      dayOfWeek: 2,
      orderIndex: 0,
      sets: 3,
      targetReps: 12,
      targetDurationSeconds: null,
      restSeconds: 60,
      notes: null,
      exercise: {
        id: "exercise-1",
        slug: "push_up",
        name: "Push-up",
        category: "UPPER",
        equipmentRequired: [],
      },
    },
  ],
};

describe("workout session selection", () => {
  it("selects the requested workout day", () => {
    expect(getWorkoutDay(plan, 2)?.planItems.map((item) => item.id)).toEqual(["item-1"]);
  });

  it("falls back to the first workout when the requested day is empty", () => {
    expect(getWorkoutDay(plan, 7)?.dayOfWeek).toBe(2);
  });
});

describe("workout session timer", () => {
  it("keeps the rest countdown running without an active session ID", () => {
    expect(
      shouldRunSessionTimer({
        phase: "rest",
        isReady: true,
        hasItems: true,
        remaining: 10,
        isStarting: false,
        hasSessionId: false,
        hasSessionError: false,
      }),
    ).toBe(true);
  });

  it("waits for a session ID before starting a workout countdown", () => {
    expect(
      shouldRunSessionTimer({
        phase: "work",
        isReady: true,
        hasItems: true,
        remaining: 10,
        isStarting: false,
        hasSessionId: false,
        hasSessionError: false,
      }),
    ).toBe(false);
  });
});

describe("dynamic restSeconds in workout reducer", () => {
  it("uses item.restSeconds between sets when positive and defaults to 45 otherwise", () => {
    const customItem = { ...plan.workoutPlanItems[0]!, sets: 2, targetReps: 1, restSeconds: 60 };
    let state = reduceWorkout(initialWorkoutState(), { type: "start" }, [customItem]);
    state = reduceWorkout(
      state,
      { type: "rep", valid: true, minAngle: 72, probability: 0.1, timeSeconds: 5 },
      [customItem],
    );
    expect(state.phase).toBe("set-rest");
    expect(state.remaining).toBe(60);

    const zeroRestItem = { ...customItem, restSeconds: 0 };
    let fallbackState = reduceWorkout(initialWorkoutState(), { type: "start" }, [zeroRestItem]);
    fallbackState = reduceWorkout(
      fallbackState,
      { type: "rep", valid: true, minAngle: 72, probability: 0.1, timeSeconds: 5 },
      [zeroRestItem],
    );
    expect(fallbackState.phase).toBe("set-rest");
    expect(fallbackState.remaining).toBe(45);
  });
});

describe("session rep events sync", () => {
  const reps: RepRecord[] = [
    { valid: true, minAngle: 75, probability: 0.12, timeSeconds: 3.4, set: 1, attempt: 1, exercise: "Push-up" },
    { valid: false, minAngle: 102, probability: 0.88, timeSeconds: 7.25, set: 1, attempt: 2, exercise: "Push-up" },
  ];

  it("posts VALID_REP and INVALID_REP payloads and avoids duplicates on retry", async () => {
    const sentBySession = new Map<string, Set<number>>();
    const postEvent = vi
      .fn()
      .mockResolvedValueOnce({ status: "success" })
      .mockRejectedValueOnce(new Error("network glitch"))
      .mockResolvedValueOnce({ status: "success" });

    await expect(
      syncSessionRepEvents({
        sessionId: "sess-1",
        reps,
        sentBySession,
        token: "token-1",
        postEvent,
      }),
    ).rejects.toThrow("network glitch");

    expect(postEvent).toHaveBeenCalledTimes(2);
    expect(postEvent).toHaveBeenNthCalledWith(1, "/sessions/sess-1/events", {
      method: "POST",
      token: "token-1",
      body: {
        eventType: "VALID_REP",
        repIndex: 1,
        startMs: 3400,
        confidence: 0.12,
        details: { minAngle: 75, set: 1 },
      },
    });

    await syncSessionRepEvents({
      sessionId: "sess-1",
      reps,
      sentBySession,
      token: "token-1",
      postEvent,
    });

    expect(postEvent).toHaveBeenCalledTimes(3);
    expect(postEvent).toHaveBeenNthCalledWith(3, "/sessions/sess-1/events", {
      method: "POST",
      token: "token-1",
      body: {
        eventType: "INVALID_REP",
        repIndex: 2,
        errorCode: "shallow_depth",
        startMs: 7250,
        confidence: 0.88,
        details: { minAngle: 102, set: 1 },
      },
    });
  });
});

describe("session abandon", () => {
  it("calls POST /sessions/:id/abandon when active and ignores finished/idle states", async () => {
    const postAbandon = vi.fn().mockResolvedValue({ status: "success" });

    await expect(
      abandonWorkoutSession({
        sessionId: "sess-1",
        phase: "work",
        token: "token-1",
        postAbandon,
      }),
    ).resolves.toBe(true);
    expect(postAbandon).toHaveBeenCalledWith("/sessions/sess-1/abandon", {
      method: "POST",
      token: "token-1",
      body: {},
    });

    await expect(
      abandonWorkoutSession({
        sessionId: "sess-1",
        phase: "finished",
        token: "token-1",
        postAbandon,
      }),
    ).resolves.toBe(false);
    await expect(
      abandonWorkoutSession({
        sessionId: "sess-1",
        phase: "exercise-rest",
        token: "token-1",
        postAbandon,
      }),
    ).resolves.toBe(false);
    await expect(
      abandonWorkoutSession({
        sessionId: "",
        phase: "setup",
        token: "token-1",
        postAbandon,
      }),
    ).resolves.toBe(false);
    expect(postAbandon).toHaveBeenCalledTimes(1);
  });

  it("swallows network errors during best-effort abandon", async () => {
    const postAbandon = vi.fn().mockRejectedValue(new Error("timeout"));
    await expect(
      abandonWorkoutSession({
        sessionId: "sess-2",
        phase: "set-rest",
        token: "token-1",
        postAbandon,
      }),
    ).resolves.toBe(false);
  });
});

describe("dynamic session report mapping", () => {
  it("maps backend session detail and filters INVALID_REP / FORM_ERROR_START events", () => {
    const mapped = mapSessionDetailToWorkoutResult({
      id: "sess-99",
      sessionName: "Push-up Harian",
      activeDurationSeconds: 125,
      totalReps: 10,
      validReps: 8,
      invalidReps: 2,
      unassessedAttempts: 1,
      exercise: { name: "Push-up", slug: "push_up" },
      workoutEvents: [
        { eventType: "VALID_REP", repIndex: 1, startMs: 1500, details: { set: 1 } },
        {
          eventType: "INVALID_REP",
          repIndex: 2,
          errorCode: "shallow_depth",
          startMs: 4200,
          details: { set: 1 },
        },
        {
          eventType: "FORM_ERROR_START",
          repIndex: 4,
          errorCode: "hip_sag",
          startMs: 9000,
          details: { set: 2, message: "Pinggul turun" },
        },
      ],
    });

    expect(mapped).toEqual({
      sessionId: "sess-99",
      lastCompletedSessionId: "sess-99",
      planName: "Push-up Harian",
      exerciseNames: ["Push-up"],
      totalExercises: 1,
      durationSeconds: 125,
      validReps: 8,
      invalidReps: 2,
      formRate: 80,
      unassessedAttempts: 1,
      events: [
        { timeSeconds: 4.2, rep: 2, set: 1, exercise: "Push-up", message: "Kurang turun" },
        { timeSeconds: 9, rep: 4, set: 2, exercise: "Push-up", message: "Pinggul turun" },
      ],
    });
  });
});
