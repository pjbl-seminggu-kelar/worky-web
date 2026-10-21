import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AuthLayout, EmailField, PasswordToggle, SubmitButton } from "@/components/AuthLayout";
import { apiFetch, ApiError } from "@/lib/api";
import { saveAuthSession, type AuthResponse } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Daftar — Worky" },
      {
        name: "description",
        content: "Buat akun Worky dan mulai tingkatkan kualitas form latihanmu.",
      },
    ],
  }),
  component: Register,
});

type RegisterPayload = {
  displayName: string;
  email: string;
  password: string;
};

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterPayload>({ displayName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await apiFetch<AuthResponse, RegisterPayload>("/auth/register", {
        method: "POST",
        body: form,
      });
      saveAuthSession(response);
      await navigate({ to: "/onboarding", replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Belum bisa membuat akun. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Mulai latihan lebih yakin."
      subtitle="Buat akun untuk menyimpan progres dan mendapatkan arahan form yang personal."
      footerText="Sudah punya akun?"
      footerLink="/login"
      footerLabel="Masuk"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Nama lengkap</span>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 focus-within:border-primary">
            <UserRound className="h-5 w-5 text-muted-foreground" />
            <input
              required
              autoComplete="name"
              value={form.displayName}
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              placeholder="Nama kamu"
              className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </label>

        <EmailField value={form.email} onChange={(email) => setForm({ ...form, email })} />

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Password</span>
          <div className="flex items-center rounded-2xl border border-border bg-card px-4 focus-within:border-primary">
            <input
              required
              minLength={8}
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Minimal 8 karakter"
              className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <PasswordToggle visible={showPassword} onClick={() => setShowPassword(!showPassword)} />
          </div>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/15 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <SubmitButton loading={isSubmitting}>Buat akun</SubmitButton>
      </form>
    </AuthLayout>
  );
}
