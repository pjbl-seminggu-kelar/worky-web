const pushup = "/pushup.png";
const squat = "/squat.png";
const situp = "/situp.png";
const plank = "/plank.png";
const pullup = "/pullup.png";
const dips = "/dips.png";

/* ── API types for /exercises ── */

export type ExerciseItem = {
  id: string;
  slug: string;
  name: string;
  category: "UPPER" | "LOWER" | "CORE" | "FULL_BODY" | string;
  description: string;
  defaultSets: number;
  defaultTargetReps: number | null;
  defaultTargetDurationSeconds: number | null;
  cvStatus: "VALIDATED" | "EXPERIMENTAL" | "PLANNED" | string;
  imageUrl?: string;
};

export type ExercisesResponse = {
  status: "success";
  data: ExerciseItem[];
};

export const exerciseImages: Record<string, string> = {
  push_up: pushup,
  "push-up": pushup,
  squat: squat,
  sit_up: situp,
  "sit-up": situp,
  plank: plank,
  pull_up: pullup,
  "pull-up": pullup,
  chair_dips: dips,
  "chair-dips": dips,
  dips: dips,
};

export function getExerciseImage(slug: string, imageUrl?: string): string {
  if (imageUrl) return imageUrl;
  const normalized = slug.toLowerCase().replace(/-/g, "_");
  return exerciseImages[normalized] ?? exerciseImages[slug] ?? pushup;
}

export function formatExerciseTarget(
  sets: number,
  reps: number | null,
  durationSeconds: number | null,
): string {
  if (durationSeconds) {
    return `${sets} × ${durationSeconds} dtk`;
  }
  return `${sets} × ${reps ?? 12} rep`;
}

/* ── API types for /plans/generate ── */

export type PlanExercise = {
  id: string;
  slug: string;
  name: string;
  category: string;
  equipmentRequired: string[];
};

export type WorkoutPlanItem = {
  id: string;
  planId: string;
  exerciseId: string;
  dayOfWeek: number; // 1 = Monday … 7 = Sunday
  orderIndex: number;
  sets: number;
  targetReps: number | null;
  targetDurationSeconds: number | null;
  restSeconds: number;
  notes: string | null;
  exercise: PlanExercise;
};

export type WorkoutPlan = {
  id: string;
  userId: string;
  name: string;
  goal: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  workoutPlanItems: WorkoutPlanItem[];
};

export type GeneratePlanResponse = {
  status: "success";
  data: WorkoutPlan;
};

export const ACTIVE_PLAN_KEY = "worky:active-plan";

/* ── Day helpers ── */

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: "Turun berat",
  MUSCLE_BUILDING: "Bentuk tubuh",
  STRENGTH: "Kekuatan",
  GENERAL_FITNESS: "Kebugaran",
};

const CATEGORY_LABELS: Record<string, string> = {
  UPPER: "Upper Body",
  LOWER: "Lower Body",
  CORE: "Core",
  FULL_BODY: "Full Body",
};

/** Convert goal enum to readable label */
export function goalLabel(goal: string) {
  return GOAL_LABELS[goal] ?? goal;
}

/** Convert API dayOfWeek (1=Mon…7=Sun) to label */
export function dayLabel(dayOfWeek: number) {
  return DAY_LABELS[(dayOfWeek - 1) % 7] ?? "?";
}

/** Format a WorkoutPlanItem into a readable target string */
export function formatItemTarget(item: WorkoutPlanItem) {
  if (item.targetDurationSeconds) {
    return `${item.exercise.name} ${item.sets}×${item.targetDurationSeconds} dtk`;
  }
  return `${item.exercise.name} ${item.sets}×${item.targetReps ?? 0}`;
}

/** Short sets×reps target only, e.g. "3×10" or "3×45 dtk" */
export function formatSetsShort(item: WorkoutPlanItem) {
  if (item.targetDurationSeconds) {
    return `${item.sets}×${item.targetDurationSeconds} dtk`;
  }
  return `${item.sets}×${item.targetReps ?? 0}`;
}

