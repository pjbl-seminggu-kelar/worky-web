import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Target, Dumbbell, Bell, Shield, Camera } from "lucide-react";
import { BottomNav, PageHeader } from "@/components/BottomNav";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil — Worky" },
      { name: "description", content: "Profil, statistik progres form, dan pengaturan Worky." },
      { property: "og:title", content: "Profil — Worky" },
      { property: "og:description", content: "Statistik progres dan pengaturan akun Worky." },
    ],
  }),
  component: Profile,
});

const bars = [62, 70, 68, 75, 80, 78, 86];

function Profile() {
  return (
    <div className="pb-28">
      <PageHeader title="Profil" />
      <div className="mx-5 mt-5 flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-secondary font-display text-2xl font-bold text-secondary-foreground">B</div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">Badzlan Nur</p>
          <p className="text-sm text-muted-foreground">Pemula · 24 th · 68 kg</p>
        </div>
      </div>

      <div className="mx-5 mt-5 grid grid-cols-3 gap-2">
        {[["32", "Sesi"], ["1.204", "Rep valid"], ["84%", "Rata form"]].map(([v, k]) => (
          <div key={k} className="rounded-2xl bg-card p-3 text-center">
            <p className="font-display text-xl font-bold text-primary">{v}</p>
            <p className="text-[11px] text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-bold">Kualitas form 7 minggu</p>
        <div className="mt-4 flex h-28 items-end gap-2">
          {bars.map((b, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className={`w-full rounded-md ${i === bars.length - 1 ? "bg-primary" : "bg-muted"}`} style={{ height: `${b}%` }} />
              <span className="text-[10px] text-muted-foreground">M{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-5 mt-4 divide-y divide-border overflow-hidden rounded-2xl bg-card">
        {[
          { icon: Target, label: "Tujuan latihan", value: "Bentuk tubuh", to: "/onboarding" as const },
          { icon: Dumbbell, label: "Peralatan", value: "Tanpa alat", to: "/onboarding" as const },
          { icon: Camera, label: "Kamera & kalibrasi", value: "", to: "/profil" as const },
          { icon: Bell, label: "Pengingat", value: "18:30", to: "/profil" as const },
          { icon: Shield, label: "Privasi data", value: "Video tidak disimpan", to: "/profil" as const },
        ].map(({ icon: Icon, label, value, to }) => (
          <Link key={label} to={to} className="flex items-center gap-3 px-4 py-3.5">
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1 text-sm">{label}</span>
            <span className="truncate text-xs text-muted-foreground">{value}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
