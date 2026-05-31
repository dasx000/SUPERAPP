# SITTA — Sistem TTD Online Penyuluh Pertanian

Aplikasi web untuk penandatanganan dokumen PDF secara elektronik di lingkup kerja penyuluh pertanian tingkat kabupaten.

---

## Fitur

- Upload dokumen PDF berisi placeholder posisi tanda tangan
- Preview otomatis setelah upload (PDF di-stamp dengan contoh TTD, buka di tab baru)
- Ganti file dokumen selama status masih MENUNGGU atau DITOLAK
- Antrian persetujuan oleh Admin/Ketua Tim
- Penempelan gambar TTD otomatis pada posisi placeholder
- Download dokumen hasil TTD
- File hasil TTD otomatis dihapus setelah 30 hari (via cron job)
- Log audit setiap aktivitas (upload, ACC, tolak, unduh)
- Tiga role pengguna: Penyuluh, Admin, Superadmin
- Pagination daftar dokumen (5 per halaman)

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend + Backend | Next.js 16 (App Router) |
| Autentikasi | NextAuth.js v5 |
| Database | PostgreSQL 16 + Prisma ORM 7 |
| PDF Stamping | Python 3 + PyMuPDF |
| Deploy | Docker + Docker Compose |

---

## Cara Kerja Placeholder

Dokumen PDF harus memuat teks penanda posisi tanda tangan:

```
$(ttd_katimker)
```

Sistem akan otomatis mencari teks ini, menghapusnya, lalu menempelkan gambar TTD tepat di posisi tersebut.

---

## Role Pengguna

| Role | Akses |
|---|---|
| `PENYULUH` | Upload dokumen, pantau status, unduh hasil |
| `ADMIN` | Semua akses penyuluh + ACC/tolak antrian + upload spesimen TTD |
| `SUPERADMIN` | Semua akses + kelola pengguna |

---

## Deploy ke VPS (Baru)

> VPS hanya butuh **Docker** — tidak perlu Node.js, Python, atau PostgreSQL terinstall di sistem.

### 1. Install Docker di VPS

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clone Repo

```bash
git clone https://github.com/dasx000/SUPERAPP.git
cd SUPERAPP
```

> Repo **private** — saat diminta password, gunakan **Personal Access Token** GitHub.
> Buat di: GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate new token → centang `repo`

### 3. Buat File `.env`

```bash
nano .env
```

Isi **persis** seperti ini (ganti nilai yang diperlukan):

```env
DATABASE_URL="postgresql://postgres:GANTI_PASSWORD@localhost:5432/ttd_superapp"
NEXTAUTH_SECRET="isi-random-string-panjang-minimal-32-karakter"
NEXTAUTH_URL="http://IP_VPS_KAMU:3001"
CRON_SECRET="isi-random-string-untuk-cron"
```

> `DATABASE_URL` boleh pakai `localhost` — docker-compose akan override otomatis ke `@db:5432`.
> `POSTGRES_PASSWORD` harus sama dengan password di `DATABASE_URL`.

Simpan: `Ctrl+X` → `Y` → Enter

### 4. Jalankan Aplikasi

```bash
docker compose up -d --build
```

Build pertama kali membutuhkan **10–20 menit**. Tunggu sampai selesai.

### 5. Cek Status

```bash
docker compose logs -f app
```

Tunggu hingga muncul:

```
✓ Ready in 0ms
```

### 6. Buat Akun SUPERADMIN

```bash
docker compose exec app npx tsx scripts/create-superadmin.ts
```

Ikuti prompt: masukkan nama, email, dan password.

### 7. Akses Aplikasi

Buka browser:

```
http://IP_VPS_KAMU:3001
```

**Selesai.** Tidak ada langkah lain.

---

## Update Aplikasi di VPS

Setiap ada perubahan kode:

```bash
git pull
docker compose up -d --build
```

Migrasi database berjalan **otomatis** saat container start.

---

## Perintah Berguna

```bash
# Lihat log aplikasi (live)
docker compose logs -f app

# Cek status container
docker compose ps

# Stop semua container
docker compose down

# Stop dan hapus data database (hati-hati!)
docker compose down -v

# Restart tanpa rebuild
docker compose restart app

# Cek IP publik VPS
curl ifconfig.me
```

---

## Persiapan Lokal (Development)

### Prasyarat

