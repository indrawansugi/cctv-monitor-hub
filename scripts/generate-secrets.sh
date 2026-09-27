#!/usr/bin/env bash
# Generates the secrets needed in .env for local self-hosted Convex:
#  - INSTANCE_SECRET (64-char hex)
#  - JWT_PRIVATE_KEY (RSA PKCS#8 PEM, single line with \n escapes)
# Run:  ./scripts/generate-secrets.sh   (creates/updates .env safely)
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f convex.conf ]; then
  echo "convex.conf template not found" >&2
  exit 1
fi

if [ -f .env ]; then
  cp .env ".env.bak.$(date +%Y%m%d%H%M%S)"
  ENVFILE=".env"
else
  cp convex.conf .env
  ENVFILE=".env"
fi

set_kv() { # set_kv KEY VALUE FILE
  local key="$1" val="$2" file="$3"
  if grep -q "^${key}=" "$file"; then
    sed -i.bak2 "s|^${key}=.*|${key}=${val}|" "$file" && rm -f "$file.bak2"
  else
    printf '\n%s=%s\n' "$key" "$val" >> "$file"
  fi
}

# INSTANCE_SECRET — 64 hex chars
INSTANCE_SECRET_VAL=$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')
set_kv "INSTANCE_SECRET" "$INSTANCE_SECRET_VAL" "$ENVFILE"

# JWT_PRIVATE_KEY — RSA 2048 PKCS#8, single line with literal \n
if command -v openssl >/dev/null 2>&1; then
  JWT_VAL=$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 2>/dev/null \
    | openssl pkcs8 -topk8 -nocrypt -outform DER 2>/dev/null \
    | base64 -w0 \
    | sed 's/^/MIIB \n/' )
  # Build a proper PKCS#8 PEM single-line string: header + base64 body
  JWT_VAL=$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 2>/dev/null \
    | openssl pkcs8 -topk8 -nocrypt 2>/dev/null \
    | grep -v "PRIVATE KEY-" | tr -d '\n' \
    | sed 's/^\(.*\)$/-----BEGIN PRIVATE KEY-----\\n\1\\n-----END PRIVATE KEY-----/')
  set_kv "JWT_PRIVATE_KEY" "$JWT_VAL" "$ENVFILE"
else
  echo "WARNING: openssl not found — fill JWT_PRIVATE_KEY manually." >&2
fi

echo "Done. Secrets written to .env (previous file backed up)."
echo "Review .env and set PUBLIC_WEB_URL to your server's LAN address, e.g. http://192.168.1.10:8092"
