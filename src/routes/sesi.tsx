import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CameraOff, ChevronRight, X } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
import {
  ACTIVE_PLAN_KEY,
  ACTIVE_WORKOUT_DAY_KEY,
  WORKOUT_RESULT_KEY,
  formatSetsShort,
  getWorkoutDay,
  type WorkoutPlan,
  type WorkoutPlanItem,
  type WorkoutResult,
} from "@/lib/workouts";
import {
  abandonWorkoutSession,
  initialWorkoutState,
  pushupSupported,
  reduceWorkout,
  syncSessionRepEvents,
  type WorkoutAction,
} from "@/lib/pushup/session";
import { MODEL_VERSION } from "@/lib/pushup/model";
import { usePushupCamera } from "@/hooks/use-pushup-camera";

type SessionSearch = {
  exerciseSlug?: string;
  sets?: number;
  targetReps?: number;
  targetDurationSeconds?: number;
  restSeconds?: number;
};

function parseOptionalPositiveInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : undefined;
}

export const Route = createFileRoute("/sesi")({
  validateSearch: (search: Record<string, unknown>): SessionSearch => {
    const exerciseSlug =
      typeof search["exerciseSlug"] === "string" && search["exerciseSlug"].trim()
        ? search["exerciseSlug"].trim()
        : undefined;
    const sets = parseOptionalPositiveInt(search["sets"]);
    const targetReps = parseOptionalPositiveInt(search["targetReps"]);
    const targetDurationSeconds = parseOptionalPositiveInt(search["targetDurationSeconds"]);
    const restSeconds = parseOptionalPositiveInt(search["restSeconds"]);
    return {
      ...(exerciseSlug ? { exerciseSlug } : {}),
      ...(sets !== undefined ? { sets } : {}),
      ...(targetReps !== undefined ? { targetReps } : {}),
      ...(targetDurationSeconds !== undefined ? { targetDurationSeconds } : {}),
      ...(restSeconds !== undefined ? { restSeconds } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Sesi Latihan | Worky" },
      {
        name: "description",
        content: "Latihan push-up dengan penghitung repetisi dan panduan kedalaman.",
      },
    ],
  }),
  component: Session,
});
function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function Session() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const video = useRef<HTMLVideoElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const [planName, setPlanName] = useState("");
  const [items, setItems] = useState<WorkoutPlanItem[]>([]);
  const itemsRef = useRef<WorkoutPlanItem[]>([]);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState(initialWorkoutState);
  const stateRef = useRef(state);
  const [sessionId, setSessionId] = useState("");
  const sessionRef = useRef<{ itemId: string; id: string } | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [starting, setStarting] = useState(false);
  const startPending = useRef(false);
  const [saveNonce, setSaveNonce] = useState(0);
  const saveFlight = useRef<{ id: string; promise: Promise<unknown> } | null>(null);
  const sentEventsRef = useRef<Map<string, Set<number>>>(new Map());
  const exerciseRepOffsetRef = useRef(0);
  const lastCompletedSessionIdRef = useRef("");
  const mounted = useRef(true);
  const startedAt = useRef<number | null>(null);
  const send = useCallback((action: WorkoutAction) => {
    const next = reduceWorkout(stateRef.current, action, itemsRef.current);
    stateRef.current = next;
    setState(next);
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;

    async function loadWorkout() {
      if (search.exerciseSlug) {
        const normalizedSlug = search.exerciseSlug.toLowerCase().replace(/-/g, "_");
        type SingleExerciseDetail = {
          id: string;
          slug: string;
          name: string;
          category: string;
          equipmentRequired?: string[];
          defaultSets?: number;
          defaultTargetReps?: number | null;
          defaultTargetDurationSeconds?: number | null;
          defaultRestSeconds?: number;
        };
        let exerciseData: SingleExerciseDetail | null = null;

        try {
          const response = await apiFetch<{ status: string; data: SingleExerciseDetail | null }>(
            `/exercises/${normalizedSlug}`,
            { token: localStorage.getItem(AUTH_TOKEN_KEY) },
          );
          exerciseData = response?.data ?? null;
        } catch {
          exerciseData = null;
        }

        if (cancelled) return;
        if (exerciseData) {
          const targetDurationSeconds =
            search.targetDurationSeconds ??
            (search.targetReps ? null : (exerciseData.defaultTargetDurationSeconds ?? null));
          const targetReps =
            targetDurationSeconds !== null
              ? null
              : (search.targetReps ?? exerciseData.defaultTargetReps ?? 12);
          const item: WorkoutPlanItem = {
            id: `single-${exerciseData.slug}`,
            planId: "",
            exerciseId: exerciseData.id,
            dayOfWeek: 1,
            orderIndex: 0,
            sets: search.sets ?? exerciseData.defaultSets ?? 3,
            targetReps,
            targetDurationSeconds,
            restSeconds: search.restSeconds ?? exerciseData.defaultRestSeconds ?? 45,
            notes: null,
            exercise: {
              id: exerciseData.id,
              slug: exerciseData.slug,
              name: exerciseData.name,
              category: exerciseData.category,
              equipmentRequired: exerciseData.equipmentRequired ?? [],
            },
          };
          setPlanName(exerciseData.name);
          itemsRef.current = [item];
          setItems([item]);
        }
        setReady(true);
        return;
      }

      let plan: WorkoutPlan | null = null;
      try {
        const raw = localStorage.getItem(ACTIVE_PLAN_KEY);
        if (raw) plan = JSON.parse(raw) as WorkoutPlan;
      } catch {
        /* Invalid local data falls back to API fetch below. */
      }

      if (!plan) {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          try {
            const planRes = await apiFetch<{ status: string; data: WorkoutPlan | null }>(
              "/plans/active",
              { token },
            );
            if (planRes?.data) {
              plan = planRes.data;
              localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(plan));
            }
          } catch {
            /* Handled by the empty-plan state. */
          }
        }
      }

      if (cancelled) return;
      const day = plan
        ? getWorkoutDay(plan, Number(localStorage.getItem(ACTIVE_WORKOUT_DAY_KEY)) || undefined)
        : null;
      if (plan && day) {
        setPlanName(plan.name);
        itemsRef.current = day.planItems;
        setItems(day.planItems);
      }
      setReady(true);
    }

    void loadWorkout();

    return () => {
      cancelled = true;
    };
  }, [
    search.exerciseSlug,
    search.sets,
    search.targetReps,
    search.targetDurationSeconds,
    search.restSeconds,
  ]);

  const current = items[state.index];
  const hasWorkout = Boolean(current);
  const supported = pushupSupported(current);
  const camera = usePushupCamera({
    enabled: ready && supported && state.phase !== "finished",
    exerciseKey: current?.id ?? "",
    video,
    canvas,
    counting: () => stateRef.current.phase === "work" && !startPending.current && !document.hidden,
    onRep: (event, prediction) =>
      send({
        type: "rep",
        ...prediction,
        minAngle: event.min_angle,
        timeSeconds: startedAt.current === null ? 0 : (Date.now() - startedAt.current) / 1000,
      }),
    onPartial: () => send({ type: "unassessed" }),
  });
  const statusRef = useRef(camera.status);
  useEffect(() => {
    statusRef.current = camera.status;
  }, [camera.status]);
  const calibrated = camera.status.calibration?.phase === "locked";
  const tracking = camera.status.phase === "ready" && calibrated && camera.status.angle !== null;
  useEffect(() => {
    if (!ready || !hasWorkout) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [ready, hasWorkout]);
  useEffect(() => {
    sessionRef.current = null;
    setSessionId("");
    setSessionError("");
    setSaveError("");
    saveFlight.current = null;
    exerciseRepOffsetRef.current = stateRef.current.reps.length;
  }, [state.index]);

  useEffect(() => {
    if (!ready || !items.length) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now(),
        seconds = (now - last) / 1000;
      last = now;
      const snapshot = stateRef.current,
        status = statusRef.current;
      if (snapshot.phase === "set-rest" || snapshot.phase === "exercise-rest")
        send({ type: "tick", seconds });
      else if (
        snapshot.phase === "work" &&
        !document.hidden &&
        status.phase === "ready" &&
        status.calibration?.phase === "locked" &&
        status.angle !== null
      )
        send({ type: "active-time", seconds });
    }, 250);
    return () => clearInterval(timer);
  }, [ready, items.length, send]);

  useEffect(() => {
    if (state.phase !== "exercise-done" || !sessionId) return;
    let cancelled = false;
    setSaveError("");
    if (saveFlight.current?.id !== sessionId) {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const { valid, invalid, unassessed, activeSeconds } = stateRef.current.stats;
      const exerciseReps = stateRef.current.reps.slice(exerciseRepOffsetRef.current);
      const promise = (async () => {
        await syncSessionRepEvents({
          sessionId,
          reps: exerciseReps,
          sentBySession: sentEventsRef.current,
          token,
        });
        return apiFetch(`/sessions/${sessionId}/complete`, {
          method: "POST",
          token,
          body: {
            activeDurationSeconds: Math.max(1, Math.round(activeSeconds)),
            totalAttempts: valid + invalid + unassessed,
            totalReps: valid + invalid,
            validReps: valid,
            invalidReps: invalid,
            unassessedAttempts: unassessed,
            validHoldSeconds: 0,
          },
        });
      })();
      saveFlight.current = { id: sessionId, promise };
    }
    void saveFlight.current.promise
      .then(() => {
        if (!cancelled) {
          lastCompletedSessionIdRef.current = sessionId;
          send({ type: "saved" });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          saveFlight.current = null;
          setSaveError(
            errorMessage(error, "Hasil belum tersimpan. Periksa koneksi lalu coba lagi."),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [state.phase, sessionId, saveNonce, send]);

  useEffect(() => {
    if (state.phase !== "finished") return;
    const { valid, invalid, unassessed } = state.completed;
    const completedSessionId = lastCompletedSessionIdRef.current || undefined;
    const result: WorkoutResult = {
      ...(completedSessionId
        ? { sessionId: completedSessionId, lastCompletedSessionId: completedSessionId }
        : {}),
      planName,
      exerciseNames: state.completedNames,
      totalExercises: state.completedNames.length,
      durationSeconds:
        startedAt.current === null ? 0 : Math.round((Date.now() - startedAt.current) / 1000),
      validReps: valid,
      invalidReps: invalid,
      unassessedAttempts: unassessed,
      formRate: valid + invalid ? Math.round((valid / (valid + invalid)) * 100) : 0,
      skippedExercises: state.skipped,
      events: state.reps
        .filter((rep) => !rep.valid)
        .map((rep) => ({
          timeSeconds: rep.timeSeconds,
          rep: rep.attempt,
          set: rep.set,
          exercise: rep.exercise,
          message: "Kurang turun",
        })),
    };
    sessionStorage.setItem(WORKOUT_RESULT_KEY, JSON.stringify(result));
    void navigate({
      to: "/hasil",
      ...(completedSessionId ? { search: { sessionId: completedSessionId } } : {}),
      replace: true,
    });
  }, [state, planName, navigate]);

  function handleAbandon() {
    const activeSessionId = sessionId || sessionRef.current?.id || "";
    void abandonWorkoutSession({
      sessionId: activeSessionId,
      phase: stateRef.current.phase,
      token: localStorage.getItem(AUTH_TOKEN_KEY),
    });
    void navigate({ to: "/plan", replace: true });
  }

  async function startSet() {
    if (!current || !tracking || startPending.current || stateRef.current.phase !== "setup") return;
    startPending.current = true;
    setStarting(true);
    setSessionError("");
    try {
      let id = sessionRef.current?.itemId === current.id ? sessionRef.current.id : "";
      if (!id) {
        const response = await apiFetch<{ data: { id: string } }>("/sessions/start", {
          method: "POST",
          token: localStorage.getItem(AUTH_TOKEN_KEY),
          body: {
            exerciseId: current.exerciseId,
            ...(current.planId ? { planId: current.planId } : {}),
            sessionName: planName,
            modelVersion: MODEL_VERSION,
          },
        });
        if (!response.data?.id) throw new Error("ID sesi tidak tersedia.");
        id = response.data.id;
        sessionRef.current = { itemId: current.id, id };
      }
      if (!mounted.current) return;
      setSessionId(id);
      startedAt.current ??= Date.now();
      camera.resetMovement();
      send({ type: "start" });
    } catch (error) {
      if (mounted.current)
        setSessionError(
          errorMessage(error, "Sesi belum dapat dimulai. Periksa koneksi lalu coba lagi."),
        );
    } finally {
      startPending.current = false;
      if (mounted.current) setStarting(false);
    }
  }

  if (!ready)
    return (
      <div className="grid min-h-dvh place-items-center bg-black text-white">Menyiapkan sesi…</div>
    );
  if (!current)
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Workout belum tersedia</h1>
          <p className="mt-2 text-muted-foreground">
            Pilih atau buat workout plan sebelum memulai sesi.
          </p>
          <Link
            to="/plan"
            className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
          >
            Buka plan
          </Link>
        </div>
      </div>
    );

  const resting = state.phase === "set-rest" || state.phase === "exercise-rest";
  const progress = Math.min(
    100,
    ((state.index +
      (state.set - 1 + state.setValid / (current.targetReps || 1)) / (current.sets || 1)) /
      items.length) *
      100,
  );
  const side = camera.status.calibration?.side;
  let feedback = camera.status.phase === "error" ? camera.status.error : camera.status.feedback;
  if (state.phase === "setup" && tracking && side) {
    feedback = `Lengan ${side === "left" ? "kiri" : "kanan"} siap. Tekan Mulai set.`;
  }
  if (
    state.phase === "work" &&
    feedback.startsWith("Pinggul") &&
    camera.status.hip.angle !== null
  ) {
    feedback = `${feedback} Sudut pinggul ${Math.round(camera.status.hip.angle)}°.`;
  }
  if (starting) feedback = "Menyiapkan sesi…";
  if (state.phase === "exercise-done") feedback = "Target tercapai. Menyimpan hasil…";
  feedback = saveError || sessionError || feedback;
  return (
    <div className="workout-session relative isolate h-dvh w-full overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <video
          ref={video}
          autoPlay
          muted
          playsInline
          aria-label="Pratinjau kamera latihan"
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        <canvas
          ref={canvas}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/65" />
      <header className="workout-header absolute inset-x-0 top-0 z-10 px-5 pt-5">
        <div
          role="progressbar"
          aria-label="Progres sesi"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="h-1 overflow-hidden rounded-full bg-white/20"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white/65">{planName}</p>
            <p className="text-sm font-bold">
              Workout {state.index + 1} dari {items.length}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAbandon}
            aria-label="Akhiri sesi"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/40 backdrop-blur"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>
      {resting ? (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/75 px-5 text-center backdrop-blur-sm">
          <div>
            <p className="text-sm font-semibold text-white/65">
              {state.phase === "set-rest"
                ? `Istirahat · set ${state.set} selesai`
                : "Istirahat antarlatihan"}
            </p>
            <p role="timer" className="mt-2 font-display text-8xl font-extrabold tabular-nums">
              {Math.ceil(state.remaining)}
            </p>
            <p className="mt-3 text-sm text-white/75">
              {state.phase === "set-rest"
                ? `Set ${state.set + 1} dimulai setelah istirahat. Bersiap di posisi atas.`
                : `Berikutnya: ${items[state.index + 1]?.exercise.name ?? ""}`}
            </p>
            <button
              type="button"
              onClick={handleAbandon}
              className="mt-6 inline-block rounded-full border border-white/30 px-6 py-3 text-sm"
            >
              Akhiri sesi
            </button>
          </div>
        </div>
      ) : null}
      <main
        className="workout-overlay absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[430px] px-5 pb-6"
        hidden={resting}
      >
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 pb-2">
            <h1 className="workout-title truncate text-3xl font-extrabold">
              {current.exercise.name}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {formatSetsShort(current)}
              {supported ? ` · Set ${state.set} dari ${current.sets}` : ""}
            </p>
          </div>
          <div className="workout-target grid h-24 w-24 shrink-0 place-items-center rounded-full border border-white/25 bg-black/35 backdrop-blur-md">
            <div className="text-center">
              <span className="font-display text-5xl font-extrabold tabular-nums">
                {supported ? state.setValid : "—"}
              </span>
              {supported && <p className="text-xs text-white/65">/ {current.targetReps} valid</p>}
            </div>
          </div>
        </div>
        {!supported ? (
          <div role="status" className="mt-4 rounded-2xl border border-white/20 bg-black/70 p-4">
            <CameraOff className="mb-2 h-6 w-6 text-white/60" />
            <p className="font-semibold">Model untuk latihan ini belum tersedia.</p>
            <p className="mt-1 text-sm text-white/70">
              Latihan ini bisa dilewati dan tidak masuk penilaian.
            </p>
            <button
              type="button"
              onClick={() => send({ type: "skip" })}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
            >
              {state.index === items.length - 1 ? "Lihat hasil" : "Lanjut ke latihan berikutnya"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="workout-stats mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/15 bg-black/40 p-3 backdrop-blur-md">
                <p className="font-display text-3xl font-bold text-secondary">
                  {state.stats.valid}
                </p>
                <p className="text-xs text-white/65">Rep valid · semua set</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-black/40 p-3 backdrop-blur-md">
                <p className="font-display text-3xl font-bold text-primary">
                  {state.stats.invalid}
                </p>
                <p className="text-xs text-white/65">Perlu koreksi</p>
              </div>
            </div>
            <div className="workout-status mt-2 flex items-start gap-3 rounded-2xl border border-primary/35 bg-black/60 p-3 backdrop-blur-md">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p
                  role={
                    saveError || sessionError || camera.status.phase === "error"
                      ? "alert"
                      : "status"
                  }
                  className="text-sm"
                >
                  {feedback}
                </p>
                {camera.status.calibration?.phase === "calibrating" && (
                  <progress
                    aria-label="Progres kalibrasi tangan"
                    className="mt-2 h-1 w-full"
                    max={1000}
                    value={Math.min(1000, camera.status.calibration.elapsed)}
                  />
                )}
              </div>
            </div>
            {camera.status.phase === "error" && (
              <button
                type="button"
                onClick={camera.retry}
                className="mt-2 rounded-full border border-white/30 px-5 py-2 text-sm"
              >
                Coba kamera lagi
              </button>
            )}
            <div className="workout-controls mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={camera.skeleton}
                onClick={camera.toggleSkeleton}
                className="rounded-full border border-white/25 bg-black/50 px-3 py-2.5 text-xs font-semibold"
              >
                {camera.skeleton ? "Sembunyikan skeleton" : "Tampilkan skeleton"}
              </button>
              <button
                type="button"
                disabled={
                  camera.status.phase !== "ready" || starting || state.phase === "exercise-done"
                }
                onClick={camera.calibrate}
                className="rounded-full border border-white/25 bg-black/50 px-3 py-2.5 text-xs font-semibold disabled:opacity-45"
              >
                {calibrated ? "Kalibrasi ulang" : "Kalibrasi tangan"}
              </button>
            </div>
            {state.phase === "setup" && (
              <button
                type="button"
                disabled={!tracking || starting}
                onClick={() => void startSet()}
                className="workout-start mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-45"
              >
                {starting ? "Menyiapkan sesi…" : sessionError ? "Coba mulai lagi" : "Mulai set"}
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {state.phase === "exercise-done" && saveError && (
              <button
                type="button"
                onClick={() => setSaveNonce((value) => value + 1)}
                className="mt-2 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
              >
                Coba simpan lagi
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
