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
| Deploy | Node.js 24 + PM2 + Nginx |

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

## Deploy ke VPS

### Prasyarat VPS

VPS harus sudah terinstall:
- Node.js 24
- PostgreSQL 16
- Python 3 + pymupdf
- Nginx
- PM2 (`npm install -g pm2`)

### 1. Clone Repo

```bash
git clone https://github.com/dasx000/SUPERAPP.git
cd SUPERAPP
```

> Repo **private** — saat diminta password, gunakan **Personal Access Token** GitHub.
> Buat di: GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic) → Generate new token → centang `repo`

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database PostgreSQL

Buat database dan set password user `postgres`:

```bash
sudo -u postgres psql
```

Di dalam psql:

```sql
CREATE DATABASE ttd_superapp;
ALTER USER postgres WITH PASSWORD 'PASSWORD_KAMU';
\q
```

### 4. Buat File `.env`

```bash
nano .env
```

Isi dengan nilai yang sesuai:

```env
DATABASE_URL="postgresql://postgres:PASSWORD_KAMU@localhost:5432/ttd_superapp"
NEXTAUTH_SECRET="isi-random-string-panjang-minimal-32-karakter"
NEXTAUTH_URL="http://IP_VPS_KAMU:3001"
AUTH_TRUST_HOST=true
UPLOAD_DIR="./uploads"
CRON_SECRET="isi-random-string-untuk-cron"
```

Simpan: `Ctrl+X` → `Y` → Enter

> `PASSWORD_KAMU` harus sama antara `DATABASE_URL` dan yang di-set ke user postgres.
> `AUTH_TRUST_HOST=true` wajib ada agar NextAuth tidak error saat diakses lewat IP.

### 5. Generate Prisma Client & Build

```bash
npx prisma generate
npm run build
```

### 6. Jalankan Aplikasi

```bash
sh scripts/start.sh
```

Perintah ini akan:
1. Menjalankan migrasi database secara otomatis
2. Menjalankan aplikasi via PM2 di port 3001

Cek status PM2:

```bash
pm2 status
```

Pastikan status kolom `status` menunjukkan `online`.

### 7. Buka Port Firewall

```bash
sudo ufw allow 3001
```

### 8. Buat Akun SUPERADMIN

```bash
npx tsx scripts/create-superadmin.ts
```

Ikuti prompt: masukkan nama, email, dan password.

### 9. Akses Aplikasi

Buka browser:

```
http://IP_VPS_KAMU:3001
```

**Selesai.**

### 10. Auto Start Saat VPS Reboot

```bash
pm2 startup
pm2 save
```

Jalankan perintah yang ditampilkan oleh `pm2 startup` (biasanya dimulai dengan `sudo env PATH=...`).

---

## Update Aplikasi di VPS

Setiap ada perubahan kode:

```bash
git pull
npm install
npx prisma generate
npm run build
sh scripts/start.sh
```

Migrasi database berjalan **otomatis** saat `sh scripts/start.sh` dijalankan.

---

## Perintah Berguna

```bash
# Lihat log aplikasi (live)
pm2 logs superapp

# Cek status aplikasi
pm2 status

# Restart aplikasi
pm2 restart superapp

# Stop aplikasi
pm2 stop superapp

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
│   │   ├── auth.config.ts
│   │   ├── prisma.ts
│   │   └── stamp.ts            # stampPdf (ACC) + stampPreview (upload)
│   └── generated/prisma/       # Auto-generated Prisma client
├── scripts/
│   ├── create-superadmin.ts    # Script buat akun SUPERADMIN
│   ├── stamp_ttd.py            # Script Python stamping TTD
│   └── start.sh                # Migrate DB + start PM2
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── uploads/
│   ├── originals/              # PDF asli (dihapus saat ACC)
│   ├── previews/               # PDF preview contoh TTD (dihapus saat ACC)
│   ├── results/                # PDF ber-TTD (dihapus otomatis 30 hari)
│   └── spesimen/               # Gambar PNG tanda tangan
├── ecosystem.config.js         # Konfigurasi PM2
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

**App tidak bisa diakses dari luar VPS**
```bash
sudo ufw allow 3001
```
Cek juga Security Group / Firewall Rules di panel provider VPS.

**Error `UntrustedHost` di log PM2**
Pastikan `.env` memiliki baris:
```
AUTH_TRUST_HOST=true
```
Lalu restart: `pm2 restart superapp`

**Error autentikasi database (`P1000`)**
Password di `DATABASE_URL` tidak cocok dengan password user postgres. Set ulang:
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'PASSWORD_BARU';"
```
Update juga `DATABASE_URL` di `.env`, lalu restart: `pm2 restart superapp`

**Error `Module not found: @/generated/prisma/client`**
Prisma client belum di-generate. Jalankan:
```bash
npx prisma generate
npm run build
pm2 restart superapp
```

**Lihat log error lengkap**
```bash
pm2 logs superapp --err
```

**Placeholder tidak terdeteksi**
Pastikan teks di dalam PDF persis `$(ttd_katimker)` — huruf kecil semua, tanpa spasi ekstra.

**Spesimen TTD belum diatur**
Admin harus upload file PNG tanda tangan melalui menu Spesimen TTD. Gunakan PNG dengan background transparan, ukuran di bawah 300KB.

**Lupa password SUPERADMIN**
```bash
npx tsx scripts/create-superadmin.ts
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
