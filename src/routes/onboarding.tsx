import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ScanLine } from "lucide-react";
import { ONBOARDING_COMPLETED_KEY } from "@/lib/auth";

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

const steps = [
  {
    q: "Apa tujuan latihanmu?",
    opts: ["Menurunkan berat badan", "Membentuk tubuh", "Menambah kekuatan", "Tetap bugar"],
  },
  { q: "Seberapa berpengalaman kamu?", opts: ["Pemula", "Menengah", "Lanjutan"] },
  {
    q: "Peralatan yang kamu punya?",
    opts: ["Tanpa alat", "Matras", "Pull-up bar", "Kursi / bangku"],
    multiple: true,
  },
  { q: "Berapa kali seminggu?", opts: ["2 sesi", "3 sesi", "4 sesi", "5+ sesi"] },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Record<number, string[]>>({});
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const s = steps[step]!;
  const last = step === steps.length - 1;

  useEffect(() => {
    setIsFirstVisit(localStorage.getItem(ONBOARDING_COMPLETED_KEY) !== "true");
  }, []);

  async function finishOnboarding() {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
    await navigate({ to: isFirstVisit ? "/register" : "/plan", replace: isFirstVisit });
  }

  function selectOption(option: string) {
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

  return (
    <main className="flex h-screen h-dvh flex-col overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
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
            <ScanLine className="h-5 w-5" />
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
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>
      <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-primary">
        Langkah {step + 1} dari {steps.length}
      </p>
      <h1 className="mt-2 text-3xl font-extrabold">{s.q}</h1>
      <div className="mt-6 space-y-2.5">
        {s.opts.map((o) => {
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
      <div className="mt-auto pt-8">
        {last ? (
          <button
            onClick={finishOnboarding}
            disabled={!picked[step]?.length}
            className="w-full rounded-full bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-40"
          >
            Buat plan saya
          </button>
        ) : (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!picked[step]?.length}
            className="w-full rounded-full bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-40"
          >
            Lanjut
          </button>
        )}
        {isFirstVisit && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login" className="font-bold text-primary">
              Masuk
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
