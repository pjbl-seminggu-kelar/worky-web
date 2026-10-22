import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { Search, X, RefreshCw, AlertCircle } from "lucide-react";
import { BottomNav, PageHeader } from "@/components/BottomNav";
import { apiFetch } from "@/lib/api";
import { AUTH_TOKEN_KEY } from "@/lib/auth";
import { getExerciseImage } from "@/lib/workouts";
import {
  exercisesEndpoint,
  searchExercises,
  exerciseRouteId,
  formatExerciseTarget,
  type Exercise,
  type ExerciseCategoryFilter,
  type ExercisesResponse,
} from "@/lib/exercises";

export const Route = createFileRoute("/latihan/")({
  head: () => ({
    meta: [
      { title: "Katalog Gerakan | Worky" },
      {
        name: "description",
        content: "Pilih gerakan home workout yang didukung pengecekan form AI.",
      },
      { property: "og:title", content: "Katalog Gerakan | Worky" },
      {
        property: "og:description",
        content: "Gerakan home workout dengan pengecekan form AI.",
      },
    ],
  }),
  component: Library,
});

const CATEGORY_FILTERS: { label: string; value: ExerciseCategoryFilter }[] = [
  { label: "Semua", value: "ALL" },
  { label: "Upper", value: "UPPER" },
  { label: "Lower", value: "LOWER" },
  { label: "Core", value: "CORE" },
];

function Library() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeCategory, setActiveCategory] = useState<ExerciseCategoryFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Fetch exercises from API with optional ?category= query param
  useEffect(() => {
    let isMounted = true;

    async function fetchExercises() {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const endpoint = exercisesEndpoint(activeCategory);

        const response = await apiFetch<ExercisesResponse>(
          endpoint,
          token ? { token } : {},
        );
        if (isMounted) {
          setExercises(response.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal memuat daftar gerakan. Periksa koneksi kamu.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchExercises();

    return () => {
      isMounted = false;
    };
  }, [activeCategory, reloadKey]);

  // Client-side search filtering by name, description, slug, or category
  const filteredExercises = useMemo(() => {
    return searchExercises(exercises, searchQuery);
  }, [exercises, searchQuery]);

  return (
    <div className="pb-28">
      <PageHeader title="Latihan" subtitle="Semua gerakan, dicek oleh AI." />

      {/* Search Bar */}
      <div className="mx-5 mt-5 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm transition-colors focus-within:border-primary">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari gerakan atau otot target…"
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Hapus pencarian"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {CATEGORY_FILTERS.map((f) => {
          const isActive = activeCategory === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setActiveCategory(f.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Error State */}
      {error && !isLoading && (
        <div className="mx-5 mt-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Coba lagi
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="mt-5 grid grid-cols-2 gap-3 px-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-border bg-card p-3"
            >
              <div className="aspect-square w-full rounded-xl bg-muted" />
              <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
              <div className="mt-4 flex justify-between">
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="h-3 w-1/4 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredExercises.length === 0 && (
        <div className="mx-5 mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <Search className="h-6 w-6" />
          </div>
          <p className="mt-4 text-base font-bold">Tidak ada gerakan ditemukan</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            {searchQuery
              ? `Tidak ditemukan gerakan dengan kata kunci "${searchQuery}". Coba kata kunci lain atau ubah filter.`
              : "Belum ada gerakan latihan untuk kategori ini."}
          </p>
          {(searchQuery || activeCategory !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("ALL");
              }}
              className="mt-4 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Reset Filter & Pencarian
            </button>
          )}
        </div>
      )}

      {/* Exercises Grid */}
      {!isLoading && !error && filteredExercises.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 px-5">
          {filteredExercises.map((e) => {
            const imgSrc = e.imageUrl || getExerciseImage(e.slug);
            const targetText = formatExerciseTarget(e);
            const routeId = exerciseRouteId(e.slug);

            return (
              <Link
                key={e.id}
                to="/latihan/$id"
                params={{ id: routeId }}
                className="group relative flex flex-col justify-between rounded-2xl bg-cream p-3 transition-transform active:scale-[0.98]"
              >
                <div>
                  <div className="relative aspect-square w-full overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={e.name}
                      loading="lazy"
                      width={816}
                      height={816}
                      className="h-full w-full object-contain transition-transform group-hover:scale-105"
                    />
                  </div>
                  <p className="mt-1 font-display text-base font-bold text-background truncate">
                    {e.name}
                  </p>
                  <p className="text-[11px] text-background/70 truncate">
                    {e.description}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-background/10 pt-1.5 text-[11px] text-background/60">
                  <span className="font-semibold">{targetText}</span>
                  <span className="rounded-full bg-background/10 px-2 py-0.5 text-[10px] font-bold text-background">
                    {e.category}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
}
