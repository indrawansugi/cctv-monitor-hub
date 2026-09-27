import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

/** Shape of one camera entry in the source monitoring JSON. */
const cameraInput = {
  id: v.string(),
  ip: v.string(),
  name: v.string(),
  nvr: v.string(),
  picture_url: v.string(),
  status: v.string(),
};

type CameraInputValue = {
  id: string;
  ip: string;
  name: string;
  nvr: string;
  picture_url: string;
  status: string;
};

/**
 * Extract the NVR host (host:port before /ISAPI) from a picture URL.
 * e.g. "http://10.2.187.91:80/ISAPI/..." -> "10.2.187.91:80"
 */
function nvrHostFrom(pictureUrl: string): string | undefined {
  const match = /^(?:https?:\/\/)?([^/]+)\/ISAPI\//i.exec(pictureUrl);
  return match?.[1];
}

/**
 * Upsert camera docs into the DB. Shared by manual JSON import, URL sync
 * ("Sync dari URL"), and the scheduled auto-sync.
 */
export async function upsertCameras(
  ctx: { db: any },
  cams: CameraInputValue[],
): Promise<{ created: number; updated: number }> {
  const now = Date.now();
  let created = 0;
  let updated = 0;

  for (const cam of cams) {
    const nvrIp = nvrHostFrom(cam.picture_url);
    const existing = await ctx.db
      .query("cameras")
      .withIndex("by_camera_id", (q: any) => q.eq("cameraId", cam.id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: cam.name,
        ip: cam.ip,
        nvr: cam.nvr,
        nvrIp: nvrIp ?? existing.nvrIp,
        pictureUrl: cam.picture_url,
        status: cam.status,
        lastSyncAt: now,
      });
      updated++;
    } else {
      await ctx.db.insert("cameras", {
        cameraId: cam.id,
        name: cam.name,
        ip: cam.ip,
        nvr: cam.nvr,
        nvrIp,
        pictureUrl: cam.picture_url,
        status: cam.status,
        lastSyncAt: now,
      });
      created++;
    }
  }
  return { created, updated };
}

/**
 * Import/refresh the camera inventory from a JSON payload shaped like:
 * { "cameras": [ { id, ip, name, nvr, picture_url, status }, ... ] }
 *
 * Upserts by camera id and stamps lastSyncAt, so re-running the same import
 * never creates duplicates.
 */
export const importJson = mutation({
  args: { payload: v.object({ cameras: v.array(v.object(cameraInput)) }) },
  handler: async (ctx, { payload }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const res = await upsertCameras(ctx, payload.cameras);
    return { ...res, total: payload.cameras.length };
  },
});

// ── URL sync (pull JSON directly from the NVR reporter host) ──────────────

/** Single-row sync settings; read by the UI. Signed-in users only. */
export const getSyncSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return (await ctx.db.query("syncSettings").first()) ?? null;
  },
});

/** Internal: read settings without auth (used by the cron tick). */
export const _getSyncSettingsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return (await ctx.db.query("syncSettings").first()) ?? null;
  },
});

/** Save sync settings (URL, auto-sync toggle, interval). */
export const saveSyncSettings = mutation({
  args: {
    url: v.string(),
    autoSync: v.boolean(),
    intervalSec: v.number(),
  },
  handler: async (ctx, { url, autoSync, intervalSec }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    if (!/^https?:\/\//i.test(url)) {
      throw new Error("URL harus dimulai dengan http:// atau https://");
    }
    const interval = Math.max(60, intervalSec);

    const existing = await ctx.db.query("syncSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        url,
        autoSync,
        intervalSec: interval,
      });
    } else {
      await ctx.db.insert("syncSettings", {
        url,
        autoSync,
        intervalSec: interval,
      });
    }
    return { ok: true as const };
  },
});

/** Internal: write back the result of a sync run. */
export const _recordSyncResult = internalMutation({
  args: {
    ok: v.boolean(),
    error: v.optional(v.string()),
    created: v.optional(v.number()),
    updated: v.optional(v.number()),
  },
  handler: async (ctx, { ok, error, created, updated }) => {
    const settings = await ctx.db.query("syncSettings").first();
    if (!settings) return;
    await ctx.db.patch(settings._id, {
      lastSyncAt: Date.now(),
      lastStatus: ok ? "ok" : "error",
      lastError: ok ? undefined : (error ?? "Unknown error"),
      lastCounts: ok ? { created: created ?? 0, updated: updated ?? 0 } : undefined,
    });
  },
});

/** Internal: insert settings row if missing (used when auto-sync toggled on). */
export const _ensureSettings = internalMutation({
  args: {
    url: v.string(),
    autoSync: v.boolean(),
    intervalSec: v.number(),
  },
  handler: async (ctx, { url, autoSync, intervalSec }) => {
    const existing = await ctx.db.query("syncSettings").first();
    if (!existing) {
      await ctx.db.insert("syncSettings", { url, autoSync, intervalSec });
    }
  },
});

