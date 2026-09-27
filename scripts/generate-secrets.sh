#!/usr/bin/env bash
# Generates the secrets needed in .env for local self-hosted Convex:
#  - INSTANCE_SECRET (64-char hex)
#  - JWT_PRIVATE_KEY (RSA PKCS#8, single-line PEM without any newlines)
# Run:  ./scripts/generate-secrets.sh   (creates/updates .env safely)
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f convex.conf ]; then
  echo "convex.conf template not found" >&2
  exit 1
fi

if [ -f .env ]; then
  cp .env ".env.bak.$(date +%Y%m%d%H%M%S)"
else
  cp convex.conf .env
fi

set_kv() { # set_kv KEY VALUE  (writes into .env in project root)
  key="$1"; val="$2"; file=".env"
  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$file"
  else
    printf '%s=%s\n' "$key" "$val" >> "$file"
  fi
}

# ── INSTANCE_SECRET: 64 hex chars from /dev/urandom ─────────────────────────
INSTANCE_SECRET_VAL=$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')
set_kv "INSTANCE_SECRET" "$INSTANCE_SECRET_VAL"

# ── JWT_PRIVATE_KEY: RSA 2048, single-line PEM ──────────────────────────────
# Convex Auth signs JWTs with jose. jose requires the string to start with
# "-----BEGIN PRIVATE KEY-----" and strips the markers plus ALL whitespace,
# so a PEM on one line (BEGIN + base64 DER + END, no newlines) works inside
# docker-compose env values. Verified against the installed jose version.
if command -v openssl >/dev/null 2>&1; then
  JWT_B64=$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 2>/dev/null \
    | openssl pkcs8 -topk8 -nocrypt -outform DER 2>/dev/null \
    | base64 -w0)
  set_kv "JWT_PRIVATE_KEY" "-----BEGIN PRIVATE KEY-----${JWT_B64}-----END PRIVATE KEY-----"
else
  echo "WARNING: openssl not found — fill JWT_PRIVATE_KEY manually." >&2
fi

echo ""
echo "✓ Secrets written to .env (previous file backed up if it existed)."
echo ""
echo "Next steps:"
echo "  1) Edit .env → set PUBLIC_WEB_URL to how users open the app,"
echo "     e.g. PUBLIC_WEB_URL=http://<ip-server-anda>:8092"
echo "  2) docker compose up -d --build"
echo "  3) Deploy Convex functions (README §2, sekali saja):"
echo "       docker compose exec backend ./generate_admin_key.sh"
