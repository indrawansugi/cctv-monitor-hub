# CCTV Monitor Hub

Web monitoring CCTV multi-NVR & multi-user dengan tema **Glassmorphism** (light).
Dibangun dengan React + Vite + **Convex self-hosted** (database & auth lokal) + Tailwind CSS.

> **Versi ini 100% berjalan di server Linux Anda** — database (Convex backend) hidup
> sebagai container Docker dengan data di volume lokal, web berjalan di **port 8092**.

![stack](https://img.shields.io/badge/React-19-61dafb) ![stack](https://img.shields.io/badge/Vite-7-646cff) ![stack](https://img.shields.io/badge/Convex-self--hosted-f3b647)

## Fitur (versi 1)

- **Daftar + filter kamera/NVR** — grid monitoring semua kamera dengan snapshot langsung dari endpoint `picture_url` (ISAPI).
- **Filter by NVR** — dropdown NVR dengan jumlah kamera per NVR.
- **Custom filtering** — pencarian bebas (nama/ID/IP kamera), filter status online/offline, sorting.
- **Multi login user** — email + password (tanpa internet — cocok untuk server LAN), atau kode email OTP, atau tamu.
- **Import JSON** — tempel data kamera hasil export NVR; data di-upsert berdasarkan ID kamera tanpa duplikat.
- **Statistik realtime** — total kamera, online, offline, jumlah NVR aktif.

## Arsitektur

```
┌──────────────────────────  Server Linux Anda  ──────────────────────────┐
│                                                                          │
│  ┌──────────────┐   /api/convex      ┌─────────────────────────────┐    │
│  │  web (nginx) │ ─────────────────► │  convex backend (DB lokal)  │    │
│  │  port 8092   │   /api/convex-site │  data → volume convex-data  │    │
│  └──────────────┘                    └─────────────────────────────┘    │
│                                             ▲                            │
│  ┌──────────────┐                           │                            │
│  │  dashboard   │ (opsional, port 6791) ────┘                            │
│  └──────────────┘                                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

## Prasyarat

- Docker + Docker Compose di server Linux
- (Sekali saja) Node.js 18+ di komputer admin untuk deploy functions

## Langkah Deploy di Server

### 1. Siapkan konfigurasi & secret

```bash
cp convex.conf .env
./scripts/generate-secrets.sh        # mengisi INSTANCE_SECRET & JWT_PRIVATE_KEY otomatis
```

Edit `.env`, sesuaikan `PUBLIC_WEB_URL` dengan alamat server Anda:

```env
PUBLIC_WEB_URL=http://192.168.1.10:8092   # ganti dengan IP LAN server
```

> `PUBLIC_WEB_URL` **wajib** sama dengan alamat yang dipakai browser untuk membuka aplikasi,
> karena dipakai untuk origin auth (issuer JWT) dan koneksi Convex.

### 2. Deploy functions ke backend lokal

Convex self-hosted butuh **admin key**. Jalankan:

```bash
docker compose up -d backend
docker compose exec backend ./generate_admin_key.sh
```

Simpan output key-nya. Lalu buat file `.env.local` (di root proyek, jangan di-commit):

```env
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<admin-key-dari-langkah-sebelumnya>
```

> Jika backend sudah berjalan dan port 3210 hanya di dalam jaringan Docker,
> jalankan sementara `docker compose port backend 3210` atau akses via
> `docker compose exec backend curl -s http://localhost:3210/version` untuk verifikasi.
> Alternatif termudah: buka sementara `ports: ["3210:3210"]` pada service `backend`
> di `docker-compose.yml`, deploy functions, lalu tutup kembali.

Deploy functions:

```bash
npx convex dev        # deploy skema + functions ke backend lokal (jawab "y" bila diminta)
```

### 3. Build & jalankan semua layanan

```bash
docker compose up -d --build
```

### 4. Buka aplikasi

- **Web monitoring**: `http://<ip-server>:8092`
- **Convex dashboard** (opsional): `http://<ip-server>:6791`

Pertama kali membuka aplikasi, klik **"Belum punya akun? Daftar"** untuk membuat akun
pertama, lalu buat akun untuk anggota tim lainnya.

## Backup Database

Semua data tersimpan di Docker volume `convex-data`. Backup sederhana:

```bash
docker run --rm -v cctv_convex-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/convex-data-$(date +%F).tar.gz -C /data .
```

Restore:

```bash
docker compose down
docker run --rm -v cctv_convex-data:/data -v $(pwd):/backup alpine \
  sh -c "rm -rf /data/* && tar xzf /backup/convex-data-<tanggal>.tar.gz -C /data"
docker compose up -d
```

## Struktur Penting

| Path | Fungsi |
| --- | --- |
| `docker-compose.yml` | Stack lengkap: web (8092) + Convex backend + dashboard |
| `convex.conf` | Template konfigurasi `.env` |
| `scripts/generate-secrets.sh` | Membuat `INSTANCE_SECRET` + `JWT_PRIVATE_KEY` |
| `nginx.conf` | Web + reverse proxy ke backend lokal |
| `src/pages/Dashboard.tsx` | Halaman monitoring: stats, filter, grid kamera |
| `src/convex/cameras.ts` | Query/mutasi data kamera (list, import, stats) |
| `src/convex/schema.ts` | Skema tabel `cameras` |

## Catatan Jaringan

Snapshot kamera memakai URL internal (mis. `10.2.187.x`). Browser pengguna harus
berada di jaringan yang sama dengan NVR/kamera agar snapshot tampil. App hanya
mengirim permintaan GET ke `picture_url` — NVR tidak diakses dari server.
