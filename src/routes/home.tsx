import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Flame, Play, Settings, CalendarDays, Camera, Dumbbell, X } from "lucide-react";
import { exercises } from "@/lib/workouts";
import { BottomNav } from "@/components/BottomNav";
import { AUTH_TOKEN_KEY, ONBOARDING_COMPLETED_KEY } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Beranda | Worky" },
      {
        name: "description",
        content: "Ringkasan latihan, streak mingguan, dan rencana workout kamu di Worky.",
      },
      { property: "og:title", content: "Beranda | Worky" },
      {
        property: "og:description",
        content: "Ringkasan latihan dan rencana workout kamu di Worky.",
      },
    ],
  }),
  component: Index,
});

type SessionHistoryItem = {
  id: string;
  sessionName: string;
  startedAt: string;
  activeDurationSeconds: number;
  totalReps: number;
  validReps: number;
  exercise: {
    name: string;
    slug: string;
    category: string;
  };
};

type SessionHistoryResponse = {
  status: "success";
  data: SessionHistoryItem[];
};

type WeeklyStreakDay = {
  dayOfWeek: number;
  label: string;
  date: string;
  isToday: boolean;
  isWorkoutDay: boolean;
  isChecked: boolean;
  status: string;
};

type WeeklyStreak = {
  currentStreakDays: number;
  lastCompletedDate: string | null;
  weeklySummary: {
    completedSessions: number;
    targetSessions: number;
    remainingSessions: number;
  };
  days: WeeklyStreakDay[];
};

type WeeklyStreakResponse = {
  status: "success";
  data: WeeklyStreak;
};

function formatSessionMeta(session: SessionHistoryItem) {
  const date = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(new Date(session.startedAt));
  const minutes = Math.round(session.activeDurationSeconds / 60);

  return `${date} · ${minutes} mnt`;
}

