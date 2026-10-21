import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, Camera, Target, Minus, Plus } from "lucide-react";
import { exercises, details } from "@/lib/workouts";

export const Route = createFileRoute("/latihan/$id")({
  loader: ({ params }) => {
    const ex = exercises.find((e) => e.id === params.id);
    const d = details[params.id];
    if (!ex || !d) throw notFound();
    return { ex, d };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.ex.name} — Worky` : "Gerakan — Worky" },
      { name: "description", content: "Panduan gerakan, posisi kamera, dan poin pengecekan form." },
      { property: "og:title", content: loaderData ? `${loaderData.ex.name} — Worky` : "Gerakan — Worky" },
      { property: "og:description", content: "Panduan gerakan dan pengecekan form AI." },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { ex, d } = Route.useLoaderData();
  return (
    <div className="pb-28">
      <div className="relative bg-cream px-5 pb-6 pt-5">
        <Link to="/latihan" aria-label="Kembali" className="grid h-10 w-10 place-items-center rounded-full bg-background text-foreground">
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
            <p className="text-sm font-semibold">{ex.score}%</p>
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
          {[["Set", "3"], ["Repetisi", "12"], ["Istirahat", "45 dtk"]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-2xl bg-card px-4 py-3">
              <span className="text-sm">{k}</span>
              <div className="flex items-center gap-3">
                <Minus className="h-4 w-4 text-muted-foreground" />
                <span className="w-14 text-center text-sm font-bold">{v}</span>
                <Plus className="h-4 w-4 text-primary" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 bg-background/95 p-5 backdrop-blur">
        <Link to="/sesi" className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-semibold text-primary-foreground">
          <Camera className="h-5 w-5" /> Mulai dengan kamera
        </Link>
      </div>
    </div>
  );
}
