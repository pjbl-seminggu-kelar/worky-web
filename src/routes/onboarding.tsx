import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, ONBOARDING_COMPLETED_KEY, type AuthUser } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api";
import type { GeneratePlanResponse } from "@/lib/workouts";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Atur Tujuan — Worky" },
      {
        name: "description",
        content: "Tentukan tujuan, level, dan peralatan untuk workout plan personal.",
      },
      { property: "og:title", content: "Atur Tujuan — Worky" },
      { property: "og:description", content: "Buat workout plan personal di Worky." },
    ],
  }),
  component: Onboarding,
});

/* ── Step definitions (Total: 6) ── */

const TOTAL_STEPS = 6;

/** Steps 1–5 (index 1–5) that use option buttons */
type OptionStep = {
  q: string;
  opts: string[];
  multiple?: boolean;
};

const optionSteps: Record<number, OptionStep> = {
  1: {
    q: "Apa tujuan latihanmu?",
    opts: ["Menurunkan berat badan", "Membentuk tubuh", "Menambah kekuatan", "Tetap bugar"],
  },
  2: {
    q: "Seberapa berpengalaman kamu?",
    opts: ["Pemula", "Menengah", "Lanjutan"],
  },
  3: {
    q: "Peralatan yang kamu punya?",
    opts: ["Tanpa alat", "Matras", "Pull-up bar", "Kursi / bangku"],
    multiple: true,
  },
  4: {
    q: "Berapa kali seminggu?",
    opts: ["2 sesi", "3 sesi", "4 sesi", "5+ sesi"],
  },
  5: {
    q: "Berapa menit per sesi?",
    opts: ["15 menit", "20 menit", "30 menit", "45 menit", "60 menit"],
  },
};

/* ── Mappings to API values ── */

const GOAL_MAP: Record<string, string> = {
  "Menurunkan berat badan": "WEIGHT_LOSS",
  "Membentuk tubuh": "MUSCLE_BUILDING",
  "Menambah kekuatan": "STRENGTH",
  "Tetap bugar": "GENERAL_FITNESS",
};

const LEVEL_MAP: Record<string, string> = {
  Pemula: "BEGINNER",
  Menengah: "INTERMEDIATE",
  Lanjutan: "ADVANCED",
};

const FREQUENCY_MAP: Record<string, number> = {
  "2 sesi": 2,
  "3 sesi": 3,
  "4 sesi": 4,
  "5+ sesi": 5,
};

const DURATION_MAP: Record<string, number> = {
  "15 menit": 15,
  "20 menit": 20,
  "30 menit": 30,
  "45 menit": 45,
  "60 menit": 60,
};

