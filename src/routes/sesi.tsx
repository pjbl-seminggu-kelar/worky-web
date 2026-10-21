import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Pause, SkipForward, X, AlertTriangle } from "lucide-react";
import { exercises } from "@/lib/workouts";

export const Route = createFileRoute("/sesi")({
  head: () => ({
    meta: [
      { title: "Sesi Latihan | Worky" },
      { name: "description", content: "Sesi latihan dengan penghitung repetisi dan feedback form dari AI." },
      { property: "og:title", content: "Sesi Latihan | Worky" },
      { property: "og:description", content: "Penghitung repetisi dan feedback form realtime." },
    ],
  }),
  component: Session,
});

function Session() {
  const ex = exercises[0]!;
  const r = 120;
  const c = 2 * Math.PI * r;
  const progress = 0.7;
  return (
    <div className="flex min-h-screen flex-col px-5 pb-8 pt-5">
      <div className="h-1 w-full rounded-full bg-muted">
        <div className="h-1 w-1/3 rounded-full bg-primary" />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <Link to="/" className="flex items-center gap-1"><ChevronLeft className="h-4 w-4" /> 2 dari 6</Link>
        <span>04:12</span>
      </div>

      <h1 className="mt-8 text-center text-2xl font-bold">{ex.name}</h1>
      <p className="text-center text-sm text-muted-foreground">Set 2 · target 12 rep</p>

      <div className="relative mx-auto mt-6 aspect-square w-full max-w-[300px]">
        <svg viewBox="0 0 260 260" className="h-full w-full -rotate-90">
          <circle cx="130" cy="130" r={r} fill="none" className="stroke-muted" strokeWidth="6" />
          <circle cx="130" cy="130" r={r} fill="none" className="stroke-primary" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} />
        </svg>
        <img src={ex.img} alt={ex.name} width={816} height={816} className="absolute inset-10 h-[calc(100%-5rem)] w-[calc(100%-5rem)] object-contain" />
      </div>

      <div className="mt-4 text-center">
        <p className="font-display text-7xl font-extrabold">9</p>
        <p className="text-sm text-muted-foreground"><span className="font-semibold text-secondary">8 valid</span> · 1 perlu koreksi</p>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-sm"><span className="font-semibold">Pinggul turun.</span> Kencangkan perut agar badan tetap lurus.</p>
      </div>

      <div className="mt-auto flex items-center justify-center gap-4 pt-8">
        <button aria-label="Jeda" className="grid h-14 w-14 place-items-center rounded-full bg-card"><Pause className="h-5 w-5" /></button>
        <button aria-label="Lewati" className="grid h-14 w-14 place-items-center rounded-full bg-card"><SkipForward className="h-5 w-5" /></button>
        <Link to="/hasil" aria-label="Akhiri" className="grid h-14 w-14 place-items-center rounded-full bg-card text-destructive"><X className="h-5 w-5" /></Link>
      </div>
    </div>
  );
}
