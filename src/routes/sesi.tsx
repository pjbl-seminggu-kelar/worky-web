import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CameraOff, ChevronRight, X } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
import {
  ACTIVE_PLAN_KEY,
  ACTIVE_WORKOUT_DAY_KEY,
  WORKOUT_RESULT_KEY,
  details,
  formatSetsShort,
  getWorkoutDay,
  shouldRunSessionTimer,
  type WorkoutPlan,
  type WorkoutPlanItem,
  type WorkoutResult,
} from "@/lib/workouts";

export const Route = createFileRoute("/sesi")({
  head: () => ({
    meta: [
      { title: "Sesi Latihan | Worky" },
      {
        name: "description",
        content: "Sesi latihan dengan penghitung repetisi dan feedback form dari AI.",
      },
      { property: "og:title", content: "Sesi Latihan | Worky" },
      { property: "og:description", content: "Penghitung repetisi dan feedback form realtime." },
    ],
  }),
  component: Session,
});

const WORK_SECONDS = 10;
const REST_SECONDS = 10;

type StartSessionResponse = {
  status: "success";
  data: { id: string };
};

type StartSessionPayload = {
  exerciseId: string;
  planId: string;
  sessionName: string;
  modelVersion: string;
};

type CompleteSessionPayload = {
  activeDurationSeconds: number;
  totalAttempts: number;
  totalReps: number;
  validReps: number;
  invalidReps: number;
  unassessedAttempts: number;
  validHoldSeconds: number;
};

