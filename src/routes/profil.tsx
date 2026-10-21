import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Target, Dumbbell, Bell, Shield, Camera } from "lucide-react";
import { BottomNav, PageHeader } from "@/components/BottomNav";
import { AUTH_USER_KEY, type AuthUser } from "@/lib/auth";
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

const bars = [62, 70, 68, 75, 80, 78, 86];

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Pemula",
  INTERMEDIATE: "Menengah",
  ADVANCED: "Lanjutan",
};

function Profile() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore */
    }
  }, []);

  const displayName = user?.displayName || "Badzlan Nur";
  const initial = displayName.charAt(0).toUpperCase() || "B";
  const levelText = user?.experienceLevel ? (LEVEL_LABEL[user.experienceLevel] ?? user.experienceLevel) : "Pemula";
  const ageText = user?.age ? `${user.age} th` : "24 th";
  const weightText = user?.weightKg ? `${user.weightKg} kg` : "68 kg";
  const goalText = (user as unknown as { goal?: string })?.goal ? goalLabel((user as unknown as { goal?: string }).goal!) : "Bentuk tubuh";
  const equipmentText = (user as unknown as { equipment?: string[] })?.equipment?.length
    ? (user as unknown as { equipment?: string[] }).equipment!.join(", ")
    : "Tanpa alat";
  const reminderText = (user as unknown as { reminderTime?: string })?.reminderTime || "18:30";

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
              <div
                className={`w-full rounded-md ${i === bars.length - 1 ? "bg-primary" : "bg-muted"}`}
                style={{ height: `${b}%` }}
              />
              <span className="text-[10px] text-muted-foreground">M{i + 1}</span>
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
