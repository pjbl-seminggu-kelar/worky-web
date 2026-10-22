export type ExerciseCategory = "UPPER" | "LOWER" | "CORE" | "FULL_BODY";

export type ExerciseCategoryFilter = ExerciseCategory | "ALL";

export type ExerciseCvStatus = "VALIDATED" | "EXPERIMENTAL" | "PLANNED";

export type Exercise = {
  id: string;
  slug: string;
  name: string;
  category: ExerciseCategory;
  description: string;
  defaultSets: number;
  defaultTargetReps: number | null;
  defaultTargetDurationSeconds: number | null;
  cvStatus: ExerciseCvStatus;
  imageUrl?: string;
};

export type ExercisesResponse = {
  status: "success";
  data: Exercise[];
};

export function exercisesEndpoint(category: ExerciseCategoryFilter) {
  if (category === "ALL") return "/exercises";

  return `/exercises?${new URLSearchParams({ category })}`;
}

export function searchExercises(exercises: Exercise[], search: string) {
  const keyword = search.trim().toLocaleLowerCase("id-ID");
  if (!keyword) return exercises;

  return exercises.filter((exercise) =>
    [exercise.name, exercise.description, exercise.slug, exercise.category].some((value) =>
      value.toLocaleLowerCase("id-ID").includes(keyword),
    ),
  );
}

export function exerciseRouteId(slug: string) {
  return slug.replaceAll("_", "-");
}

export function formatExerciseTarget(exercise: Exercise) {
  if (exercise.defaultTargetDurationSeconds !== null) {
    return `${exercise.defaultSets} × ${exercise.defaultTargetDurationSeconds} dtk`;
  }

  return `${exercise.defaultSets} × ${exercise.defaultTargetReps ?? 0} rep`;
}