/* ── Component ── */

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Step 0: form inputs (umur & berat badan)
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");

  // Steps 1–5: option selections
  const [picked, setPicked] = useState<Record<number, string[]>>({});

  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const last = step === TOTAL_STEPS - 1;

  useEffect(() => {
    // First visit = user just registered (has token) but hasn't completed onboarding yet
    setIsFirstVisit(
      localStorage.getItem(AUTH_TOKEN_KEY) !== null &&
        localStorage.getItem(ONBOARDING_COMPLETED_KEY) !== "true",
    );
  }, []);

  /** Whether the current step has valid input to proceed */
  function canProceed() {
    if (step === 0) {
      const ageNum = Number(age);
      const weightNum = Number(weight);
      return age !== "" && weight !== "" && ageNum > 0 && ageNum < 150 && weightNum > 0 && weightNum < 500;
    }
    return (picked[step]?.length ?? 0) > 0;
  }

  function selectOption(option: string) {
    const s = optionSteps[step];
    if (!s) return;

    if (!s.multiple) {
      setPicked((current) => ({ ...current, [step]: [option] }));
      return;
    }

    setPicked((current) => {
      const selected = current[step] ?? [];

      if (option === "Tanpa alat") {
        return { ...current, [step]: selected.includes(option) ? [] : [option] };
      }

      const equipment = selected.filter((item) => item !== "Tanpa alat");
      const nextSelection = equipment.includes(option)
        ? equipment.filter((item) => item !== option)
        : [...equipment, option];

      return { ...current, [step]: nextSelection };
    });
  }

  async function finishOnboarding() {
    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY) ?? "";

      // Read displayName from saved user
      let displayName = "";
      try {
        const raw = localStorage.getItem(AUTH_USER_KEY);
        if (raw) displayName = (JSON.parse(raw) as { displayName?: string }).displayName ?? "";
      } catch {
        /* ignore */
      }

      const goal = GOAL_MAP[picked[1]?.[0] ?? ""] ?? "GENERAL_FITNESS";
      const experienceLevel = LEVEL_MAP[picked[2]?.[0] ?? ""] ?? "BEGINNER";
      const equipment = (picked[3] && picked[3].length > 0) ? picked[3] : ["Tanpa alat"];
      const sessionsPerWeek = FREQUENCY_MAP[picked[4]?.[0] ?? ""] ?? 4;
      const sessionDurationMinutes = DURATION_MAP[picked[5]?.[0] ?? ""] ?? 20;

      // 1) PUT ke profile
      const userResponse = await apiFetch<{ status: string; data: AuthUser }>("/users/me", {
        method: "PUT",
        token,
        body: {
          displayName,
          age: Number(age),
          weightKg: Number(weight),
          goal,
          experienceLevel,
          sessionsPerWeek,
          sessionDurationMinutes,
          equipment,
          reminderTime: "18:30",
        },
      });

      if (userResponse?.data) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userResponse.data));
      }

      // 2) Generate workout plan dengan body kosong {}
      const planResponse = await apiFetch<GeneratePlanResponse>("/plans/generate", {
        method: "POST",
        token,
        body: {},
      });

      // Simpan plan aktif dan tandai onboarding selesai
      localStorage.setItem("worky:active-plan", JSON.stringify(planResponse.data));
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");

      await navigate({ to: "/plan", replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Gagal menyimpan profil dan membuat plan. Periksa koneksi lalu coba lagi.",
      );
      setIsSubmitting(false);
    }
  }

  /* ── Render ── */

  return (
    <main className="flex h-screen h-dvh flex-col overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      {/* Header: back button + progress bar */}
      <div className="flex items-center gap-3">
        {step > 0 ? (
          <button
            aria-label="Kembali"
            onClick={() => setStep(step - 1)}
            className="grid h-10 w-10 place-items-center rounded-full bg-card"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : isFirstVisit ? (
          <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
            <img src="icon.png" alt="icon" width={27}/>
          </div>
        ) : (
          <Link
            to="/"
            aria-label="Kembali"
            className="grid h-10 w-10 place-items-center rounded-full bg-card"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-primary">
        Langkah {step + 1} dari {TOTAL_STEPS}
      </p>

      {/* Step 0: Umur dan berat badan */}
      {step === 0 && (
        <>
          <h1 className="mt-2 text-3xl font-extrabold">Berapa umur dan berat badanmu?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Data ini digunakan untuk menyesuaikan intensitas dan rekomendasi workout plan kamu.
          </p>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Umur</span>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 focus-within:border-primary">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={150}
                  required
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Contoh: 24"
                  className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <span className="text-sm text-muted-foreground">tahun</span>
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Berat badan</span>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 focus-within:border-primary">
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={500}
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Contoh: 68"
                  className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <span className="text-sm text-muted-foreground">kg</span>
              </div>
            </label>
          </div>
        </>
      )}

      {/* Steps 1–5: Option-based */}
      {step > 0 && optionSteps[step] && (
        <>
          <h1 className="mt-2 text-3xl font-extrabold">{optionSteps[step]!.q}</h1>
          <div className="mt-6 space-y-2.5">
            {optionSteps[step]!.opts.map((o) => {
              const active = picked[step]?.includes(o) ?? false;
              return (
                <button
                  key={o}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectOption(o)}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition-colors ${active ? "border-primary bg-primary/15 text-foreground" : "border-border bg-card text-muted-foreground"}`}
                >
                  <span>{o}</span>
                  {active ? (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Footer: error + action button */}
      <div className="mt-auto pt-8">
        {error && (
          <p
            role="alert"
            className="mb-3 rounded-xl bg-destructive/15 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}
        {last ? (
          <button
            onClick={finishOnboarding}
            disabled={!canProceed() || isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-40"
          >
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {isSubmitting ? "Menyimpan & membuat plan…" : "Buat plan saya"}
          </button>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="w-full rounded-full bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-40"
          >
            Lanjut
          </button>
        )}
      </div>
    </main>
  );
}