function Session() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [planName, setPlanName] = useState("");
  const [items, setItems] = useState<WorkoutPlanItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<"work" | "rest">("work");
  const [remaining, setRemaining] = useState(WORK_SECONDS);
  const [completedValid, setCompletedValid] = useState(0);
  const [completedInvalid, setCompletedInvalid] = useState(0);
  const [cameraError, setCameraError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [startNonce, setStartNonce] = useState(0);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    try {
      const rawPlan = localStorage.getItem(ACTIVE_PLAN_KEY);
      const requestedDay = Number(localStorage.getItem(ACTIVE_WORKOUT_DAY_KEY));
      const plan = rawPlan ? (JSON.parse(rawPlan) as WorkoutPlan) : null;
      const workoutDay = plan ? getWorkoutDay(plan, requestedDay || undefined) : null;

      if (plan && workoutDay) {
        setPlanName(plan.name);
        setItems(workoutDay.planItems);
      }
    } catch {
      // Invalid local data is handled by the empty state below.
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady || items.length === 0) return;

    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Kamera tidak tersedia di perangkat ini.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (!cancelled) setCameraError("Izinkan akses kamera agar form latihan dapat terlihat.");
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isReady, items.length, stopCamera]);

  useEffect(() => {
    if (!isReady || items.length === 0 || phase !== "work") return;

    let cancelled = false;
    const item = items[currentIndex]!;

    async function startSession() {
      setSessionId("");
      setSessionError("");
      setSaveError("");
      setIsStarting(true);

      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const response = await apiFetch<StartSessionResponse, StartSessionPayload>(
          "/sessions/start",
          {
            method: "POST",
            token,
            body: {
              exerciseId: item.exerciseId,
              planId: item.planId,
              sessionName: planName,
              modelVersion: "v1.0.0",
            },
          },
        );

        if (!cancelled) setSessionId(response.data.id);
      } catch (error) {
        if (!cancelled) {
          setSessionError(
            error instanceof ApiError
              ? error.message
              : "Sesi belum dapat dimulai. Periksa koneksi lalu coba lagi.",
          );
        }
      } finally {
        if (!cancelled) setIsStarting(false);
      }
    }

    void startSession();

    return () => {
      cancelled = true;
    };
  }, [currentIndex, isReady, items, phase, planName, startNonce]);

  useEffect(() => {
    const shouldRun = shouldRunSessionTimer({
      phase,
      isReady,
      hasItems: items.length > 0,
      remaining,
      isStarting,
      hasSessionId: Boolean(sessionId),
      hasSessionError: Boolean(sessionError),
    });

    if (!shouldRun) return;

    const timer = window.setInterval(() => {
      setRemaining((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isReady, isStarting, items.length, phase, remaining, sessionError, sessionId]);

  useEffect(() => {
    if (phase !== "rest" || remaining !== 0) return;

    setCurrentIndex((index) => index + 1);
    setPhase("work");
    setRemaining(WORK_SECONDS);
  }, [phase, remaining]);

  if (!isReady) {
    return (
      <div className="grid min-h-dvh place-items-center bg-black text-white">Menyiapkan sesi…</div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Workout belum tersedia</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pilih atau buat workout plan sebelum memulai sesi.
          </p>
          <Link
            to="/plan"
            className="mt-5 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Buka plan
          </Link>
        </div>
      </div>
    );
  }

  const current = items[currentIndex]!;
  const elapsed = WORK_SECONDS - remaining;
  const invalidReps = Math.floor(elapsed / 5);
  const validReps = Math.max(0, elapsed - invalidReps);
  const correction = details[current.exercise.slug]?.checks[0] ?? "Jaga posisi tubuh tetap stabil";
  const progress =
    ((currentIndex + (phase === "rest" ? 1 : elapsed / WORK_SECONDS)) / items.length) * 100;

  async function handleNext() {
    if (remaining > 0 || isSaving || !sessionId) return;

    const totalValid = completedValid + validReps;
    const totalInvalid = completedInvalid + invalidReps;
    const totalReps = validReps + invalidReps;
    const isFinalWorkout = currentIndex === items.length - 1;

    setSaveError("");
    setIsSaving(true);
    if (isFinalWorkout) stopCamera();

    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const body: CompleteSessionPayload = {
        activeDurationSeconds: WORK_SECONDS,
        totalAttempts: totalReps,
        totalReps,
        validReps,
        invalidReps,
        unassessedAttempts: 0,
        validHoldSeconds: 0,
      };

      await apiFetch(`/sessions/${sessionId}/complete`, {
        method: "POST",
        token,
        body,
      });

      if (isFinalWorkout) {
        const attempts = totalValid + totalInvalid;
        const result: WorkoutResult = {
          planName,
          exerciseNames: items.map((item) => item.exercise.name),
          totalExercises: items.length,
          durationSeconds: items.length * WORK_SECONDS + (items.length - 1) * REST_SECONDS,
          validReps: totalValid,
          invalidReps: totalInvalid,
          formRate: attempts > 0 ? Math.round((totalValid / attempts) * 100) : 0,
        };

        sessionStorage.setItem(WORKOUT_RESULT_KEY, JSON.stringify(result));
        void navigate({ to: "/hasil", replace: true });
        return;
      }

      setCompletedValid(totalValid);
      setCompletedInvalid(totalInvalid);
      setSessionId("");
      setPhase("rest");
      setRemaining(REST_SECONDS);
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : "Hasil sesi belum tersimpan. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const cameraLayer = (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        aria-label="Pratinjau kamera latihan"
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />
      {cameraError && (
        <div className="absolute inset-0 grid place-items-center bg-zinc-950 px-8 text-center">
          <div className="max-w-xs">
            <CameraOff className="mx-auto h-9 w-9 text-white/55" />
            <p className="mt-3 text-sm text-white/70">{cameraError}</p>
          </div>
        </div>
      )}
    </>
  );

  if (phase === "rest") {
    return (
      <div className="relative grid min-h-dvh overflow-hidden bg-black text-white">
        {cameraLayer}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
        <Link
          to="/plan"
          aria-label="Akhiri sesi"
          className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/45 backdrop-blur"
        >
          <X className="h-5 w-5" />
        </Link>
        <div className="relative z-10 grid place-items-center text-center">
          <div>
            <p className="text-sm font-semibold text-white/65">Istirahat</p>
            <p className="mt-2 font-display text-8xl font-extrabold tabular-nums">{remaining}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-black px-5 pb-6 pt-5 text-white">
      {cameraLayer}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/90" />

      <header className="relative z-10">
        <div className="h-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white/65">{planName}</p>
            <p className="text-sm font-bold">
              Workout {currentIndex + 1} dari {items.length}
            </p>
          </div>
          <Link
            to="/plan"
            aria-label="Akhiri sesi"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/40 backdrop-blur"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mt-auto">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0 pb-2">
            <h1 className="truncate text-3xl font-extrabold">{current.exercise.name}</h1>
            <p className="mt-1 text-sm text-white/70">{formatSetsShort(current)}</p>
          </div>
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full border border-white/25 bg-black/35 backdrop-blur-md">
            <span className="font-display text-5xl font-extrabold tabular-nums">{remaining}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/15 bg-black/40 p-3 backdrop-blur-md">
            <p className="font-display text-3xl font-bold text-secondary">{validReps}</p>
            <p className="text-xs text-white/65">Rep valid</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-black/40 p-3 backdrop-blur-md">
            <p className="font-display text-3xl font-bold text-primary">{invalidReps}</p>
            <p className="text-xs text-white/65">Perlu koreksi</p>
          </div>
        </div>

        {sessionError ? (
          <div className="mt-2 rounded-2xl border border-destructive/50 bg-black/60 p-3 backdrop-blur-md">
            <p role="alert" className="text-sm text-destructive-foreground">
              {sessionError}
            </p>
            <button
              type="button"
              onClick={() => setStartNonce((value) => value + 1)}
              className="mt-2 text-sm font-semibold text-primary"
            >
              Coba mulai lagi
            </button>
          </div>
        ) : (
          <div className="mt-2 flex items-start gap-3 rounded-2xl border border-primary/35 bg-black/50 p-3 backdrop-blur-md">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm">
              <span className="font-semibold">{correction}.</span> Pertahankan gerakan tetap
              terkontrol.
            </p>
          </div>
        )}

        {saveError && (
          <p role="alert" className="mt-2 rounded-xl bg-destructive/90 px-3 py-2 text-sm">
            {saveError}
          </p>
        )}

        <button
          type="button"
          disabled={remaining > 0 || isSaving || isStarting || !sessionId}
          onClick={() => void handleNext()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isStarting
            ? "Menyiapkan sesi…"
            : isSaving
              ? "Menyimpan sesi…"
              : saveError
                ? "Coba simpan lagi"
                : remaining > 0
                  ? `Lanjut dalam ${remaining} detik`
                  : currentIndex === items.length - 1
                    ? "Lihat hasil"
                    : "Workout berikutnya"}
          <ChevronRight className="h-4 w-4" />
        </button>
      </main>
    </div>
  );
}