/** Group plan items by dayOfWeek and build display data for /plan page */
export function buildPlanDays(plan: WorkoutPlan) {
  const byDay = new Map<number, WorkoutPlanItem[]>();
  for (const item of plan.workoutPlanItems) {
    const existing = byDay.get(item.dayOfWeek) ?? [];
    existing.push(item);
    byDay.set(item.dayOfWeek, existing);
  }

  // Get today's dayOfWeek (JS: 0=Sun → we remap to 1=Mon…7=Sun)
  const jsDay = new Date().getDay();
  const todayDow = jsDay === 0 ? 7 : jsDay;

  return Array.from({ length: 7 }, (_, i) => {
    const dow = i + 1;
    const items = byDay.get(dow) ?? [];
    // Sort by orderIndex
    items.sort((a, b) => a.orderIndex - b.orderIndex);

    const categories = items
      .map((it) => CATEGORY_LABELS[it.exercise.category] ?? it.exercise.category)
      .filter((v, idx, arr) => arr.indexOf(v) === idx);

    return {
      dayOfWeek: dow,
      day: DAY_LABELS[i]!,
      title: items.length > 0 ? categories.join(" + ") : "Istirahat",
      items: items.map(formatItemTarget),
      isToday: dow === todayDow,
      planItems: items,
    };
  });
}

/* ── Static/mock data ── */

export const exercises = [
  { id: "push-up", slug: "push_up", name: "Push-up", img: pushup, target: "3 × 12 rep", score: 86, category: "UPPER" },
  { id: "squat", slug: "squat", name: "Squat", img: squat, target: "3 × 15 rep", score: 92, category: "LOWER" },
  { id: "sit-up", slug: "sit_up", name: "Sit-up", img: situp, target: "3 × 20 rep", score: 74, category: "CORE" },
  { id: "plank", slug: "plank", name: "Plank", img: plank, target: "3 × 45 dtk", score: 81, category: "CORE" },
  { id: "pull-up", slug: "pull_up", name: "Pull-up", img: pullup, target: "3 × 8 rep", score: 80, category: "UPPER" },
  { id: "chair-dips", slug: "chair_dips", name: "Chair Dips", img: dips, target: "3 × 12 rep", score: 78, category: "UPPER" },
];

export const history = [
  { title: "Full Body Pemula", date: "Kemarin · 18 mnt", valid: 42, total: 48, img: squat },
  { title: "Upper Body Rumahan", date: "Sen · 22 mnt", valid: 35, total: 44, img: pushup },
  { title: "Core 10 Menit", date: "Sab · 10 mnt", valid: 50, total: 56, img: situp },
];

