import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Camera,
  Check,
  ChevronRight,
  Dumbbell,
  Eye,
  LockKeyhole,
  ScanLine,
  Sparkles,
  Target,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Worky | AI Workout Form Coach" },
      {
        name: "description",
        content:
          "Latihan di rumah dengan feedback form, hitungan repetisi, dan workout plan yang personal.",
      },
      { property: "og:title", content: "Worky | Gerak lebih yakin di rumah" },
      {
        property: "og:description",
        content:
          "Kamera kamu membantu Worky membaca gerakan dan memberi koreksi form yang spesifik.",
      },
    ],
  }),
  component: LandingPage,
});

const exercises = [
  { name: "Squat", target: "Lower body", image: "/squat.png", tone: "bg-[#f4e6c8]" },
  { name: "Push-up", target: "Upper body", image: "/pushup.png", tone: "bg-[#f0a071]" },
  { name: "Plank", target: "Core", image: "/plank.png", tone: "bg-[#a9c88f]" },
  { name: "Sit-up", target: "Core", image: "/situp.png", tone: "bg-[#efca67]" },
  { name: "Pull-up", target: "Upper body", image: "/pullup.png", tone: "bg-[#c8b4da]" },
  { name: "Dips", target: "Upper body", image: "/dips.png", tone: "bg-[#8db9ba]" },
] as const;

const faqs = [
  {
    question: "Apakah Worky menggantikan personal trainer?",
    answer:
      "Tidak. Worky adalah pendamping latihan yang membantu membaca gerakan yang didukung, bukan alat diagnosis atau pengganti arahan profesional.",
  },
  {
    question: "Apakah video latihan saya disimpan?",
    answer:
      "Tidak secara default. Analisis gerakan dirancang berjalan langsung di browser, sementara data sesi disimpan sebagai ringkasan progres.",
  },
  {
    question: "Apa yang saya butuhkan untuk mulai?",
    answer:
      "Kamera perangkat, ruang untuk bergerak, dan pencahayaan yang cukup. Worky akan membantu mengatur posisi kamera sebelum sesi dimulai.",
  },
] as const;

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-cream">
        <img src="/icon.png" alt="" width={25} height={25} />
      </span>
      <span className="font-display text-xl font-extrabold">Worky</span>
    </span>
  );
}

function CtaLink({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/login"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-primary font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary ${compact ? "px-5 py-2.5 text-sm" : "px-6 py-3.5"}`}
    >
      Try Worky Now
      <ArrowUpRight className="h-4 w-4" />
    </Link>
  );
}

