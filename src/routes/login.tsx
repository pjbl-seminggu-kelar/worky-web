import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { AuthLayout, EmailField, PasswordToggle, SubmitButton } from "@/components/AuthLayout";
import { apiFetch, ApiError } from "@/lib/api";
import { saveAuthSession, type AuthResponse } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk — Worky" },
      { name: "description", content: "Masuk ke Worky untuk melanjutkan progres latihanmu." },
    ],
  }),
  component: Login,
});

type LoginPayload = {
  email: string;
  password: string;
};

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginPayload>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await apiFetch<AuthResponse, LoginPayload>("/auth/login", {
        method: "POST",
        body: form,
      });
      saveAuthSession(response);
      await navigate({ to: "/", replace: true });
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Belum bisa masuk. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Selamat datang kembali."
      subtitle="Masuk untuk melanjutkan streak dan melihat progres kualitas form latihanmu."
      footerText="Belum punya akun?"
      footerLink="/register"
      footerLabel="Daftar"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <EmailField value={form.email} onChange={(email) => setForm({ ...form, email })} />

        <label className="block">
          <span className="mb-2 block text-sm font-semibold">Password</span>
          <div className="flex items-center rounded-2xl border border-border bg-card px-4 focus-within:border-primary">
            <input
              required
              minLength={8}
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Masukkan password"
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

        <SubmitButton loading={isSubmitting}>Masuk</SubmitButton>
      </form>
    </AuthLayout>
  );
}
