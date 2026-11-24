import { describe, expect, it } from "vitest";

import {
  cvStatusLabel,
  exercisesEndpoint,
  findLatestExerciseFormScore,
  searchExercises,
  type Exercise,
} from "@/lib/exercises";

const exercises: Exercise[] = [
  {
    id: "push-up-id",
    slug: "push_up",
    name: "Push-up",
    category: "UPPER",
    description: "Dada / Tricep / Bahu",
    defaultSets: 3,
    defaultTargetReps: 12,
    defaultTargetDurationSeconds: null,
    cvStatus: "VALIDATED",
  },
  {
    id: "plank-id",
    slug: "plank",
    name: "Plank",
    category: "CORE",
    description: "Stabilitas Otot Core",
    defaultSets: 3,
    defaultTargetReps: 12,
    defaultTargetDurationSeconds: 45,
    cvStatus: "PLANNED",
  },
];

describe("exercise catalog helpers", () => {
  it("uses the unfiltered endpoint for the Semua category", () => {
    expect(exercisesEndpoint("ALL")).toBe("/exercises");
  });

  it("adds the selected category to the endpoint", () => {
    expect(exercisesEndpoint("CORE")).toBe("/exercises?category=CORE");
  });

  it.each([
    ["push", "Push-up"],
    ["tricep", "Push-up"],
    ["core", "Plank"],
    ["  PLANK  ", "Plank"],
  ])("searches '%s' across name, description, and slug", (query, expectedName) => {
    expect(searchExercises(exercises, query).map((exercise) => exercise.name)).toEqual([
      expectedName,
    ]);
  });

  it("returns all exercises for an empty search", () => {
    expect(searchExercises(exercises, "   ")).toEqual(exercises);
  });

  it("returns an empty result when nothing matches", () => {
    expect(searchExercises(exercises, "burpee")).toEqual([]);
  });

  it("maps cvStatus to Indonesian badge labels", () => {
    expect(cvStatusLabel("VALIDATED")).toBe("AI Aktif");
    expect(cvStatusLabel("EXPERIMENTAL")).toBe("Beta");
    expect(cvStatusLabel("PLANNED")).toBe("Segera");
  });

  it("finds the latest exercise form score or falls back to em dash", () => {
    expect(findLatestExerciseFormScore([], "push_up")).toBe("—");

    const history = [
      {
        startedAt: "2026-11-10T10:00:00.000Z",
        totalReps: 10,
        validReps: 6,
        validRepRate: 60,
        exercise: { slug: "push_up" },
      },
      {
        startedAt: "2026-11-12T10:00:00.000Z",
        totalReps: 10,
        validReps: 9,
        validRepRate: 0.9,
        exercise: { slug: "push_up" },
      },
      {
        startedAt: "2026-11-13T10:00:00.000Z",
        totalReps: 10,
        validReps: 8,
        exercise: { slug: "squat" },
      },
    ];

    expect(findLatestExerciseFormScore(history, "push-up")).toBe("90%");
    expect(findLatestExerciseFormScore(history, "squat")).toBe("80%");
    expect(findLatestExerciseFormScore(history, "plank")).toBe("—");
  });
});
