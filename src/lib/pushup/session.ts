import type { WorkoutPlanItem } from "../workouts";

export type RepRecord = {
  valid: boolean;
  minAngle: number;
  probability: number;
  timeSeconds: number;
  set: number;
  attempt: number;
  exercise: string;
};
export type ExerciseStats = {
  valid: number;
  invalid: number;
  unassessed: number;
  activeSeconds: number;
};
export type SessionPhase =
  "setup" | "work" | "set-rest" | "exercise-done" | "exercise-rest" | "finished";
export type WorkoutState = {
  index: number;
  set: number;
  setValid: number;
  phase: SessionPhase;
  remaining: number;
  stats: ExerciseStats;
  completed: ExerciseStats;
  reps: RepRecord[];
  skipped: string[];
  completedNames: string[];
};
const emptyStats = (): ExerciseStats => ({ valid: 0, invalid: 0, unassessed: 0, activeSeconds: 0 });
export function initialWorkoutState(): WorkoutState {
  return {
    index: 0,
    set: 1,
    setValid: 0,
    phase: "setup",
    remaining: 0,
    stats: emptyStats(),
    completed: emptyStats(),
    reps: [],
    skipped: [],
    completedNames: [],
  };
}
export function pushupSupported(item: WorkoutPlanItem | undefined) {
  return (
    !!item &&
    item.exercise.slug.toLowerCase().replace(/[-\s]/g, "_") === "push_up" &&
    Number.isInteger(item.sets) &&
    item.sets > 0 &&
    Number.isInteger(item.targetReps) &&
    item.targetReps! > 0 &&
    !item.targetDurationSeconds
  );
}
export type WorkoutAction =
  | { type: "start" }
  | { type: "rep"; valid: boolean; minAngle: number; probability: number; timeSeconds: number }
  | { type: "unassessed" }
  | { type: "active-time"; seconds: number }
  | { type: "tick"; seconds: number }
  | { type: "saved" }
  | { type: "skip" };
export function reduceWorkout(
  state: WorkoutState,
  action: WorkoutAction,
  items: WorkoutPlanItem[],
): WorkoutState {
  const item = items[state.index];
  if (!item || state.phase === "finished") return state;
  switch (action.type) {
    case "start":
      return state.phase === "setup" && pushupSupported(item) ? { ...state, phase: "work" } : state;
    case "active-time":
      return state.phase === "work"
        ? {
            ...state,
            stats: {
              ...state.stats,
              activeSeconds: state.stats.activeSeconds + Math.max(0, action.seconds),
            },
          }
        : state;
    case "unassessed":
      return state.phase === "work"
        ? { ...state, stats: { ...state.stats, unassessed: state.stats.unassessed + 1 } }
        : state;
    case "rep": {
      if (state.phase !== "work") return state;
      const setValid = state.setValid + Number(action.valid);
      const stats = {
        ...state.stats,
        valid: state.stats.valid + Number(action.valid),
        invalid: state.stats.invalid + Number(!action.valid),
      };
      const done = setValid >= item.targetReps!;
      return {
        ...state,
        stats,
        setValid,
        reps: [
          ...state.reps,
          {
            ...action,
            timeSeconds: action.timeSeconds,
            set: state.set,
            attempt: stats.valid + stats.invalid,
            exercise: item.exercise.name,
          },
        ],
        phase: done ? (state.set < item.sets ? "set-rest" : "exercise-done") : "work",
        remaining: done && state.set < item.sets ? 15 : 0,
      };
    }
    case "tick": {
      if (state.phase !== "set-rest" && state.phase !== "exercise-rest") return state;
      const remaining = Math.max(0, state.remaining - Math.max(0, action.seconds));
      if (remaining > 0) return { ...state, remaining };
      return state.phase === "set-rest"
        ? { ...state, remaining: 0, set: state.set + 1, setValid: 0, phase: "work" }
        : {
            ...state,
            remaining: 0,
            index: state.index + 1,
            set: 1,
            setValid: 0,
            stats: emptyStats(),
            phase: "setup",
          };
    }
    case "saved": {
      if (state.phase !== "exercise-done") return state;
      const completed = {
        valid: state.completed.valid + state.stats.valid,
        invalid: state.completed.invalid + state.stats.invalid,
        unassessed: state.completed.unassessed + state.stats.unassessed,
        activeSeconds: state.completed.activeSeconds + state.stats.activeSeconds,
      };
      return {
        ...state,
        completed,
        completedNames: [...state.completedNames, item.exercise.name],
        phase: state.index === items.length - 1 ? "finished" : "exercise-rest",
        remaining: state.index === items.length - 1 ? 0 : 30,
      };
    }
    case "skip": {
      if (state.phase !== "setup" || pushupSupported(item)) return state;
      return {
        ...state,
        skipped: [...state.skipped, item.exercise.name],
        phase: state.index === items.length - 1 ? "finished" : "setup",
        index: state.index === items.length - 1 ? state.index : state.index + 1,
        set: 1,
        setValid: 0,
        stats: emptyStats(),
      };
    }
  }
}
