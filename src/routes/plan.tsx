import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles } from "lucide-react";
import { plan } from "@/lib/workouts";
import { BottomNav, PageHeader } from "@/components/BottomNav";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Workout Plan — Worky" },
      { name: "description", content: "Jadwal latihan mingguan yang disusun sesuai tujuan dan kemampuanmu." },
      { property: "og:title", content: "Workout Plan — Worky" },
      { property: "og:description", content: "Jadwal latihan mingguan sesuai tujuanmu." },
    ],
  }),
  component: Plan,
});

function Plan() {
  return (
    <div className="pb-28">
      <PageHeader title="Plan" subtitle="Minggu ke-5 · Bentuk tubuh · Pemula" />
      <div className="mx-5 mt-5 rounded-2xl bg-primary p-4 text-primary-foreground">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Sparkles className="h-4 w-4" /> Rekomendasi</div>
        <p className="mt-2 text-sm">Form push-up kamu naik 8%. Minggu depan target dinaikkan ke 3 × 14 rep.</p>
      </div>
      <div className="mt-5 space-y-2.5 px-5">
        {plan.map((p) => (
          <div key={p.day} className={`flex gap-4 rounded-2xl border p-4 ${p.today ? "border-primary bg-card" : "border-border bg-card/60"}`}>
            <div className="w-10 shrink-0 text-center">
              <p className="text-[11px] text-muted-foreground">{p.day}</p>
              <p className="font-display text-xl font-bold">{p.date}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold">{p.title}</p>
                {p.done && <span className="grid h-6 w-6 place-items-center rounded-full bg-secondary text-secondary-foreground"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>}
                {p.today && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">Hari ini</span>}
              </div>
              {p.items.length > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">{p.items.join(" · ")}</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Pemulihan</p>
              )}
              {p.today && (
                <Link to="/sesi" className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">Mulai sesi</Link>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 pt-4">
        <Link to="/onboarding" className="block text-center text-sm font-semibold text-secondary">Ubah tujuan & jadwal</Link>
      </div>
      <BottomNav />
    </div>
  );
}