function Index() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [weeklyStreak, setWeeklyStreak] = useState<WeeklyStreak | null>(null);
  const [isStreakLoading, setIsStreakLoading] = useState(true);
  const [streakError, setStreakError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      void navigate({ to: "/register", replace: true });
      return;
    }

    if (localStorage.getItem(ONBOARDING_COMPLETED_KEY) !== "true") {
      void navigate({ to: "/onboarding", replace: true });
      return;
    }

    setIsReady(true);
  }, [navigate]);

  useEffect(() => {
    if (!isReady) return;

    let isMounted = true;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    async function fetchSessionHistory() {
      try {
        const response = await apiFetch<SessionHistoryResponse>("/sessions/history", { token });
        if (isMounted) setSessionHistory(response.data);
      } catch (error) {
        console.error("Gagal memuat riwayat latihan:", error);
        if (isMounted) setHistoryError("Riwayat belum bisa dimuat. Coba muat ulang halaman.");
      } finally {
        if (isMounted) setIsHistoryLoading(false);
      }
    }

    async function fetchWeeklyStreak() {
      try {
        const response = await apiFetch<WeeklyStreakResponse>("/plans/weekly-streak", {
          token,
        });
        if (isMounted) setWeeklyStreak(response.data);
      } catch (error) {
        console.error("Gagal memuat streak mingguan:", error);
        if (isMounted) setStreakError("Streak minggu ini belum bisa dimuat.");
      } finally {
        if (isMounted) setIsStreakLoading(false);
      }
    }

    void Promise.all([fetchSessionHistory(), fetchWeeklyStreak()]);

    return () => {
      isMounted = false;
    };
  }, [isReady]);

  if (!isReady) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex items-center gap-2 text-primary">
          <img src="icon.png" alt="icon" width={27} />
          <span className="font-display text-2xl font-extrabold">Worky</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <header className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <img src="icon.png" alt="icon" width={27} />
          <span className="font-display text-2xl font-extrabold">Worky</span>
        </div>
        <Link to="/profil" aria-label="Pengaturan" className="text-muted-foreground">
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      <section className="mx-5 mt-5 rounded-2xl border border-border bg-card p-4">
        {isStreakLoading && (
          <div className="animate-pulse" role="status" aria-label="Memuat streak mingguan">
            <div className="flex justify-between">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-24 rounded bg-muted" />
            </div>
            <div className="mt-4 flex justify-between">
              {Array.from({ length: 7 }, (_, index) => (
                <div key={index} className="flex flex-col items-center gap-1.5">
                  <div className="h-9 w-9 rounded-full bg-muted" />
                  <div className="h-3 w-3 rounded bg-muted" />
                </div>
              ))}
            </div>
            <div className="mt-4 h-3 w-2/3 rounded bg-muted" />
          </div>
        )}

        {!isStreakLoading && streakError && (
          <p role="alert" className="text-sm text-destructive">
            {streakError}
          </p>
        )}

        {!isStreakLoading && weeklyStreak && (
          <>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
              <span className="text-muted-foreground">Minggu ini</span>
              <span className="flex items-center gap-1 text-primary">
                <Flame className="h-4 w-4" /> {weeklyStreak.currentStreakDays} hari streak
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {weeklyStreak.days.map((day) => {
                const isCompleted = day.isChecked || day.status === "COMPLETED";
                const isMissed = day.status === "MISSED";

                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center gap-1.5"
                    title={`${day.date} · ${day.isWorkoutDay ? "Hari latihan" : "Hari istirahat"}`}
                  >
                    <div
                      className={`grid h-9 w-9 place-items-center rounded-full ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isMissed
                            ? "border border-destructive/40 bg-destructive/10 text-destructive"
                            : day.isToday
                              ? "border-2 border-primary text-primary"
                              : "border border-dashed border-border text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" strokeWidth={3} />
                      ) : isMissed ? (
                        <X className="h-4 w-4" strokeWidth={3} />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] ${day.isToday ? "font-bold text-primary" : "text-muted-foreground"}`}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {weeklyStreak.weeklySummary.completedSessions} dari{" "}
              {weeklyStreak.weeklySummary.targetSessions} sesi selesai
              {weeklyStreak.weeklySummary.remainingSessions > 0
                ? ` - ${weeklyStreak.weeklySummary.remainingSessions} lagi untuk capai target.`
                : " - Target minggu ini tercapai."}
            </p>
          </>
        )}
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
              to="/exercies/$id"
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
          to="/plan"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3 text-sm font-semibold text-secondary-foreground"
        >
          <Play className="h-4 w-4 fill-current" /> Mulai workout
        </Link>
        <div className="mt-3 space-y-2.5">
          {isHistoryLoading &&
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="h-[74px] animate-pulse rounded-2xl border border-border bg-card"
              />
            ))}

          {!isHistoryLoading && historyError && (
            <p
              role="alert"
              className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {historyError}
            </p>
          )}

          {!isHistoryLoading && !historyError && sessionHistory.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Belum ada sesi latihan. Mulai latihan pertamamu untuk melihat riwayat.
            </p>
          )}

          {!isHistoryLoading &&
            !historyError &&
            sessionHistory.map((session) => {
              const exerciseImage = exercises.find(
                (exercise) => exercise.slug === session.exercise.slug,
              )?.img;

              return (
                <Link
                  to="/hasil"
                  key={session.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                >
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-cream p-1">
                    {exerciseImage ? (
                      <img
                        src={exerciseImage}
                        alt=""
                        loading="lazy"
                        width={816}
                        height={816}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Dumbbell
                        className="h-full w-full p-2 text-background/60"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{session.sessionName}</p>
                    <p className="text-xs text-muted-foreground">{formatSessionMeta(session)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-primary">
                      {session.validReps}/{session.totalReps}
                    </p>
                    <p className="text-[11px] text-muted-foreground">rep valid</p>
                  </div>
                </Link>
              );
            })}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
