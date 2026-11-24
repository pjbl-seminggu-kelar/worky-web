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

export function cvStatusLabel(cvStatus?: string): string {
  switch (cvStatus) {
    case "VALIDATED":
      return "AI Aktif";
    case "EXPERIMENTAL":
      return "Beta";
    default:
      return "Segera";
  }
}

export function cvStatusBadgeClass(cvStatus?: string): string {
  switch (cvStatus) {
    case "VALIDATED":
      return "bg-primary text-primary-foreground";
    case "EXPERIMENTAL":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-background/15 text-background/80";
  }
}

export type ExerciseSessionSummary = {
  startedAt?: string;
  totalReps?: number;
  validReps?: number;
  validRepRate?: number | null;
  exercise?: {
    slug?: string;
  } | null;
};

export function findLatestExerciseFormScore(
  sessions: ExerciseSessionSummary[],
  targetSlug: string,
): string {
  const normalizedTarget = targetSlug.trim().toLowerCase().replace(/-/g, "_");
  if (!normalizedTarget) return "—";

  const matching = sessions.filter(
    (session) =>
      session.exercise?.slug?.trim().toLowerCase().replace(/-/g, "_") === normalizedTarget,
  );
  if (matching.length === 0) return "—";

  const sorted = [...matching].sort((a, b) => {
    const timeA = a.startedAt ? Date.parse(a.startedAt) : Number.NaN;
    const timeB = b.startedAt ? Date.parse(b.startedAt) : Number.NaN;
    if (Number.isNaN(timeA) || Number.isNaN(timeB)) return 0;
    return timeB - timeA;
  });

  const latest = sorted[0]!;
  if (typeof latest.validRepRate === "number" && Number.isFinite(latest.validRepRate)) {
    const isFraction =
      (latest.validRepRate > 0 && latest.validRepRate < 1) ||
      (latest.validRepRate === 1 &&
        (latest.totalReps ?? 0) > 0 &&
        latest.validReps === latest.totalReps);
    const rate = isFraction
      ? Math.round(latest.validRepRate * 100)
      : Math.round(latest.validRepRate);
    return `${Math.min(100, Math.max(0, rate))}%`;
  }

  if ((latest.totalReps ?? 0) > 0 && typeof latest.validReps === "number") {
    const rate = Math.round((latest.validReps / latest.totalReps!) * 100);
    return `${Math.min(100, Math.max(0, rate))}%`;
  }

  return "—";
}
