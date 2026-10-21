import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import {
  ACTIVE_PLAN_KEY,
  buildPlanDays,
  goalLabel,
  type WorkoutPlan,
} from "@/lib/workouts";
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
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_PLAN_KEY);
      if (raw) setActivePlan(JSON.parse(raw) as WorkoutPlan);
    } catch {
      // ignore parse errors
    }
  }, []);

  if (!activePlan) {
    return (
      <div className="pb-28">
        <PageHeader title="Plan" subtitle="Belum ada plan" />
        <div className="px-5 pt-10 text-center">
          <p className="text-muted-foreground">Kamu belum punya workout plan.</p>
          <Link
            to="/onboarding"
            className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Buat plan
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const days = buildPlanDays(activePlan);
  const sessionsPerWeek = days.filter((d) => d.planItems.length > 0).length;

  return (
    <div className="pb-28">
      <PageHeader
        title="Plan"
        subtitle={`${activePlan.name} · ${goalLabel(activePlan.goal)} · ${sessionsPerWeek} sesi/minggu`}
      />

      <div className="mx-5 mt-5 rounded-2xl bg-primary p-4 text-primary-foreground">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="h-4 w-4" /> Plan dibuat
        </div>
        <p className="mt-2 text-sm">
          Workout plan sudah siap! Ikuti jadwal di bawah dan mulai sesi latihanmu.
        </p>
      </div>

      <div className="mt-5 space-y-2.5 px-5">
        {days.map((p) => (
          <div
            key={p.dayOfWeek}
            className={`flex gap-4 rounded-2xl border p-4 ${
              p.isToday ? "border-primary bg-card" : "border-border bg-card/60"
            }`}
          >
            <div className="w-10 shrink-0 text-center">
              <p className="font-display text-sm font-bold">{p.day}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold">{p.title}</p>
                {p.isToday && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    Hari ini
                  </span>
                )}
              </div>
              {p.items.length > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.items.join(" · ")}
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Pemulihan</p>
              )}
              {p.isToday && p.planItems.length > 0 && (
                <Link
                  to="/sesi"
                  className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  Mulai sesi
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 pt-4">
        <Link
          to="/onboarding"
          className="block text-center text-sm font-semibold text-secondary"
        >
          Ubah tujuan &amp; jadwal
        </Link>
      </div>
      <BottomNav />
    </div>
  );
}
