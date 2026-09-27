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
- **Sync dari URL (tanpa import manual)** — server mengambil JSON kamera langsung dari URL (mis. `http://10.2.187.11:5000/status`), dengan opsi **auto-sync berkala** (cron tiap menit, interval bisa diatur). Import JSON manual tetap tersedia sebagai cadangan.
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

Simpan output key-nya, mis. `0135d859...`. Lalu deploy functions dari komputer
yang bisa menjangkau backend. Pilih salah satu:

**Opsi A — via URL dari dalam jaringan server (disarankan):**

```bash
# Cek alamat backend dari dalam Docker:
docker compose exec backend sh -c 'curl -s http://localhost:3210/version'
```

Buat file `.env.local` di root proyek (jangan di-commit):

```env
CONVEX_SELF_HOSTED_URL=http://<ip-lan-server>:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<admin-key-dari-langkah-sebelumnya>
```

> Untuk opsi A, backend perlu sementara terbuka ke LAN. Tambahkan sementara di
> service `backend` pada `docker-compose.yml`:
>
> ```yaml
>     ports:
>       - "3210:3210"
> ```
>
> lalu `docker compose up -d backend`. Setelah functions ter-deploy, hapus
> lagi blok `ports:` tersebut dan `docker compose up -d backend` (port ditutup).

**Opsi B — dari mesin Anda sendiri (tanpa buka port):**

Jalankan CLI Convex di komputer kerja Anda dengan SSH tunnel ke server:

```bash
ssh -L 3210:127.0.0.1:3210 root@<ip-server>   # biarkan terminal ini terbuka
```

Di komputer Anda (folder proyek), buat `.env.local`:

```env
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<admin-key>
```

lalu:

```bash
bun install
bunx convex dev --once
```

> Backend self-hosted tidak punya akses internet, jadi jika CLI mencoba
> "anonymous deployment" cloud, pastikan `CONVEX_SELF_HOSTED_URL` dan
> `CONVEX_SELF_HOSTED_ADMIN_KEY` sudah benar di `.env.local` — CLI akan
> memakai URL tersebut, bukan cloud.

### 3. Build & jalankan semua layanan

```bash
docker compose up -d --build
```

### 4. Buka aplikasi

- **Web monitoring**: `http://<ip-server>:8092`
- **Convex dashboard** (opsional): `http://<ip-server>:6791`

Pertama kali membuka aplikasi, klik **"Belum punya akun? Daftar"** untuk membuat akun
pertama, lalu buat akun untuk anggota tim lainnya.

### 5. Aktifkan sync dari URL

Di dashboard, klik **"Sync dari URL"** → isi alamat JSON kamera Anda, mis.:

```
http://10.2.187.11:5000/status
```

- **Sinkron Sekarang** — tarik data sekarang juga.
- **Auto-sync berkala** — server menarik data otomatis setiap N menit
  (cron Convex menitik setiap menit dan menyinkronkan saat interval tercapai).
- Status sinkron terakhir (waktu, berhasil/gagal, jumlah kamera baru/diperbarui)
  tampil di dialog.

> Karena fetch dilakukan oleh **backend di server** (bukan browser), tidak ada
> masalah CORS dan URL internal 10.x pun bisa dibaca selama server bisa
> mengaksesnya.

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
