import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Flame, Plus, ScanLine, Settings, CalendarDays, Camera } from "lucide-react";
import { exercises, history } from "@/lib/workouts";
import { BottomNav } from "@/components/BottomNav";
import { ONBOARDING_COMPLETED_KEY } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beranda — Worky" },
      {
        name: "description",
        content: "Ringkasan latihan, streak mingguan, dan rencana workout kamu di Worky.",
      },
      { property: "og:title", content: "Beranda — Worky" },
      {
        property: "og:description",
        content: "Ringkasan latihan dan rencana workout kamu di Worky.",
      },
    ],
  }),
  component: Index,
});

const days = ["S", "S", "R", "K", "J", "S", "M"];
const done = [true, true, true, false, false, false, false];

function Index() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(ONBOARDING_COMPLETED_KEY) !== "true") {
      void navigate({ to: "/onboarding", replace: true });
      return;
    }

    setIsReady(true);
  }, [navigate]);

  if (!isReady) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex items-center gap-2 text-primary">
          <ScanLine className="h-7 w-7 animate-pulse" />
          <span className="font-display text-2xl font-extrabold">Worky</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <header className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <ScanLine className="h-5 w-5" />
          </div>
          <span className="font-display text-2xl font-extrabold">Worky</span>
        </div>
        <Link to="/profil" aria-label="Pengaturan" className="text-muted-foreground">
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      <section className="mx-5 mt-5 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
          <span className="text-muted-foreground">Minggu ini</span>
          <span className="flex items-center gap-1 text-primary">
            <Flame className="h-4 w-4" /> 5 minggu streak
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          {days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className={`grid h-9 w-9 place-items-center rounded-full ${done[i] ? "bg-primary text-primary-foreground" : "border border-dashed border-border text-muted-foreground"}`}
              >
                {done[i] ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                )}
              </div>
              <span className="text-[11px] text-muted-foreground">{d}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          3 dari 4 sesi selesai — 1 lagi untuk capai target.
        </p>
      </section>

      <section className="mt-7 px-5">
        <h2 className="text-xl font-bold">Mulai cek form</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link
            to="/sesi"
            className="relative overflow-hidden rounded-2xl bg-primary p-4 text-primary-foreground"
          >
            <h3 className="text-lg font-bold">Live Check</h3>
            <p className="text-xs opacity-90">Kamera + AI realtime</p>
            <Camera className="absolute bottom-3 right-3 h-12 w-12 opacity-30" />
            <p className="mt-10 text-xs font-semibold">6 gerakan</p>
          </Link>
          <Link
            to="/plan"
            className="relative overflow-hidden rounded-2xl bg-secondary p-4 text-secondary-foreground"
          >
            <h3 className="text-lg font-bold">Planner</h3>
            <p className="text-xs opacity-90">Jadwal sesuai tujuan</p>
            <CalendarDays className="absolute bottom-3 right-3 h-12 w-12 opacity-30" />
            <p className="mt-10 text-xs font-semibold">4 sesi/minggu</p>
          </Link>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="px-5 text-xl font-bold">Gerakan</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {exercises.map((e) => (
            <Link
              key={e.id}
              to="/latihan/$id"
              params={{ id: e.id }}
              className="w-32 shrink-0 rounded-2xl bg-cream p-2"
            >
              <img
                src={e.img}
                alt={e.name}
                loading="lazy"
                width={816}
                height={816}
                className="aspect-square w-full object-contain"
              />
              <p className="px-1 text-sm font-bold text-background">{e.name}</p>
              <p className="px-1 pb-1 text-[11px] text-background/60">{e.target}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7 px-5">
        <h2 className="text-xl font-bold">Riwayat latihan</h2>
        <Link
          to="/onboarding"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3 text-sm font-semibold text-secondary-foreground"
        >
          <Plus className="h-4 w-4" /> Buat workout
        </Link>
        <div className="mt-3 space-y-2.5">
          {history.map((h) => (
            <Link
              to="/hasil"
              key={h.title}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <div className="h-12 w-12 shrink-0 rounded-xl bg-cream p-1">
                <img
                  src={h.img}
                  alt=""
                  loading="lazy"
                  width={816}
                  height={816}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{h.title}</p>
                <p className="text-xs text-muted-foreground">{h.date}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold text-primary">
                  {h.valid}/{h.total}
                </p>
                <p className="text-[11px] text-muted-foreground">rep valid</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
