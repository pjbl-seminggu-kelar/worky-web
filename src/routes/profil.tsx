import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Target, Dumbbell, Camera, LogOut } from "lucide-react";
import { BottomNav, PageHeader } from "@/components/BottomNav";
import { apiFetch } from "@/lib/api";
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  buildLast7DaysFormQuality,
  clearAuthSession,
  type AuthUser,
  type ProfileResponse,
  type SessionFormHistory,
  type UserStats,
} from "@/lib/auth";
import { goalLabel } from "@/lib/workouts";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil | Worky" },
      { name: "description", content: "Profil, statistik progres form, dan pengaturan Worky." },
      { property: "og:title", content: "Profil | Worky" },
      { property: "og:description", content: "Statistik progres dan pengaturan akun Worky." },
    ],
  }),
  component: Profile,
});

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Pemula",
  INTERMEDIATE: "Menengah",
  ADVANCED: "Lanjutan",
};

type SessionHistoryResponse = {
  status: "success";
  data: SessionFormHistory[];
};

function ProfileSkeleton() {
  return (
    <div className="animate-pulse px-5 pt-6" role="status" aria-label="Memuat profil">
      <span className="sr-only">Memuat profil...</span>
      <div className="h-8 w-24 rounded-lg bg-muted" />
      <div className="mt-6 flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded-md bg-muted" />
          <div className="h-4 w-1/2 rounded-md bg-muted" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-16 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="mt-4 h-44 rounded-2xl bg-muted" />
      <div className="mt-4 space-y-px overflow-hidden rounded-2xl">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-12 bg-muted" />
        ))}
      </div>
      <div className="mt-4 h-12 rounded-2xl bg-muted" />
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionFormHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore */
    }

    async function fetchProfile() {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const [response, historyResponse] = await Promise.all([
          apiFetch<ProfileResponse>("/users/me", { token }),
          apiFetch<SessionHistoryResponse>("/sessions/history", { token }).catch((error) => {
            console.error("Gagal memuat kualitas form:", error);
            return null;
          }),
        ]);
        if (!isMounted) return;

        setUser(response.data.user);
        setStats(response.data.stats);
        setSessionHistory(historyResponse?.data ?? []);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
      } catch (error) {
        console.error("Gagal memuat profil:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="pb-28">
        <ProfileSkeleton />
        <BottomNav />
      </div>
    );
  }

  const displayName = user?.displayName || "Pengguna Worky";
  const initial = displayName.charAt(0).toUpperCase() || "B";
  const levelText = user?.experienceLevel
    ? (LEVEL_LABEL[user.experienceLevel] ?? user.experienceLevel)
    : "-";
  const ageText = user?.age != null ? `${user.age} th` : "-";
  const weightText = user?.weightKg != null ? `${user.weightKg} kg` : "-";
  const goalText = user?.goal ? goalLabel(user.goal) : "-";
  const equipmentText = user?.equipment?.length ? user.equipment.join(", ") : "Tanpa alat";
  const dailyFormQuality = buildLast7DaysFormQuality(sessionHistory);

  function handleLogout() {
    clearAuthSession();
    void navigate({ to: "/login", replace: true });
  }

  return (
    <div className="pb-28">
      <PageHeader title="Profil" />
      <div className="mx-5 mt-5 flex items-center gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-secondary font-display text-2xl font-bold text-secondary-foreground">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{displayName}</p>
          <p className="text-sm text-muted-foreground">
            {levelText} · {ageText} · {weightText}
          </p>
        </div>
      </div>

      <div className="mx-5 mt-5 grid grid-cols-3 gap-2">
        {[
          [String(stats?.totalSessions ?? 0), "Sesi"],
          [(stats?.totalValidReps ?? 0).toLocaleString("id-ID"), "Rep valid"],
          [`${stats?.avgFormRate ?? 0}%`, "Rata form"],
        ].map(([v, k]) => (
          <div key={k} className="rounded-2xl bg-card p-3 text-center">
            <p className="font-display text-xl font-bold text-primary">{v}</p>
            <p className="text-[11px] text-muted-foreground">{k}</p>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-4 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-bold">Kualitas form 7 hari terakhir</p>
        <div className="mt-4 flex h-28 items-end gap-2">
          {dailyFormQuality.map(({ dayLabel, formRate }, i) => (
            <div
              key={`${dayLabel}-${i}`}
              className="flex h-full flex-1 flex-col items-center gap-1"
            >
              <div className="flex w-full flex-1 items-end">
                <div
                  className={`min-h-1 w-full rounded-md ${i === dailyFormQuality.length - 1 ? "bg-primary" : "bg-muted"}`}
                  style={{ height: `${Math.min(100, Math.max(0, formRate))}%` }}
                  title={`${dayLabel}: ${formRate}%`}
                  aria-label={`Kualitas form ${dayLabel} ${formRate}%`}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-5 mt-4 divide-y divide-border overflow-hidden rounded-2xl bg-card">
        {[
          { icon: Target, label: "Tujuan latihan", value: goalText, to: "/onboarding" as const },
          { icon: Dumbbell, label: "Peralatan", value: equipmentText, to: "/onboarding" as const },
          { icon: Camera, label: "Kamera & kalibrasi", value: "", to: "/profil" as const },
        ].map(({ icon: Icon, label, value, to }) => (
          <Link key={label} to={to} className="flex items-center gap-3 px-4 py-3.5">
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1 text-sm">{label}</span>
            <span className="truncate text-xs text-muted-foreground">{value}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="mx-5 mt-4 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
      >
        <LogOut className="h-4 w-4" />
        Keluar dari akun
      </button>
      <BottomNav />
    </div>
  );
}
