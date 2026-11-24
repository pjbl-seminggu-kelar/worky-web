import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Lightbulb, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
import {
  WORKOUT_RESULT_KEY,
  mapSessionDetailToWorkoutResult,
  type SessionDetail,
  type WorkoutResult,
} from "@/lib/workouts";

type HasilSearch = {
  sessionId?: string;
};

export const Route = createFileRoute("/hasil")({
  validateSearch: (search: Record<string, unknown>): HasilSearch => {
    const sessionId =
      typeof search["sessionId"] === "string" && search["sessionId"].trim()
        ? search["sessionId"].trim()
        : undefined;
    return sessionId ? { sessionId } : {};
  },
  head: () => ({
    meta: [
      { title: "Laporan Sesi | Worky" },
      {
        name: "description",
        content: "Laporan analisis form: rep valid, kesalahan bertimestamp, dan saran perbaikan.",
      },
      { property: "og:title", content: "Laporan Sesi | Worky" },
      { property: "og:description", content: "Analisis form setelah latihan." },
    ],
  }),
  component: Report,
});

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function readCachedWorkoutResult(): WorkoutResult | null {
  try {
    const raw = sessionStorage.getItem(WORKOUT_RESULT_KEY);
    return raw ? (JSON.parse(raw) as WorkoutResult) : null;
  } catch {
    return null;
  }
}

function Report() {
  const { sessionId } = Route.useSearch();
  const [result, setResult] = useState<WorkoutResult | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(sessionId));

  useEffect(() => {
    let cancelled = false;

    async function loadReport() {
      if (!sessionId) {
        if (!cancelled) {
          setResult(readCachedWorkoutResult());
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const res = await apiFetch<{ status?: string; data?: SessionDetail } | SessionDetail>(
          `/sessions/${sessionId}`,
          { token: localStorage.getItem(AUTH_TOKEN_KEY) },
        );
        if (cancelled) return;
        const sessionData = "data" in res && res.data ? res.data : (res as SessionDetail);
        if (sessionData && sessionData.id) {
          setResult(mapSessionDetailToWorkoutResult(sessionData));
        } else {
          setResult(readCachedWorkoutResult());
        }
      } catch {
        if (!cancelled) {
          setResult(readCachedWorkoutResult());
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="pb-10">
        <div className="flex items-center justify-between px-5 pt-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Memuat laporan
          </span>
          <Link
            to="/home"
            aria-label="Tutup"
            className="grid h-10 w-10 place-items-center rounded-full bg-card"
          >
            <X className="h-5 w-5" />
          </Link>
        </div>
        <div className="animate-pulse px-5 pt-3" role="status" aria-label="Memuat laporan sesi">
          <span className="sr-only">Memuat laporan sesi...</span>
          <div className="h-9 w-2/3 rounded-lg bg-muted" />
          <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
          <div className="mt-5 h-28 rounded-2xl bg-muted" />
          <div className="mt-6 h-5 w-40 rounded bg-muted" />
          <div className="mt-2 space-y-2">
            <div className="h-16 rounded-2xl bg-muted" />
            <div className="h-16 rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const validReps = result?.validReps ?? 0;
  const invalidReps = result?.invalidReps ?? 0;
  const totalReps = validReps + invalidReps;
  const formRate = result?.formRate ?? 0;
  const duration = formatDuration(result?.durationSeconds ?? 0);
  const sessionLabel = result
    ? `${result.totalExercises} workout · ${duration}`
    : "Belum ada hasil sesi. Mulai latihan dari plan.";
  const events = result?.events ?? [];

  return (
    <div className="pb-10">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sesi selesai
        </span>
        <Link
          to="/home"
          aria-label="Tutup"
          className="grid h-10 w-10 place-items-center rounded-full bg-card"
        >
          <X className="h-5 w-5" />
        </Link>
      </div>
      <div className="px-5">
        <h1 className="mt-2 text-3xl font-extrabold">
          {result ? "Sesi latihan selesai" : "Belum ada hasil sesi"}
        </h1>
        <p className="text-sm text-muted-foreground">{result?.planName ?? sessionLabel}</p>
        {result && <p className="mt-1 text-xs text-muted-foreground">{sessionLabel}</p>}
      </div>

      <div className="mx-5 mt-5 flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground">
        <div>
          <p className="font-display text-5xl font-extrabold">
            {totalReps > 0 ? `${formRate}%` : "—"}
          </p>
          <p className="text-xs opacity-90">Kedalaman valid</p>
        </div>
        <div className="ml-auto text-right text-sm">
          <p>
            <span className="font-bold">{validReps}</span> rep valid
          </p>
          <p>
            <span className="font-bold">{invalidReps}</span> perlu koreksi
          </p>
          <p className="opacity-90">dari {totalReps} total</p>
        </div>
      </div>

      {!!result?.unassessedAttempts && (
        <p className="mx-5 mt-3 text-sm text-muted-foreground">
          {result.unassessedAttempts} gerakan terputus atau tidak dapat dinilai.
        </p>
      )}
      {!!result?.skippedExercises?.length && (
        <p className="mx-5 mt-3 text-sm text-muted-foreground">
          Dilewati tanpa penilaian: {result.skippedExercises.join(", ")}.
        </p>
      )}

      {result && (
        <div className="mx-5 mt-3 flex flex-wrap gap-2">
          {result.exerciseNames.map((name) => (
            <span key={name} className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold">
              {name}
            </span>
          ))}
        </div>
      )}

      <h2 className="mt-6 px-5 text-lg font-bold">Timeline kedalaman</h2>
      <div className="mx-5 mt-2 space-y-2">
        {events.length === 0 && (
          <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">
            {totalReps
              ? "Tidak ada repetisi kurang turun yang tercatat."
              : "Belum ada repetisi yang dinilai."}
          </p>
        )}
        {events.map((event) => (
          <div
            key={`${event.exercise}-${event.set}-${event.rep}-${event.timeSeconds}`}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-semibold">
              <Clock className="h-3 w-3" />
              {formatDuration(Math.floor(event.timeSeconds))}
            </span>
            <span className="flex-1 text-sm">
              {event.message}
              <span className="block text-xs text-muted-foreground">
                {event.exercise} · Set {event.set}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">Percobaan {event.rep}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-6 px-5 text-lg font-bold">Saran perbaikan</h2>
      <div className="mx-5 mt-2 space-y-2">
        <div className="flex gap-3 rounded-2xl bg-card p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm">
            {invalidReps > 0
              ? "Di set berikutnya, fokus turun lebih dalam sebelum kembali ke posisi atas."
              : "Penilaian sesi ini menggunakan kedalaman siku dari ANN."}
          </p>
        </div>
        <div className="flex gap-3 rounded-2xl bg-card p-4">
          <Lightbulb className="h-5 w-5 shrink-0 text-secondary" />
          <p className="text-sm">
            Panduan pinggul dari kamera bersifat eksperimental dan tidak masuk skor kedalaman.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 px-5">
        <Link
          to="/sesi"
          className="rounded-full border border-border py-3.5 text-center text-sm font-semibold"
        >
          Ulangi
        </Link>
        <Link
          to="/home"
          className="rounded-full bg-secondary py-3.5 text-center text-sm font-semibold text-secondary-foreground"
        >
          Selesai
        </Link>
      </div>
    </div>
  );
}
