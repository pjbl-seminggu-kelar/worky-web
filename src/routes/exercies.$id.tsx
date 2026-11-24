import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Camera, Target, Minus, Plus } from "lucide-react";
import { exercises, details, getExerciseImage } from "@/lib/workouts";
import { apiFetch } from "@/lib/api";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
import { findLatestExerciseFormScore, type ExerciseSessionSummary } from "@/lib/exercises";

export type ExerciseDetailData = {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  category: string;
  description: string;
  instructions: string[];
  equipmentRequired: string[];
  cameraGuidance: {
    distance: string;
    position: string;
  };
  supportedErrors: string[];
  defaultSets: number;
  defaultTargetReps: number | null;
  defaultTargetDurationSeconds: number | null;
  defaultRestSeconds: number;
  cvStatus: string;
  modelVersion?: string;
  isActive?: boolean;
};

export type ExerciseDetailResponse = {
  status: "success";
  data: ExerciseDetailData;
};

export const Route = createFileRoute("/exercies/$id")({
  loader: async ({ params }) => {
    const rawId = params.id.toLowerCase();
    const slug = rawId.replace(/-/g, "_");

    try {
      const response = await apiFetch<ExerciseDetailResponse>(`/exercises/${slug}`);
      const data = response.data;
      if (!data) throw notFound();

      const isDuration =
        data.defaultTargetDurationSeconds !== null &&
        data.defaultTargetDurationSeconds !== undefined;

      return {
        ex: {
          slug: data.slug,
          name: data.name,
          img: data.imageUrl || getExerciseImage(data.slug),
        },
        d: {
          muscles: data.description,
          camera: data.cameraGuidance
            ? `${data.cameraGuidance.position}, ${data.cameraGuidance.distance}`
            : "Samping, 2–3 m",
          steps: data.instructions || [],
          checks: data.supportedErrors || [],
        },
        isDuration,
        defaults: {
          sets: data.defaultSets ?? 3,
          targetReps: data.defaultTargetReps ?? 12,
          targetDurationSeconds: data.defaultTargetDurationSeconds ?? 45,
          restSeconds: data.defaultRestSeconds ?? 45,
        },
      };
    } catch {
      // Fallback to static mock if offline or API error
      const dashId = rawId.replace(/_/g, "-");
      const ex = exercises.find((e) => e.id === rawId || e.id === dashId || e.slug === slug);
      const d = details[rawId] || details[dashId] || details[slug];
      if (!ex || !d) throw notFound();

      return {
        ex: {
          slug: ex.slug,
          name: ex.name,
          img: ex.img || getExerciseImage(ex.slug),
        },
        d,
        isDuration: ex.slug === "plank",
        defaults: {
          sets: 3,
          targetReps: 12,
          targetDurationSeconds: 45,
          restSeconds: 45,
        },
      };
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.ex.name} | Worky` : "Gerakan | Worky" },
      { name: "description", content: "Panduan gerakan, posisi kamera, dan poin pengecekan form." },
      { property: "og:title", content: loaderData ? `${loaderData.ex.name} | Worky` : "Gerakan | Worky" },
      { property: "og:description", content: "Panduan gerakan dan pengecekan form AI." },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { ex, d, isDuration, defaults } = Route.useLoaderData();
  const [sets, setSets] = useState(defaults.sets);
  const [targetValue, setTargetValue] = useState(
    isDuration ? defaults.targetDurationSeconds : defaults.targetReps,
  );
  const [restSeconds, setRestSeconds] = useState(defaults.restSeconds);
  const [lastScore, setLastScore] = useState("—");

  useEffect(() => {
    setSets(defaults.sets);
    setTargetValue(isDuration ? defaults.targetDurationSeconds : defaults.targetReps);
    setRestSeconds(defaults.restSeconds);
  }, [
    ex.slug,
    isDuration,
    defaults.sets,
    defaults.targetReps,
    defaults.targetDurationSeconds,
    defaults.restSeconds,
  ]);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      setLastScore("—");
      return;
    }

    apiFetch<{ status: string; data: ExerciseSessionSummary[] }>("/sessions/history", { token })
      .then((res) => {
        if (!cancelled) {
          setLastScore(findLatestExerciseFormScore(res?.data ?? [], ex.slug));
        }
      })
      .catch(() => {
        if (!cancelled) setLastScore("—");
      });

    return () => {
      cancelled = true;
    };
  }, [ex.slug]);

  const sessionControls = [
    {
      label: "Set",
      value: sets,
      display: String(sets),
      min: 1,
      max: 10,
      step: 1,
      onChange: setSets,
    },
    isDuration
      ? {
          label: "Durasi",
          value: targetValue,
          display: `${targetValue} dtk`,
          min: 5,
          max: 300,
          step: 5,
          onChange: setTargetValue,
        }
      : {
          label: "Repetisi",
          value: targetValue,
          display: String(targetValue),
          min: 1,
          max: 100,
          step: 1,
          onChange: setTargetValue,
        },
    {
      label: "Istirahat",
      value: restSeconds,
      display: `${restSeconds} dtk`,
      min: 15,
      max: 180,
      step: 5,
      onChange: setRestSeconds,
    },
  ];

  return (
    <div className="pb-28">
      <div className="relative bg-cream px-5 pb-6 pt-5">
        <Link to="/exercies" aria-label="Kembali" className="grid h-10 w-10 place-items-center rounded-full bg-background text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <img src={ex.img} alt={ex.name} width={816} height={816} className="mx-auto h-56 w-56 object-contain" />
      </div>
      <div className="px-5 pt-5">
        <h1 className="text-3xl font-extrabold">{ex.name}</h1>
        <p className="text-sm text-muted-foreground">{d.muscles}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-3">
            <Camera className="h-4 w-4 text-primary" />
            <p className="mt-2 text-[11px] text-muted-foreground">Posisi kamera</p>
            <p className="text-sm font-semibold">{d.camera}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3">
            <Target className="h-4 w-4 text-secondary" />
            <p className="mt-2 text-[11px] text-muted-foreground">Skor form terakhir</p>
            <p className="text-sm font-semibold tabular-nums">{lastScore}</p>
          </div>
        </div>

        <h2 className="mt-6 text-lg font-bold">Cara melakukan</h2>
        <ol className="mt-2 space-y-2">
          {d.steps.map((s, i) => (
            <li key={s} className="flex gap-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>

        <h2 className="mt-6 text-lg font-bold">Yang dicek AI</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {d.checks.map((c) => (
            <span key={c} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{c}</span>
          ))}
        </div>

        <h2 className="mt-6 text-lg font-bold">Atur sesi</h2>
        <div className="mt-2 space-y-2">
          {sessionControls.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-2xl bg-card px-4 py-3">
              <span className="text-sm">{row.label}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Kurangi ${row.label}`}
                  disabled={row.value <= row.min}
                  onClick={() => row.onChange(Math.max(row.min, row.value - row.step))}
                  className="grid h-8 w-8 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-muted disabled:opacity-35"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-16 text-center text-sm font-bold tabular-nums">{row.display}</span>
                <button
                  type="button"
                  aria-label={`Tambah ${row.label}`}
                  disabled={row.value >= row.max}
                  onClick={() => row.onChange(Math.min(row.max, row.value + row.step))}
                  className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary transition-colors hover:bg-primary/25 disabled:opacity-35"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 bg-background/95 p-5 backdrop-blur">
        <Link
          to="/sesi"
          search={{
            exerciseSlug: ex.slug,
            sets,
            ...(isDuration
              ? { targetDurationSeconds: targetValue }
              : { targetReps: targetValue }),
            restSeconds,
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground"
        >
          <Camera className="h-5 w-5" /> Mulai dengan kamera
        </Link>
      </div>
    </div>
  );
}
