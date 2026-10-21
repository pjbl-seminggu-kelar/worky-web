import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLink: "/login" | "/register";
  footerLabel: string;
};

export function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerLabel,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-dvh flex-col overflow-hidden bg-background px-5 py-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 max-w-[430px] overflow-hidden">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -left-24 top-16 h-52 w-52 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative flex items-center gap-2">
        <img src="icon.png" alt="icon" width={27}/>
        <span className="font-display text-2xl font-extrabold">Worky</span>
      </div>

      <section className="relative my-auto py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          AI workout companion
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight">{title}</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </section>

      <p className="relative text-center text-sm text-muted-foreground">
        {footerText}{" "}
        <Link to={footerLink} className="font-bold text-primary">
          {footerLabel}
        </Link>
      </p>
    </main>
  );
}

export function EmailField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">Email</span>
      <input
        required
        type="email"
        autoComplete="email"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="nama@email.com"
        className="h-14 w-full rounded-2xl border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    </label>
  );
}

export function PasswordToggle({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  const Icon = visible ? EyeOff : Eye;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
      className="text-muted-foreground"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground transition-opacity disabled:opacity-60"
    >
      {loading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
      {loading ? "Memproses..." : children}
    </button>
  );
}
