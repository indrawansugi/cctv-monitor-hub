# CCTV Monitor Hub

Web monitoring CCTV multi-NVR & multi-user dengan tema **Glassmorphism** (light).
Dibangun dengan React + Vite + Convex (database & auth) + Tailwind CSS.

![stack](https://img.shields.io/badge/React-19-61dafb) ![stack](https://img.shields.io/badge/Vite-7-646cff) ![stack](https://img.shields.io/badge/Convex-backend-f3b647)

## Fitur (versi 1)

- **Daftar + filter kamera/NVR** — grid monitoring semua kamera dengan snapshot langsung dari endpoint `picture_url` (ISAPI).
- **Filter by NVR** — dropdown NVR dengan jumlah kamera per NVR.
- **Custom filtering** — pencarian bebas (nama/ID/IP kamera), filter status online/offline, dan sorting (nama, ID, status).
- **Multi login user** — Anda & tim login dengan email OTP (tanpa password) atau sebagai tamu.
- **Import JSON** — tempel data kamera hasil export NVR (`{ "cameras": [...] }`); data di-upsert berdasarkan ID kamera tanpa duplikat.
- **Statistik realtime** — total kamera, online, offline, jumlah NVR aktif.
- **Docker Compose ready** — satu perintah untuk deploy via nginx.

## Menjalankan Lokal

```bash
bun install
bun run dev
```

Buka http://localhost:5173, login dengan email (kode OTP dikirim ke email Anda),
lalu klik **Import JSON** dan tempel data kamera Anda, contoh:

```json
{
  "cameras": [
    {
      "id": "NVR-91-1",
      "ip": "10.187.17.159",
      "name": "FA-PARKIRAN_HD_ARDECON1-FIX",
      "nvr": "NVR-91",
      "picture_url": "http://10.2.187.91:80/ISAPI/Streaming/channels/101/picture",
      "status": "online"
    }
  ]
}
```

## Deploy dengan Docker Compose

1. Siapkan URL Convex (dari `bun convex dev` atau deployment production Anda)
   lalu buat file `.env` di samping `docker-compose.yml`:

   ```env
   VITE_CONVEX_URL=https://<deployment-anda>.convex.cloud
   ```

2. Build & jalankan:

   ```bash
   docker compose up -d --build
   ```

3. Buka **http://localhost:8080**.

> Catatan: snapshot kamera memakai URL internal (mis. `10.2.187.x`), jadi pastikan
> browser pengguna berada di jaringan yang sama dengan NVR/kamera.

## Struktur Penting

| Path | Fungsi |
| --- | --- |
| `src/pages/Dashboard.tsx` | Halaman monitoring: stats, filter, grid kamera |
| `src/components/CameraCard.tsx` | Kartu kamera + snapshot + status chip |
| `src/convex/cameras.ts` | Query/mutasi data kamera (list, import, stats) |
| `src/convex/schema.ts` | Skema tabel `cameras` |
| `src/index.css` | Tema Glassmorphism (token warna + utility `glass`) |
| `Dockerfile` / `docker-compose.yml` | Deployment nginx + compose |