export const details: Record<string, { muscles: string; camera: string; steps: string[]; checks: string[] }> = {
  "push-up": {
    muscles: "Dada · Trisep · Bahu",
    camera: "Samping, 2–3 m",
    steps: ["Tangan selebar bahu, badan lurus.", "Turunkan dada hingga siku ±90°.", "Dorong kembali ke posisi awal."],
    checks: ["Pinggul turun", "Pinggul terlalu tinggi", "Turun kurang dalam", "Kepala menunduk"],
  },
  push_up: {
    muscles: "Dada · Trisep · Bahu",
    camera: "Samping, 2–3 m",
    steps: ["Tangan selebar bahu, badan lurus.", "Turunkan dada hingga siku ±90°.", "Dorong kembali ke posisi awal."],
    checks: ["Pinggul turun", "Pinggul terlalu tinggi", "Turun kurang dalam", "Kepala menunduk"],
  },
  squat: {
    muscles: "Paha · Glutes · Core",
    camera: "Samping atau depan",
    steps: ["Kaki selebar bahu.", "Dorong pinggul ke belakang, turun.", "Paha sejajar lantai, lalu berdiri."],
    checks: ["Lutut masuk ke dalam", "Tumit terangkat", "Punggung membungkuk", "Turun kurang dalam"],
  },
  "sit-up": {
    muscles: "Perut · Hip flexor",
    camera: "Samping, 2 m",
    steps: ["Berbaring, lutut ditekuk.", "Angkat badan ke arah lutut.", "Turun perlahan terkontrol."],
    checks: ["Menarik leher", "Gerakan terlalu cepat", "Rentang kurang penuh"],
  },
  sit_up: {
    muscles: "Perut · Hip flexor",
    camera: "Samping, 2 m",
    steps: ["Berbaring, lutut ditekuk.", "Angkat badan ke arah lutut.", "Turun perlahan terkontrol."],
    checks: ["Menarik leher", "Gerakan terlalu cepat", "Rentang kurang penuh"],
  },
  plank: {
    muscles: "Core · Bahu",
    camera: "Samping, 2–3 m",
    steps: ["Siku tepat di bawah bahu.", "Badan lurus dari kepala ke tumit.", "Tahan dan bernapas normal."],
    checks: ["Pinggul turun", "Pinggul terlalu tinggi", "Kepala menunduk"],
  },
  "pull-up": {
    muscles: "Punggung · Bisep · Bahu",
    camera: "Belakang / Samping, 2–3 m",
    steps: [
      "Genggam bar selebar bahu, telapak tangan menghadap depan.",
      "Tarik tubuh ke atas hingga dagu melewati bar.",
      "Turun perlahan kembali ke posisi awal.",
    ],
    checks: ["Kaki mengayun", "Rentang gerak kurang penuh", "Bahu tidak aktif"],
  },
  pull_up: {
    muscles: "Punggung · Bisep · Bahu",
    camera: "Belakang / Samping, 2–3 m",
    steps: [
      "Genggam bar selebar bahu, telapak tangan menghadap depan.",
      "Tarik tubuh ke atas hingga dagu melewati bar.",
      "Turun perlahan kembali ke posisi awal.",
    ],
    checks: ["Kaki mengayun", "Rentang gerak kurang penuh", "Bahu tidak aktif"],
  },
  "chair-dips": {
    muscles: "Trisep · Bahu Depan · Dada",
    camera: "Samping, 2 m",
    steps: [
      "Duduk di tepi kursi yang stabil, letakkan tangan di samping panggul.",
      "Geser panggul ke depan dan tekuk siku hingga ±90°.",
      "Dorong tubuh kembali ke atas menggunakan kekuatan trisep.",
    ],
    checks: ["Turun kurang dalam", "Siku mekar ke samping", "Bahu terlalu naik"],
  },
  chair_dips: {
    muscles: "Trisep · Bahu Depan · Dada",
    camera: "Samping, 2 m",
    steps: [
      "Duduk di tepi kursi yang stabil, letakkan tangan di samping panggul.",
      "Geser panggul ke depan dan tekuk siku hingga ±90°.",
      "Dorong tubuh kembali ke atas menggunakan kekuatan trisep.",
    ],
    checks: ["Turun kurang dalam", "Siku mekar ke samping", "Bahu terlalu naik"],
  },
};

export const plan = [
  { day: "Sen", date: 19, title: "Upper Body", items: ["Push-up 3×12", "Plank 3×45 dtk"], done: true },
  { day: "Sel", date: 20, title: "Lower Body", items: ["Squat 3×15", "Sit-up 3×20"], today: true },
  { day: "Rab", date: 21, title: "Istirahat aktif", items: ["Stretching 10 mnt"] },
  { day: "Kam", date: 22, title: "Full Body", items: ["Push-up 3×10", "Squat 3×12", "Plank 2×40 dtk"] },
  { day: "Jum", date: 23, title: "Istirahat", items: [] },
  { day: "Sab", date: 24, title: "Core", items: ["Sit-up 3×20", "Plank 3×50 dtk"] },
  { day: "Min", date: 25, title: "Istirahat", items: [] },
];
