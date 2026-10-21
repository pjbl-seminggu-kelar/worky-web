import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Atur Tujuan — Worky" },
      { name: "description", content: "Tentukan tujuan, level, dan peralatan untuk workout plan personal." },
      { property: "og:title", content: "Atur Tujuan — Worky" },
      { property: "og:description", content: "Buat workout plan personal di Worky." },
    ],
  }),
  component: Onboarding,
});

const steps = [
  { q: "Apa tujuan latihanmu?", opts: ["Menurunkan berat badan", "Membentuk tubuh", "Menambah kekuatan", "Tetap bugar"] },
  { q: "Seberapa berpengalaman kamu?", opts: ["Pemula", "Menengah", "Lanjutan"] },
  { q: "Peralatan yang kamu punya?", opts: ["Tanpa alat", "Matras", "Pull-up bar", "Kursi / bangku"] },
  { q: "Berapa kali seminggu?", opts: ["2 sesi", "3 sesi", "4 sesi", "5+ sesi"] },
];

function Onboarding() {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<Record<number, string>>({});
  const s = steps[step]!;
  const last = step === steps.length - 1;
  return (
    <div className="flex min-h-screen flex-col px-5 pb-8 pt-5">
      <div className="flex items-center gap-3">
        {step > 0 ? (
          <button aria-label="Kembali" onClick={() => setStep(step - 1)} className="grid h-10 w-10 place-items-center rounded-full bg-card"><ChevronLeft className="h-5 w-5" /></button>
        ) : (
          <Link to="/" aria-label="Kembali" className="grid h-10 w-10 place-items-center rounded-full bg-card"><ChevronLeft className="h-5 w-5" /></Link>
        )}
        <div className="flex flex-1 gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>
      <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-primary">Langkah {step + 1} dari {steps.length}</p>
      <h1 className="mt-2 text-3xl font-extrabold">{s.q}</h1>
      <div className="mt-6 space-y-2.5">
        {s.opts.map((o) => {
          const active = picked[step] === o;
          return (
            <button
              key={o}
              onClick={() => setPicked({ ...picked, [step]: o })}
              className={`w-full rounded-2xl border p-4 text-left text-sm font-semibold transition-colors ${active ? "border-primary bg-primary/15 text-foreground" : "border-border bg-card text-muted-foreground"}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      <div className="mt-auto pt-8">
        {last ? (
          <Link to="/plan" className="block rounded-full bg-primary py-4 text-center font-semibold text-primary-foreground">Buat plan saya</Link>
        ) : (
          <button onClick={() => setStep(step + 1)} className="w-full rounded-full bg-primary py-4 font-semibold text-primary-foreground">Lanjut</button>
        )}
      </div>
    </div>
  );
}
