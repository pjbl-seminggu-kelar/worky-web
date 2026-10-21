import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { exercises } from "@/lib/workouts";
import { BottomNav, PageHeader } from "@/components/BottomNav";

export const Route = createFileRoute("/latihan/")({
  head: () => ({
    meta: [
      { title: "Katalog Gerakan | Worky" },
      { name: "description", content: "Pilih gerakan home workout yang didukung pengecekan form AI." },
      { property: "og:title", content: "Katalog Gerakan | Worky" },
      { property: "og:description", content: "Gerakan home workout dengan pengecekan form AI." },
    ],
  }),
  component: Library,
});

const filters = ["Semua", "Upper", "Lower", "Core"];

function Library() {
  return (
    <div className="pb-28">
      <PageHeader title="Latihan" subtitle="Semua gerakan, dicek oleh AI." />
      <div className="mx-5 mt-5 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        <Search className="h-4 w-4" /> Cari gerakan…
      </div>
      <div className="mt-4 flex gap-2 px-5">
        {filters.map((f, i) => (
          <span key={f} className={`rounded-full px-4 py-1.5 text-xs font-semibold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>{f}</span>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        {exercises.map((e) => (
          <Link key={e.id} to="/latihan/$id" params={{ id: e.id }} className="rounded-2xl bg-cream p-3">
            <img src={e.img} alt={e.name} loading="lazy" width={816} height={816} className="aspect-square w-full object-contain" />
            <p className="font-display text-base font-bold text-background">{e.name}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-background/60">
              <span>{e.target}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">{e.score}%</span>
            </div>
          </Link>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