- Node.js 24+
- Python 3 + PyMuPDF (`pip install pymupdf`)
- PostgreSQL 16 berjalan di lokal

### 1. Clone & Install

```bash
git clone https://github.com/dasx000/SUPERAPP.git
cd SUPERAPP
npm install
```

### 2. Buat File `.env`

```bash
cp .env.example .env
```

Sesuaikan isi `.env` untuk lokal:

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/ttd_superapp"
NEXTAUTH_SECRET="development-secret-key"
NEXTAUTH_URL="http://localhost:3001"
CRON_SECRET="development-cron-secret"
```

### 3. Setup Database

```bash
npx prisma generate
npx prisma migrate deploy
```

### 4. Jalankan Dev Server

```bash
npm run dev
```

Aplikasi berjalan di **http://localhost:3001**

---

## Struktur Folder

```
SUPERAPP/
├── src/
│   ├── app/
│   │   ├── login/              # Halaman login
│   │   ├── register/           # Halaman daftar
│   │   └── dashboard/
│   │       ├── page.tsx        # Dashboard statistik
│   │       ├── ttd/            # Upload & status dokumen
│   │       ├── antrian/        # ACC / tolak dokumen (Admin)
│   │       └── pengguna/       # Kelola pengguna (Superadmin)
│   ├── components/
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── stamp.ts            # stampPdf (ACC) + stampPreview (upload)
│   └── generated/prisma/       # Auto-generated Prisma client
├── scripts/
│   ├── create-superadmin.ts    # Script buat akun SUPERADMIN
│   ├── stamp_ttd.py            # Script Python stamping TTD
│   └── start.sh                # Entrypoint container (migrate + start)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── uploads/
│   ├── originals/              # PDF asli (dihapus saat ACC)
│   ├── previews/               # PDF preview contoh TTD (dihapus saat ACC)
│   ├── results/                # PDF ber-TTD (dihapus otomatis 30 hari)
│   └── spesimen/               # Gambar PNG tanda tangan
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## API Endpoints

Semua endpoint membutuhkan sesi login kecuali yang ditandai publik.

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| `POST` | `/api/auth/register` | Publik | Daftar akun baru |
| `POST` | `/api/ttd/upload` | Penyuluh+ | Upload PDF + generate preview |
| `GET` | `/api/ttd/list` | Penyuluh+ | Daftar dokumen milik sendiri |
| `GET` | `/api/ttd/[id]/preview` | Owner / Admin+ | Lihat preview PDF (tab baru) |
| `POST` | `/api/ttd/[id]/replace` | Owner | Ganti file (MENUNGGU/DITOLAK) |
| `POST` | `/api/ttd/[id]/approve` | Admin+ | ACC dokumen |
| `POST` | `/api/ttd/[id]/reject` | Admin+ | Tolak dokumen |
| `GET` | `/api/ttd/[id]/download` | Penyuluh+ | Unduh PDF ber-TTD |
| `POST` | `/api/cron/cleanup` | Cron (secret) | Hapus file results > 30 hari |

---

## Troubleshooting

**Container terus restart / exited**
```bash
docker compose logs app
```
Baca pesan error, paling sering masalah di `.env` yang salah atau kurang.

**Port 3001 tidak bisa diakses**
Pastikan firewall VPS mengizinkan port 3001:
```bash
ufw allow 3001
```

**Placeholder tidak terdeteksi**
Pastikan teks di dalam PDF persis `$(ttd_katimker)` — huruf kecil semua, tanpa spasi ekstra.

**Spesimen TTD belum diatur**
Admin harus upload file PNG tanda tangan melalui menu Spesimen TTD. Gunakan PNG dengan background transparan, ukuran di bawah 300KB.

**Lupa password SUPERADMIN**
```bash
docker compose exec app npx tsx scripts/create-superadmin.ts
```
Masukkan email yang sama — password akan di-update.

---

## Cron Job Cleanup (VPS)

Setelah deploy, tambahkan ke crontab agar file hasil TTD dihapus otomatis tiap 30 hari:

```bash
crontab -e
```

Tambahkan baris ini (jalan tiap hari jam 02.00):

```
0 2 * * * curl -s -X POST http://localhost:3001/api/cron/cleanup -H "Authorization: Bearer CRON_SECRET_KAMU"
```

Ganti `CRON_SECRET_KAMU` dengan nilai `CRON_SECRET` di file `.env`.
