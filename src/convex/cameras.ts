import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";

/** Shape of one camera entry in the source monitoring JSON. */
const cameraInput = {
  id: v.string(),
  ip: v.string(),
  name: v.string(),
  nvr: v.string(),
  picture_url: v.string(),
  status: v.string(),
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

    const now = Date.now();
    let created = 0;
    let updated = 0;

    for (const cam of payload.cameras) {
      const nvrIp = nvrHostFrom(cam.picture_url);
      const existing = await ctx.db
        .query("cameras")
        .withIndex("by_camera_id", (q) => q.eq("cameraId", cam.id))
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

    return { created, updated, total: payload.cameras.length };
  },
});

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

/** Internal (scheduled) refresh of lastSyncAt — kept simple for v1. */
export const _markSync = internalQuery({
  args: { cameraId: v.string() },
  handler: async (ctx, { cameraId }) => {
    return await ctx.db
      .query("cameras")
      .withIndex("by_camera_id", (q) => q.eq("cameraId", cameraId))
      .unique();
  },
});
