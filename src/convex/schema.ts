import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // add other tables here

    // CCTV camera inventory imported from the monitoring JSON
    cameras: defineTable({
      cameraId: v.string(), // e.g. "NVR-91-1"
      name: v.string(), // e.g. "FA-PARKIRAN_HD_ARDECON1-FIX"
      ip: v.string(), // camera IP, e.g. "10.187.17.159"
      nvr: v.string(), // parent NVR name, e.g. "NVR-91"
      nvrIp: v.optional(v.string()), // NVR host IP parsed from picture_url when present
      pictureUrl: v.string(), // ISAPI snapshot endpoint
      status: v.string(), // "online" | "offline" | other
      lastSyncAt: v.number(), // Date.now() of last JSON import
    })
      .index("by_camera_id", ["cameraId"])
      .index("by_nvr", ["nvr"])
      .index("by_status", ["status"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