function LandingPage() {
  return (
    <main className="overflow-hidden bg-[#201b17] text-[#fff8ec]">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-[#201b17]/90 px-4 py-2.5 shadow-xl backdrop-blur-xl sm:px-5">
          <a href="#top" aria-label="Worky, kembali ke atas">
            <Logo />
          </a>
          <div className="hidden items-center gap-8 text-sm font-semibold text-white/65 md:flex">
            <a className="hover:text-white" href="#cara-kerja">
              Cara kerja
            </a>
            <a className="hover:text-white" href="#gerakan">
              Gerakan
            </a>
            <a className="hover:text-white" href="#privasi">
              Privasi
            </a>
          </div>
          <CtaLink compact />
        </nav>
      </header>

      <section
        id="top"
        className="relative mx-auto min-h-[760px] max-w-7xl px-5 pb-20 pt-36 sm:px-8 lg:grid lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:gap-12 lg:pt-32"
      >
        <div className="relative z-10">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70">
            <ScanLine className="h-3.5 w-3.5 text-primary" />
            AI form checker untuk home workout
          </p>
          <h1 className="max-w-2xl font-display text-[clamp(2.5rem,5.5vw,5rem)] font-extrabold leading-[.96] tracking-[-.045em]">
            Gerak lebih yakin. Bukan sekadar lebih banyak.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-6 text-white/62 sm:text-base sm:leading-7">
            Worky membaca pose dari kamera, menghitung repetisi yang valid, dan menunjukkan bagian
            form yang perlu kamu perbaiki saat latihan di rumah.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <CtaLink />
            <a
              href="#cara-kerja"
              className="inline-flex items-center gap-2 px-2 py-3 text-sm font-bold text-white/72 hover:text-white"
            >
              Lihat cara kerjanya <ChevronRight className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/45">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-secondary" /> Tanpa wearable
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-secondary" /> Video tidak disimpan
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-secondary" /> Mulai dari browser
            </span>
          </div>
        </div>

        <div className="relative mx-auto mt-16 h-[500px] w-full max-w-[570px] lg:mt-0">
          <div className="absolute left-[7%] top-[4%] h-[86%] w-[78%] rotate-[-4deg] rounded-[2.5rem] bg-[#8aae77]" />
          <div className="absolute inset-x-[8%] top-[8%] h-[84%] rotate-[3deg] overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#e9ddc5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4 text-[#201b17]">
              <span className="flex items-center gap-2 text-sm font-extrabold">
                <Camera className="h-4 w-4" /> Live form check
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-[#201b17] px-3 py-1 text-[10px] font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8aae77]" /> CAMERA READY
              </span>
            </div>
            <div className="relative h-[calc(100%-57px)]">
              <img
                src="/squat.png"
                alt="Ilustrasi gerakan squat yang sedang dianalisis Worky"
                className="absolute bottom-0 left-1/2 h-[90%] -translate-x-1/2 object-contain"
              />
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 440 420"
                aria-hidden="true"
              >
                <g fill="none" stroke="#e7783f" strokeLinecap="round" strokeWidth="3">
                  <path d="M224 76 L221 132 L178 184 L133 222" />
                  <path d="M221 132 L278 167 L327 180" />
                  <path d="M221 132 L230 226 L174 289 L123 351" />
                  <path d="M230 226 L295 276 L353 324" />
                </g>
                {[
                  ["224", "76"],
                  ["221", "132"],
                  ["178", "184"],
                  ["133", "222"],
                  ["278", "167"],
                  ["327", "180"],
                  ["230", "226"],
                  ["174", "289"],
                  ["123", "351"],
                  ["295", "276"],
                  ["353", "324"],
                ].map(([cx, cy]) => (
                  <circle
                    key={`${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r="6"
                    fill="#fff8ec"
                    stroke="#e7783f"
                    strokeWidth="3"
                  />
                ))}
              </svg>
              <div className="absolute bottom-5 left-5 rounded-2xl bg-[#201b17] p-4 text-white shadow-xl">
                <p className="text-[10px] font-semibold text-white/50">REP VALID</p>
                <p className="font-display text-4xl font-extrabold">
                  08<span className="text-lg text-white/35">/12</span>
                </p>
              </div>
              <div className="absolute right-4 top-5 max-w-[170px] rounded-2xl bg-white p-3 text-[#201b17] shadow-xl">
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <Target className="h-4 w-4 text-[#df6a35]" /> Pinggul lebih rendah
                </div>
                <p className="mt-1 text-[10px] leading-4 text-black/55">
                  Jaga lutut sejajar dengan arah kaki.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 rounded-2xl border border-white/10 bg-[#2b2520] p-4 shadow-xl">
            <p className="text-[10px] font-semibold text-white/45">FORM QUALITY</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-[#f0a071]">86%</p>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="bg-[#f2eadb] px-5 py-24 text-[#201b17] sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <h2 className="max-w-lg font-display text-3xl font-extrabold leading-[1.05] tracking-[-.03em] sm:text-4xl">
              Pelatih yang melihat apa yang sering kamu lewatkan.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-black/58 lg:justify-self-end">
              Saat kamu fokus menyelesaikan gerakan, Worky menghubungkan pose, repetisi, dan momen
              kesalahan menjadi feedback yang mudah dipahami setelah sesi.
            </p>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden rounded-[2rem] bg-black/10 lg:grid-cols-3">
            {[
              {
                icon: Eye,
                title: "Posisikan kamera",
                text: "Ikuti panduan jarak dan sudut agar seluruh tubuh terbaca dengan jelas.",
              },
              {
                icon: ScanLine,
                title: "Mulai bergerak",
                text: "Pose diproses di browser untuk menilai fase gerakan dan menghitung rep valid.",
              },
              {
                icon: Sparkles,
                title: "Pahami progres",
                text: "Lihat form score, timestamp kesalahan, dan koreksi spesifik untuk sesi berikutnya.",
              },
            ].map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="bg-[#f2eadb] p-7 sm:p-10">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#201b17] text-[#f2eadb]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-sm font-extrabold text-black/25">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-12 text-2xl font-extrabold">{title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-black/55">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="gerakan" className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-primary">Enam gerakan inti</p>
              <h2 className="mt-3 max-w-xl text-4xl font-extrabold leading-[1] sm:text-5xl">
                Mulai dari dasar. Perbaiki setiap detail.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-white/48">
              Setiap gerakan memiliki panduan kamera, kriteria form, dan target sesi yang berbeda.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
            {exercises.map((exercise, index) => (
              <article
                key={exercise.name}
                className={`${exercise.tone} group relative min-h-[260px] overflow-hidden rounded-[1.75rem] p-5 text-[#201b17] sm:min-h-[350px] sm:p-7`}
              >
                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-extrabold sm:text-2xl">{exercise.name}</h3>
                    <p className="text-xs text-black/50">{exercise.target}</p>
                  </div>
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-black/15 text-xs font-bold">
                    0{index + 1}
                  </span>
                </div>
                <img
                  src={exercise.image}
                  alt={`Ilustrasi ${exercise.name}`}
                  loading="lazy"
                  className="absolute bottom-[-5%] left-1/2 h-[76%] w-[90%] -translate-x-1/2 object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:pb-32">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#df713c] lg:grid-cols-2">
          <div className="p-8 sm:p-14 lg:p-20">
            <Dumbbell className="h-9 w-9" />
            <h2 className="mt-10 max-w-lg text-4xl font-extrabold leading-[1] sm:text-5xl">
              Plan yang mengikuti hidupmu.
            </h2>
            <p className="mt-6 max-w-lg leading-7 text-white/72">
              Pilih tujuan, level, waktu, dan alat yang kamu punya. Worky menyusun sesi mingguan
              yang realistis, bukan jadwal sempurna yang sulit dijalani.
            </p>
          </div>
          <div className="bg-[#342b25] p-5 sm:p-10 lg:p-14">
            <div className="rounded-[2rem] bg-[#f2eadb] p-6 text-[#201b17] shadow-2xl sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-black/45">RENCANA HARI INI</p>
                  <h3 className="mt-1 text-2xl font-extrabold">Full body basics</h3>
                </div>
                <span className="rounded-full bg-[#a9c88f] px-3 py-1.5 text-xs font-bold">
                  20 menit
                </span>
              </div>
              <div className="mt-8 space-y-3">
                {[
                  ["Squat", "3 × 12"],
                  ["Push-up", "3 × 8"],
                  ["Plank", "3 × 30 dtk"],
                ].map(([name, target], index) => (
                  <div
                    key={name}
                    className="flex items-center gap-4 rounded-2xl border border-black/10 p-4"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#201b17] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-bold">{name}</span>
                    <span className="text-sm text-black/45">{target}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full w-1/3 rounded-full bg-[#df713c]" />
              </div>
              <p className="mt-2 text-right text-xs text-black/45">1 dari 3 sesi minggu ini</p>
            </div>
          </div>
        </div>
      </section>

      <section id="privasi" className="border-y border-white/10 px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <LockKeyhole className="h-6 w-6" />
            </span>
            <h2 className="mt-8 max-w-md text-3xl font-extrabold leading-[1.05] sm:text-4xl">
              Kamera aktif. Privasi tetap milikmu.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 p-6">
              <p className="font-bold">Diproses di perangkat</p>
              <p className="mt-2 text-sm leading-6 text-white/48">
                Pose dan evaluasi form dirancang berjalan langsung di browser.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 p-6">
              <p className="font-bold">Tanpa video mentah</p>
              <p className="mt-2 text-sm leading-6 text-white/48">
                Worky tidak menyimpan rekaman latihan secara default.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <h2 className="max-w-sm text-4xl font-extrabold leading-[1] sm:text-5xl">
            Sebelum kamu mulai.
          </h2>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold">
                  <span>{faq.question}</span>
                  <span className="text-2xl font-light text-white/40 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pr-10 pt-3 text-sm leading-6 text-white/48">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-10 sm:px-8">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-[#8aae77] px-6 py-20 text-center text-[#201b17] sm:px-12 sm:py-28">
          <img src="/icon.png" alt="" className="mx-auto h-14 w-14" />
          <h2 className="mx-auto mt-8 max-w-3xl text-4xl font-extrabold leading-[.98] sm:text-6xl">
            Satu ruang. Satu kamera. Gerakan yang lebih baik.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-black/60 sm:text-lg sm:leading-8">
            Mulai dari levelmu sekarang, lalu biarkan setiap sesi memberi tahu apa yang perlu
            diperbaiki berikutnya.
          </p>
          <div className="mt-8">
            <CtaLink />
          </div>
        </div>
      </section>

      <footer className="px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="max-w-lg text-xs leading-5 text-white/35">
            Worky membantu mengevaluasi gerakan yang didukung dan bukan pengganti saran medis atau
            personal trainer profesional.
          </p>
          <Link to="/login" className="text-sm font-bold text-white/70 hover:text-white">
            Masuk
          </Link>
        </div>
      </footer>
    </main>
  );
}
