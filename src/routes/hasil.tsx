import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Lightbulb, X } from "lucide-react";
import { WORKOUT_RESULT_KEY, exercises, type WorkoutResult } from "@/lib/workouts";

export const Route = createFileRoute("/hasil")({
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

const events = [
  { t: "00:04", rep: 4, msg: "Pinggul turun" },
  { t: "00:08", rep: 8, msg: "Gerakan terlalu cepat" },
];

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function Report() {
  const fallbackExercise = exercises[0]!;
  const [result, setResult] = useState<WorkoutResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(WORKOUT_RESULT_KEY);
      if (raw) setResult(JSON.parse(raw) as WorkoutResult);
    } catch {
      // Keep the existing preview result when stored data is invalid.
    }
  }, []);

  const validReps = result?.validReps ?? 32;
  const invalidReps = result?.invalidReps ?? 4;
  const totalReps = validReps + invalidReps;
  const formRate = result?.formRate ?? 86;
  const duration = formatDuration(result?.durationSeconds ?? 252);
  const sessionLabel = result
    ? `${result.totalExercises} workout · ${duration}`
    : `${fallbackExercise.name} · 3 set · ${duration}`;

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
        <h1 className="mt-2 text-3xl font-extrabold">Kerja bagus! 💪</h1>
        <p className="text-sm text-muted-foreground">{result?.planName ?? sessionLabel}</p>
        {result && <p className="mt-1 text-xs text-muted-foreground">{sessionLabel}</p>}
      </div>

      <div className="mx-5 mt-5 flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground">
        <div>
          <p className="font-display text-5xl font-extrabold">{formRate}%</p>
          <p className="text-xs opacity-90">Skor form</p>
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

      {result && (
        <div className="mx-5 mt-3 flex flex-wrap gap-2">
          {result.exerciseNames.map((name) => (
            <span key={name} className="rounded-full bg-card px-3 py-1.5 text-xs font-semibold">
              {name}
            </span>
          ))}
        </div>
      )}

      <h2 className="mt-6 px-5 text-lg font-bold">Timeline kesalahan</h2>
      <div className="mx-5 mt-2 space-y-2">
        {events.map((event) => (
          <div
            key={event.t}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-semibold">
              <Clock className="h-3 w-3" />
              {event.t}
            </span>
            <span className="flex-1 text-sm">{event.msg}</span>
            <span className="text-xs text-muted-foreground">Rep {event.rep}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-6 px-5 text-lg font-bold">Saran perbaikan</h2>
      <div className="mx-5 mt-2 space-y-2">
        <div className="flex gap-3 rounded-2xl bg-card p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm">
            <span className="font-semibold">Jaga postur sepanjang gerakan.</span> Pertahankan tempo
            agar setiap repetisi tetap terkontrol.
          </p>
        </div>
        <div className="flex gap-3 rounded-2xl bg-card p-4">
          <Lightbulb className="h-5 w-5 shrink-0 text-secondary" />
          <p className="text-sm">
            Kurangi kecepatan saat mulai lelah agar form tetap konsisten hingga workout terakhir.
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
