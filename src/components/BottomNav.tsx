import { Link } from "@tanstack/react-router";
import { Home, Dumbbell, CalendarDays, User } from "lucide-react";

const items = [
  { to: "/", icon: Home, label: "Beranda" },
  { to: "/latihan", icon: Dumbbell, label: "Latihan" },
  { to: "/plan", icon: CalendarDays, label: "Plan" },
  { to: "/profil", icon: User, label: "Profil" },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-10 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-card/95 px-6 py-3 backdrop-blur">
      <ul className="flex items-center justify-between text-[11px]">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 text-muted-foreground"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="px-5 pt-6">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </header>
  );
}
