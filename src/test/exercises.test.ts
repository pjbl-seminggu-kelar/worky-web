import { describe, expect, it } from "vitest";

import { exercisesEndpoint, searchExercises, type Exercise } from "@/lib/exercises";

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
});
