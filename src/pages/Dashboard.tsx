import { CameraCard, type CameraItem } from "@/components/CameraCard";
import { GlassBackground } from "@/components/GlassBackground";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowUpDown,
  Camera as CameraIcon,
  CheckCircle2,
  Filter,
  LayoutGrid,
  ListFilter,
  LogOut,
  MonitorPlay,
  Radio,
  Search,
  Server,
  Upload,
  XCircle,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

type StatusFilter = "all" | "online" | "offline";
type SortMode = "name" | "status" | "id";

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl px-4 py-3">
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/60 ${accent}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-tight text-sky-950">
          {value}
        </div>
        <div className="truncate text-xs font-medium text-sky-900/60">
          {label}
        </div>
      </div>
    </div>
  );
}

function parseImport(text: string):
  | { ok: true; payload: { cameras: unknown[] } }
  | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(text) as unknown;
    const cams = (parsed as { cameras?: unknown[] })?.cameras;
    if (!Array.isArray(cams) || cams.length === 0) {
      return {
        ok: false,
        error: 'JSON harus berbentuk { "cameras": [ ... ] } dan tidak kosong.',
      };
    }
    for (const c of cams) {
      const cam = c as Record<string, unknown>;
      for (const key of ["id", "ip", "name", "nvr", "picture_url", "status"]) {
        if (typeof cam[key] !== "string") {
          return { ok: false, error: `Field "${key}" wajib string di setiap kamera.` };
        }
      }
    }
    return { ok: true, payload: parsed as { cameras: unknown[] } };
  } catch {
    return { ok: false, error: "JSON tidak valid — periksa kembali formatnya." };
  }
}