/**
 * Pull the camera JSON from the configured URL (server-side, no CORS issues)
 * and upsert it. Triggered manually from the UI or by the auto-sync tick.
 */
export const syncNow = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const settings = await ctx.runQuery(
      internal.cameras._getSyncSettingsInternal,
      {},
    );
    if (!settings) {
      throw new Error("Sync settings belum diisi. Simpan URL terlebih dahulu.");
    }

    let created = 0;
    let updated = 0;
    let ok = true;
    let error: string | undefined;

    try {
      const res = await fetch(settings.url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const parsed = (await res.json()) as { cameras?: CameraInputValue[] };
      const cams = parsed?.cameras;
      if (!Array.isArray(cams) || cams.length === 0) {
        throw new Error(
          'Format JSON tidak sesuai: harus berbentuk { "cameras": [...] }',
        );
      }
      for (const cam of cams) {
        for (const key of ["id", "ip", "name", "nvr", "picture_url", "status"]) {
          if (typeof (cam as Record<string, unknown>)[key] !== "string") {
            throw new Error(`Field "${key}" wajib string di setiap kamera.`);
          }
        }
      }
      const r = await ctx.runMutation(internal.cameras._applySync, {
        cameras: cams,
      });
      created = r.created;
      updated = r.updated;
    } catch (e) {
      ok = false;
      error =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "Unknown fetch error";
    }

    await ctx.runMutation(internal.cameras._recordSyncResult, {
      ok,
      error,
      created,
      updated,
    });

    return { ok, error, created, updated };
  },
});

/** Internal mutation that performs the actual upsert (called from the action). */
export const _applySync = internalMutation({
  args: { cameras: v.array(v.object(cameraInput)) },
  handler: async (ctx, { cameras }) => {
    return await upsertCameras(ctx, cameras);
  },
});

/** Called every minute by the cron; syncs when the interval has elapsed. */
export const autoSyncTick = internalMutation({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("syncSettings").first();
    if (!settings || !settings.autoSync) return;
    const now = Date.now();
    const due = (settings.lastSyncAt ?? 0) + settings.intervalSec * 1000;
    if (now < due) return;
    // Kick the action; the action records the result itself.
    await ctx.scheduler.runAfter(0, internal.cameras._syncActionWrapper, {});
  },
});

/** Internal action wrapper so the scheduler has an action to call. */
export const _syncActionWrapper = internalAction({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.runQuery(
      internal.cameras._getSyncSettingsInternal,
      {},
    );
    if (!settings) return;

    let ok = true;
    let error: string | undefined;
    let created = 0;
    let updated = 0;
    try {
      const res = await fetch(settings.url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const parsed = (await res.json()) as { cameras?: CameraInputValue[] };
      const cams = parsed?.cameras;
      if (!Array.isArray(cams) || cams.length === 0) {
        throw new Error("Format JSON tidak sesuai");
      }
      const r = await ctx.runMutation(internal.cameras._applySync, {
        cameras: cams,
      });
      created = r.created;
      updated = r.updated;
    } catch (e) {
      ok = false;
      error =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "Unknown fetch error";
    }
    await ctx.runMutation(internal.cameras._recordSyncResult, {
      ok,
      error,
      created,
      updated,
    });
  },
});

// ── Read endpoints ────────────────────────────────────────────────────────

/** All cameras, newest sync first. Signed-in users only. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db.query("cameras").collect();
  },
});

/** Distinct NVRs with camera counts, used by the NVR filter. */
export const listNvrs = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const cams = await ctx.db.query("cameras").collect();

    const map = new Map<string, { nvr: string; nvrIp?: string; total: number }>();
    for (const cam of cams) {
      const entry = map.get(cam.nvr) ?? {
        nvr: cam.nvr,
        nvrIp: cam.nvrIp,
        total: 0,
      };
      entry.total++;
      map.set(cam.nvr, entry);
    }
    return [...map.values()].sort((a, b) => a.nvr.localeCompare(b.nvr));
  },
});

/** Summary counts for the dashboard stat cards. Signed-in users only. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { total: 0, online: 0, offline: 0, nvrs: 0 };
    }
    const cams = await ctx.db.query("cameras").collect();
    const online = cams.filter((c) => c.status === "online").length;
    return {
      total: cams.length,
      online,
      offline: cams.length - online,
      nvrs: new Set(cams.map((c) => c.nvr)).size,
    };
  },
});

/** Internal helper kept for potential future scheduled use. */
export const _markSync = internalQuery({
  args: { cameraId: v.string() },
  handler: async (ctx, { cameraId }) => {
    return await ctx.db
      .query("cameras")
      .withIndex("by_camera_id", (q) => q.eq("cameraId", cameraId))
      .unique();
  },
});
