import { createFileRoute, Link } from "@tanstack/react-router";
import { X, Clock, AlertTriangle, Lightbulb } from "lucide-react";
import { exercises } from "@/lib/workouts";

export const Route = createFileRoute("/hasil")({
  head: () => ({
    meta: [
      { title: "Laporan Sesi — Worky" },
      { name: "description", content: "Laporan analisis form: rep valid, kesalahan bertimestamp, dan saran perbaikan." },
      { property: "og:title", content: "Laporan Sesi — Worky" },
      { property: "og:description", content: "Analisis form setelah latihan." },
    ],
  }),
  component: Report,
});

const events = [
  { t: "00:42", rep: 4, msg: "Pinggul turun" },
  { t: "01:18", rep: 7, msg: "Turun kurang dalam" },
  { t: "02:55", rep: 15, msg: "Pinggul turun" },
  { t: "03:40", rep: 21, msg: "Kepala menunduk" },
];

function Report() {
  const ex = exercises[0]!;
  return (
    <div className="pb-10">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sesi selesai</span>
        <Link to="/" aria-label="Tutup" className="grid h-10 w-10 place-items-center rounded-full bg-card"><X className="h-5 w-5" /></Link>
      </div>
      <div className="px-5">
        <h1 className="mt-2 text-3xl font-extrabold">Kerja bagus! 💪</h1>
        <p className="text-sm text-muted-foreground">{ex.name} · 3 set · 04:12</p>
      </div>

      <div className="mx-5 mt-5 flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground">
        <div>
          <p className="font-display text-5xl font-extrabold">86%</p>
          <p className="text-xs opacity-90">Skor form</p>
        </div>
        <div className="ml-auto text-right text-sm">
          <p><span className="font-bold">32</span> rep valid</p>
          <p><span className="font-bold">4</span> perlu koreksi</p>
          <p className="opacity-90">dari 36 total</p>
        </div>
      </div>

      <h2 className="mt-6 px-5 text-lg font-bold">Timeline kesalahan</h2>
      <div className="mx-5 mt-2 space-y-2">
        {events.map((e) => (
          <div key={e.t} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-semibold"><Clock className="h-3 w-3" />{e.t}</span>
            <span className="flex-1 text-sm">{e.msg}</span>
            <span className="text-xs text-muted-foreground">Rep {e.rep}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-6 px-5 text-lg font-bold">Saran perbaikan</h2>
      <div className="mx-5 mt-2 space-y-2">
        <div className="flex gap-3 rounded-2xl bg-card p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm"><span className="font-semibold">Pinggul turun (2×).</span> Kencangkan perut dan glutes sepanjang gerakan.</p>
        </div>
        <div className="flex gap-3 rounded-2xl bg-card p-4">
          <Lightbulb className="h-5 w-5 shrink-0 text-secondary" />
          <p className="text-sm">Coba knee push-up di set terakhir saat mulai lelah agar form tetap terjaga.</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 px-5">
        <Link to="/sesi" className="rounded-full border border-border py-3.5 text-center text-sm font-semibold">Ulangi</Link>
        <Link to="/" className="rounded-full bg-secondary py-3.5 text-center text-sm font-semibold text-secondary-foreground">Selesai</Link>
      </div>
    </div>
  );
}
