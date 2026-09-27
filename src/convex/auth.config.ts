import type { AuthConfig } from "convex/server";

// ── Versi lokal (standalone) ──────────────────────────────────────────────
// Provider JWT federasi Freebuff/Vly hanya dipakai ketika aplikasi berjalan
// di platform (env VLY_CONVEX_AUTH_ISSUER diset). Pada deploy lokal melalui
// docker-compose env itu tidak ada, sehingga provider-nya otomatis tidak
// aktif dan login sepenuhnya memakai provider standar Convex Auth yang
// di-self-host sendiri (password / OTP / guest — lihat src/convex/auth.ts).

const standardProvider = {
  // Standard Convex Auth provider for this project's own sign-in. The
  // deployment self-issues JWTs (iss = CONVEX_SITE_URL, no `kid` header)
  // validated via OIDC discovery at
  // `${domain}/.well-known/openid-configuration`, served by
  // auth.addHttpRoutes() in convex/http.ts. Do NOT convert this entry to
  // `type: "customJwt"` — that path rejects tokens without a `kid` header,
  // so sign-in would silently never confirm and RequireAuth would loop
  // back to /auth forever.
  domain: process.env.CONVEX_SITE_URL!,
  applicationID: "convex",
};

const freebuffIssuer = process.env.VLY_CONVEX_AUTH_ISSUER;

const providers: AuthConfig["providers"] = freebuffIssuer
  ? [
      standardProvider,
      {
        // Freebuff-signed federated tokens (freebuff web's
        // src/lib/vly-convex-jwt.ts) let a signed-in freebuff.com user carry
        // their identity into this project without local sign-in. customJwt
        // is correct here: freebuff's tokens and JWKS both carry a `kid`
        // header, which the customJwt validation path requires.
        type: "customJwt",
        issuer: freebuffIssuer,
        jwks: `${freebuffIssuer}/api/web/.well-known/jwks.json`,
        applicationID: "vly-convex",
        algorithm: "RS256",
      },
    ]
  : [standardProvider];

export default {
  providers,
} satisfies AuthConfig;
