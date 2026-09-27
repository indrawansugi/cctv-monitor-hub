import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Camera,
  MonitorDot,
  RefreshCw,
  VideoOff,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export interface CameraItem {
  _id: string;
  cameraId: string;
  name: string;
  ip: string;
  nvr: string;
  nvrIp?: string;
  pictureUrl: string;
  status: string;
  lastSyncAt: number;
}

/** Cache-busted URL so refreshing a snapshot bypasses browser cache. */
function snapshotUrl(cam: CameraItem, bust: number) {
  const sep = cam.pictureUrl.includes("?") ? "&" : "?";
  return `${cam.pictureUrl}${sep}t=${bust}`;
}

export function CameraCard({
  camera,
  onRefreshStatus,
}: {
  camera: CameraItem;
  onRefreshStatus?: (cameraId: string) => void;
}) {
  const [bust, setBust] = useState(() => Date.now());
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const online = camera.status === "online";
  const url = useMemo(() => snapshotUrl(camera, bust), [camera, bust]);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setFailed(false);
  }, []);

  const handleError = useCallback(() => {
    setFailed(true);
    setLoaded(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setBust(Date.now());
    setLoaded(false);
    setFailed(false);
    onRefreshStatus?.(camera.cameraId);
  }, [camera.cameraId, onRefreshStatus]);

  return (
    <div
      className={cn(
        "glass group flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5",
        "hover:shadow-[0_12px_40px_oklch(0.55_0.1_235/0.22)]",
      )}
    >
      {/* Snapshot viewport */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-100/80 to-sky-100/60">
        {!loaded && (
          <div className="glass-shimmer absolute inset-0 flex items-center justify-center">
            <Camera className="size-6 text-sky-400/60" />
          </div>
        )}
        {failed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
            <VideoOff className="size-6 text-rose-400" />
            <span className="text-[11px] font-medium text-rose-500/90">
              Snapshot tidak tersedia
            </span>
          </div>
        ) : (
          <img
            src={url}
            alt={camera.name}
            loading="lazy"
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-500",
              loaded ? "opacity-100" : "opacity-0",
            )}
          />
        )}

        {/* Status chip */}
        <span
          className={cn(
            "absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md",
            online
              ? "bg-emerald-500/20 text-emerald-700 ring-1 ring-emerald-500/30"
              : "bg-rose-500/20 text-rose-700 ring-1 ring-rose-500/30",
          )}
        >
          <MonitorDot
            className={cn(
              "size-3",
              online && "animate-pulse text-emerald-500",
              !online && "text-rose-500",
            )}
          />
          {online ? "ONLINE" : camera.status.toUpperCase()}
        </span>

        {/* Refresh button */}
        <button
          type="button"
          onClick={handleRefresh}
          title="Muat ulang snapshot"
          className="absolute right-2.5 top-2.5 inline-flex size-8 items-center justify-center rounded-full bg-white/60 opacity-0 ring-1 ring-white/70 backdrop-blur-md transition-all hover:bg-white/85 focus-visible:opacity-100 group-hover:opacity-100"
        >
          <RefreshCw className="size-3.5 text-sky-700" />
        </button>

        {/* NVR label */}
        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-sky-950/35 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-50 backdrop-blur-md">
          {camera.nvr}
        </span>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1.5 px-4 pb-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3
            className="line-clamp-2 text-sm font-semibold leading-snug text-sky-950"
            title={camera.name}
          >
            {camera.name}
          </h3>
          <Badge
            variant="outline"
            className="shrink-0 border-sky-200/80 bg-white/50 text-[10px] text-sky-700"
          >
            {camera.cameraId}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-sky-900/60">
          <span className="rounded bg-white/45 px-1.5 py-0.5 font-mono text-[11px]">
            {camera.ip}
          </span>
          {camera.nvrIp && (
            <span className="truncate text-[11px] text-sky-900/45">
              via {camera.nvrIp}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
