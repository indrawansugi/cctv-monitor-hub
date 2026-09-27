import { GlassBackground } from "@/components/GlassBackground";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Filter,
  LayoutGrid,
  MonitorPlay,
  Server,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";

const features = [
  {
    icon: LayoutGrid,
    title: "Grid Monitoring Lengkap",
    desc: "Semua kamera tampil dalam satu dasbor dengan snapshot langsung dari endpoint ISAPI masing-masing NVR.",
  },
  {
    icon: Filter,
    title: "Filter Fleksibel",
    desc: "Saring per NVR, per status online/offline, atau kombinasi pencarian kustom — nama, ID, dan IP kamera.",
  },
  {
    icon: Server,
    title: "Multi-NVR",
    desc: "Dukungan banyak NVR sekaligus dengan ringkasan jumlah kamera per NVR dan label sumber pada tiap kartu.",
  },
  {
    icon: Users,
    title: "Multi User Login",
    desc: "Anda dan tim punya akun masing-masing via email OTP — tanpa password yang mudah bocor.",
  },
  {
    icon: ShieldCheck,
    title: "Aman & Terpusat",
    desc: "Data kamera tersimpan di database Convex yang aman; import JSON hanya bisa dilakukan user yang login.",
  },
  {
    icon: Camera,
    title: "Snapshot On-Demand",
    desc: "Muat ulang snapshot kapan saja dengan satu klik — cepat, tanpa streaming berat.",
  },
];

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const ctaLabel = isLoading
    ? "Memuat..."
    : isAuthenticated
      ? "Buka Monitoring"
      : "Mulai Gratis";

  const ctaTarget = isAuthenticated ? "/dashboard" : "/auth?returnTo=/dashboard";

  return (
    <div className="relative min-h-screen">
      <GlassBackground />

      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/40 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-md shadow-sky-500/30">
              <MonitorPlay className="size-5" />
            </div>
            <span className="text-base font-bold tracking-tight text-sky-950">
              CCTV Monitor Hub
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-sky-900/70 md:flex">
            <a href="#features" className="transition hover:text-sky-600">
              Fitur
            </a>
            <a href="#how" className="transition hover:text-sky-600">
              Cara Kerja
            </a>
          </nav>
          <Button
            size="sm"
            onClick={() => navigate(ctaTarget)}
            className="gap-1.5"
          >
            {isAuthenticated ? "Dashboard" : "Masuk"}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {/* Hero */}
        <section className="flex flex-col items-center pb-16 pt-20 text-center sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-6 border-sky-200/80 bg-white/55 px-3 py-1 text-sky-700 backdrop-blur"
            >
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              Monitoring CCTV multi-NVR &amp; multi-user
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-sky-950 sm:text-6xl"
          >
            Pantau Semua CCTV Anda dari{" "}
            <span className="bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
              Satu Dasbor
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-sky-900/65 sm:text-lg"
          >
            Ubah data JSON kamera NVR menjadi web monitoring yang rapi: snapshot
            langsung, filter per NVR, pencarian kustom, dan akses multi-user
            untuk seluruh tim Anda.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={() => navigate(ctaTarget)}
              className="gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30 hover:from-sky-600 hover:to-cyan-600"
            >
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate(ctaTarget)}
              className="border-white/70 bg-white/50 backdrop-blur hover:bg-white/80"
            >
              <LayoutGrid className="size-4" />
              Lihat Dasbor
            </Button>
          </motion.div>

          {/* Glass mock preview */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="glass mt-16 w-full max-w-4xl rounded-3xl p-4 sm:p-6"
          >
            <div className="mb-3 flex items-center gap-1.5 px-1">
              <span className="size-2.5 rounded-full bg-rose-400/80" />
              <span className="size-2.5 rounded-full bg-amber-400/80" />
              <span className="size-2.5 rounded-full bg-emerald-400/80" />
              <span className="ml-3 text-[11px] font-medium text-sky-900/50">
                cctv-monitor · dashboard
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                "FA-PARKIRAN_HD",
                "MC-MAINWS_1",
                "MC-WS_TYRE",
                "GATE-UTAMA",
                "LAB-CORRIDOR",
                "POOL-AREA",
              ].map((label, i) => (
                <div
                  key={label}
                  className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-sky-100/90 to-cyan-50 ring-1 ring-white/70"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      i % 3 === 0
                        ? "from-sky-200/60 to-cyan-100/40"
                        : i % 3 === 1
                          ? "from-cyan-200/50 to-teal-100/30"
                          : "from-indigo-200/50 to-sky-100/30"
                    }`}
                  />
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/25 px-2 py-0.5 text-[9px] font-bold text-emerald-700 backdrop-blur">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                    ONLINE
                  </span>
                  <span className="absolute bottom-2 left-2 rounded bg-sky-950/35 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                    NVR-91
                  </span>
                  <span className="absolute bottom-2 right-2 max-w-[55%] truncate text-[10px] font-semibold text-sky-950/80">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-24 pb-24">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-sky-950 sm:text-3xl">
              Semua yang tim butuhkan
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-sky-900/60 sm:text-base">
              Dirancang untuk operasional harian: cepat dibuka, mudah difilter,
              dan jelas siapa yang bisa mengakses.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                className="glass rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_oklch(0.55_0.1_235/0.2)]"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-cyan-50 ring-1 ring-white/70">
                  <f.icon className="size-5 text-sky-600" />
                </div>
                <h3 className="text-sm font-bold text-sky-950">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-sky-900/60">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-24 pb-24">
          <div className="glass-strong overflow-hidden rounded-3xl px-6 py-12 sm:px-12">
            <div className="mb-10 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-sky-950 sm:text-3xl">
                Siap dalam 3 langkah
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Import JSON",
                  desc: "Tempel data kamera dari export NVR — format { cameras: [...] }.",
                },
                {
                  step: "02",
                  title: "Filter & Pantau",
                  desc: "Saring per NVR, status, atau pencarian kustom. Klik refresh untuk snapshot terbaru.",
                },
                {
                  step: "03",
                  title: "Ajak Tim",
                  desc: "Setiap anggota login dengan email masing-masing dan langsung bisa memantau.",
                },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-extrabold text-white shadow-lg shadow-sky-500/30">
                    {s.step}
                  </div>
                  <h3 className="text-sm font-bold text-sky-950">{s.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-sky-900/60">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pb-24 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-sky-950 sm:text-3xl">
            Mulai pantau dalam 2 menit
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-sky-900/60">
            Masuk dengan email Anda — tanpa password, cukup kode verifikasi.
          </p>
          <Button
            size="lg"
            onClick={() => navigate(ctaTarget)}
            className="mt-6 gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30 hover:from-sky-600 hover:to-cyan-600"
          >
            {ctaLabel}
            <ArrowRight className="size-4" />
          </Button>
        </section>
      </main>

      <footer className="border-t border-white/40 bg-white/40 py-6 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-sky-900/55 sm:flex-row sm:px-6">
          <span className="font-semibold text-sky-950/70">
            CCTV Monitor Hub
          </span>
          <span>Web monitoring CCTV multi-NVR &amp; multi-user</span>
        </div>
      </footer>
    </div>
  );
}
