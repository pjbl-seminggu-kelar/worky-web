import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Target, Dumbbell, Bell, Shield, Camera } from "lucide-react";
import { BottomNav, PageHeader } from "@/components/BottomNav";
import { apiFetch } from "@/lib/api";
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  type AuthUser,
  type ProfileResponse,
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

function Profile() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);

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
      if (!token) return;

      try {
        const response = await apiFetch<ProfileResponse>("/users/me", { token });
        if (!isMounted) return;

        setUser(response.data.user);
        setStats(response.data.stats);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user));
      } catch (error) {
        console.error("Gagal memuat profil:", error);
      }
    }

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user?.displayName || "Pengguna Worky";
  const initial = displayName.charAt(0).toUpperCase() || "B";
  const levelText = user?.experienceLevel
    ? (LEVEL_LABEL[user.experienceLevel] ?? user.experienceLevel)
    : "-";
  const ageText = user?.age != null ? `${user.age} th` : "-";
  const weightText = user?.weightKg != null ? `${user.weightKg} kg` : "-";
  const goalText = user?.goal ? goalLabel(user.goal) : "-";
  const equipmentText = user?.equipment?.length ? user.equipment.join(", ") : "Tanpa alat";
  const reminderText = user?.reminderTime || "-";
  const weeklyFormQuality = stats?.weeklyFormQuality ?? [];

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
        <p className="text-sm font-bold">Kualitas form 7 minggu</p>
        <div className="mt-4 flex h-28 items-end gap-2">
          {weeklyFormQuality.map(({ weekLabel, formRate }, i) => (
            <div key={weekLabel} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-md ${i === weeklyFormQuality.length - 1 ? "bg-primary" : "bg-muted"}`}
                style={{ height: `${Math.min(100, Math.max(0, formRate))}%` }}
              />
              <span className="text-[10px] text-muted-foreground">{weekLabel}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-5 mt-4 divide-y divide-border overflow-hidden rounded-2xl bg-card">
        {[
          { icon: Target, label: "Tujuan latihan", value: goalText, to: "/onboarding" as const },
          { icon: Dumbbell, label: "Peralatan", value: equipmentText, to: "/onboarding" as const },
          { icon: Camera, label: "Kamera & kalibrasi", value: "", to: "/profil" as const },
          { icon: Bell, label: "Pengingat", value: reminderText, to: "/profil" as const },
          {
            icon: Shield,
            label: "Privasi data",
            value: "Video tidak disimpan",
            to: "/profil" as const,
          },
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
