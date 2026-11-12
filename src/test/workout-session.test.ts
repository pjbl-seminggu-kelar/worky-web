import { describe, expect, it } from "vitest";

import { getWorkoutDay, shouldRunSessionTimer, type WorkoutPlan } from "@/lib/workouts";

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