export default function Dashboard() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const cameras = useQuery(api.cameras.list) ?? undefined;
  const nvrs = useQuery(api.cameras.listNvrs) ?? undefined;
  const stats = useQuery(api.cameras.stats) ?? undefined;
  const importJson = useMutation(api.cameras.importJson);

  const [search, setSearch] = useState("");
  const [nvrFilter, setNvrFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("name");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  const loading = authLoading || cameras === undefined;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filtered: CameraItem[] = useMemo(() => {
    if (!cameras) return [];
    const q = search.trim().toLowerCase();
    const rows = cameras.filter((c) => {
      if (nvrFilter !== "all" && c.nvr !== nvrFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.cameraId.toLowerCase().includes(q) ||
        c.ip.toLowerCase().includes(q) ||
        c.nvr.toLowerCase().includes(q)
      );
    });
    const byStatus = (c: CameraItem) => (c.status === "online" ? 0 : 1);
    return [...rows].sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "id") return a.cameraId.localeCompare(b.cameraId);
      return byStatus(a) - byStatus(b) || a.name.localeCompare(b.name);
    });
  }, [cameras, search, nvrFilter, statusFilter, sortMode]);

  const hasActiveFilter =
    search.trim() !== "" || nvrFilter !== "all" || statusFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setNvrFilter("all");
    setStatusFilter("all");
  };

  const handleImport = async () => {
    const parsed = parseImport(importText);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    setImporting(true);
    try {
      const res = await importJson({
        payload: parsed.payload as {
          cameras: {
            id: string;
            ip: string;
            name: string;
            nvr: string;
            picture_url: string;
            status: string;
          }[];
        },
      });
      toast.success(
        `Import selesai: ${res.created} kamera baru, ${res.updated} diperbarui.`,
      );
      setImportOpen(false);
      setImportText("");
    } catch {
      toast.error("Gagal mengimpor data. Coba lagi.");
    } finally {
      setImporting(false);
    }
  };

  const displayName = user?.name ?? user?.email ?? "Operator";

  return (
    <div className="relative min-h-screen">
      <GlassBackground />

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/45 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-md shadow-sky-500/30">
              <MonitorPlay className="size-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-sky-950">
                CCTV Monitor Hub
              </p>
              <p className="truncate text-[11px] text-sky-900/55">
                Signed in as {displayName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-white/60 bg-white/50 hover:bg-white/80"
                >
                  <Upload className="size-3.5" />
                  <span className="hidden sm:inline">Import JSON</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong max-w-xl border-white/70">
                <DialogHeader>
                  <DialogTitle>Import / Refresh Data Kamera</DialogTitle>
                  <DialogDescription>
                    Tempel JSON hasil export NVR — data akan di-upsert berdasarkan
                    ID kamera tanpa duplikat.
                  </DialogDescription>
                </DialogHeader>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  spellCheck={false}
                  placeholder={'{\n  "cameras": [\n    {\n      "id": "NVR-91-1",\n      "ip": "10.187.17.159",\n      "name": "FA-PARKIRAN_HD_ARDECON1-FIX",\n      "nvr": "NVR-91",\n      "picture_url": "http://10.2.187.91:80/ISAPI/Streaming/channels/101/picture",\n      "status": "online"\n    }\n  ]\n}'}
                  className="h-64 w-full resize-none rounded-xl border border-sky-200/70 bg-white/70 p-3 font-mono text-xs text-sky-950 shadow-inner outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30"
                />
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setImportOpen(false)}
                    disabled={importing}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importing || importText.trim() === ""}
                    className="gap-1.5"
                  >
                    <Upload className="size-3.5" />
                    {importing ? "Mengimpor..." : "Import"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5 border-white/60 bg-white/50 hover:bg-white/80"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6">
        {/* Title + stats */}
        <section className="mb-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-sky-950 sm:text-3xl">
                Monitoring Kamera
              </h1>
              <p className="mt-1 text-sm text-sky-900/60">
                Pantau status semua kamera CCTV lintas NVR dari satu dasbor.
              </p>
            </div>
            <Badge
              variant="outline"
              className="hidden border-emerald-300/70 bg-emerald-50/70 text-emerald-700 sm:inline-flex"
            >
              <Radio className="size-3" />
              Live snapshot
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={<CameraIcon className="size-5 text-sky-600" />}
              label="Total Kamera"
              value={stats?.total ?? "—"}
              accent="bg-sky-100/80"
            />
            <StatCard
              icon={<CheckCircle2 className="size-5 text-emerald-600" />}
              label="Online"
              value={stats?.online ?? "—"}
              accent="bg-emerald-100/80"
            />
            <StatCard
              icon={<XCircle className="size-5 text-rose-500" />}
              label="Offline"
              value={stats?.offline ?? "—"}
              accent="bg-rose-100/80"
            />
            <StatCard
              icon={<Server className="size-5 text-indigo-500" />}
              label="NVR Aktif"
              value={stats?.nvrs ?? "—"}
              accent="bg-indigo-100/80"
            />
          </div>
        </section>

        {/* Filter bar */}
        <section className="glass mb-6 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
            <ListFilter className="size-4 text-sky-600" />
            Filter
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-medium text-sky-700 ring-1 ring-sky-200/80 transition hover:bg-white/90"
              >
                <XCircle className="size-3" />
                Reset
              </button>
            )}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, ID, atau IP kamera..."
                className="border-white/60 bg-white/60 pl-9 text-sky-950 placeholder:text-sky-900/40"
              />
            </div>

            {/* NVR filter */}
            <Select value={nvrFilter} onValueChange={setNvrFilter}>
              <SelectTrigger className="w-full border-white/60 bg-white/60 text-sky-950 md:w-44">
                <Server className="size-4 text-sky-500" />
                <SelectValue placeholder="Semua NVR" />
              </SelectTrigger>
              <SelectContent className="border-white/70">
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Filter className="size-3.5 text-sky-500" />
                    Semua NVR
                  </span>
                </SelectItem>
                {(nvrs ?? []).map((n) => (
                  <SelectItem key={n.nvr} value={n.nvr}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-xs">{n.nvr}</span>
                      <span className="text-[11px] text-sky-900/50">
                        {n.total} kamera
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-full border-white/60 bg-white/60 text-sky-950 md:w-36">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent className="border-white/70">
                <SelectItem value="all">Semua status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortMode}
              onValueChange={(v) => setSortMode(v as SortMode)}
            >
              <SelectTrigger className="w-full border-white/60 bg-white/60 text-sky-950 md:w-40">
                <ArrowUpDown className="size-4 text-sky-500" />
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent className="border-white/70">
                <SelectItem value="name">Nama A-Z</SelectItem>
                <SelectItem value="id">ID Kamera</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/60 ring-1 ring-white/70">
              <LayoutGrid className="size-6 text-sky-500" />
            </div>
            {cameras && cameras.length === 0 ? (
              <>
                <p className="text-sm font-semibold text-sky-950">
                  Belum ada data kamera
                </p>
                <p className="max-w-sm text-xs text-sky-900/60">
                  Klik tombol <strong>Import JSON</strong> di kanan atas untuk
                  memuat daftar kamera dari file JSON monitoring Anda.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-sky-950">
                  Tidak ada kamera yang cocok
                </p>
                <p className="text-xs text-sky-900/60">
                  Coba ubah kata kunci atau reset filter.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="mt-1 border-white/60 bg-white/50"
                >
                  Reset filter
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs font-medium text-sky-900/50">
              Menampilkan {filtered.length} dari {cameras?.length ?? 0} kamera
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((cam) => (
                <CameraCard key={cam._id} camera={cam} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
