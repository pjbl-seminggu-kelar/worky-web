import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BicepsFlexed, Dumbbell, Footprints, Moon, Play, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ACTIVE_PLAN_KEY,
  buildPlanDays,
  formatSetsShort,
  goalLabel,
  type WorkoutPlan,
} from "@/lib/workouts";
import { BottomNav, PageHeader } from "@/components/BottomNav";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Workout Plan | Worky" },
      { name: "description", content: "Jadwal latihan mingguan yang disusun sesuai tujuan dan kemampuanmu." },
      { property: "og:title", content: "Workout Plan | Worky" },
      { property: "og:description", content: "Jadwal latihan mingguan sesuai tujuanmu." },
    ],
  }),
  component: Plan,
});

/* ── Category → minimal line icon ── */

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  UPPER: BicepsFlexed,
  LOWER: Footprints,
  CORE: Target,
  FULL_BODY: Dumbbell,
};

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
  const today = days.find((d) => d.isToday) ?? days[0]!;

  return (
    <div className="pb-28">
      <PageHeader
        title="Plan"
        subtitle={`${activePlan.name} · ${goalLabel(activePlan.goal)} · ${sessionsPerWeek} sesi/minggu`}
      />

      {/* Today spotlight */}
      <section className="mt-5 px-5">
        {today.planItems.length > 0 ? (
          <div className="rounded-3xl border border-primary/40 bg-card p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              Hari ini · {today.day}
            </div>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold leading-tight">
              {today.title}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {today.planItems.map((item) => {
                const Icon = CATEGORY_ICONS[item.exercise.category] ?? Dumbbell;
                return (
                  <li key={item.id} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {item.exercise.name}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                      {formatSetsShort(item)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Link
              to="/sesi"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
            >
              <Play className="h-4 w-4 fill-current" /> Mulai sesi
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border border-secondary/30 bg-secondary/10 p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
              <Moon className="h-4 w-4" /> Hari ini · {today.day}
            </div>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold leading-tight text-secondary">
              Istirahat
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Pemulihan · tidak ada latihan hari ini. Nikmati istirahatmu, besok kita lanjut.
            </p>
          </div>
        )}
      </section>

      {/* Week overview */}
      <section className="mt-7 px-5">
        <h2 className="font-display text-sm font-bold text-muted-foreground">Minggu ini</h2>
        <ul className="mt-2.5 space-y-1.5">
          {days.map((p) => {
            const isRest = p.planItems.length === 0;
            return (
              <li
                key={p.dayOfWeek}
                className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${
                  isRest ? "bg-secondary/10" : "bg-card"
                } ${p.isToday ? "ring-1 ring-primary" : ""}`}
              >
                <span className="flex w-10 shrink-0 items-center gap-1.5 pt-0.5">
                  {p.isToday && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  <span
                    className={`font-display text-sm font-bold ${
                      isRest ? "text-secondary" : "text-foreground"
                    }`}
                  >
                    {p.day}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`min-w-0 truncate text-sm ${
                        isRest ? "font-medium text-muted-foreground" : "font-semibold"
                      }`}
                    >
                      {p.title}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {isRest ? "—" : `${p.planItems.length} latihan`}
                    </span>
                  </div>
                  {!isRest && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.planItems.map((item) => {
                        const Icon = CATEGORY_ICONS[item.exercise.category] ?? Dumbbell;
                        return (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-background/60 py-1 pl-1.5 pr-2.5 text-[11px]"
                          >
                            <span className="grid h-4 w-4 shrink-0 place-items-center text-primary">
                              <Icon className="h-3 w-3" />
                            </span>
                            <span className="font-semibold">{item.exercise.name}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {formatSetsShort(item)}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
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
