# SITTA — Sistem TTD Online Penyuluh Pertanian

Aplikasi web untuk penandatanganan dokumen PDF secara elektronik di lingkup kerja penyuluh pertanian tingkat kabupaten.

---

## Fitur

- Upload dokumen PDF berisi placeholder posisi tanda tangan
- Antrian persetujuan oleh Admin/Ketua Tim
- Penempelan gambar TTD otomatis pada posisi placeholder
- Download dokumen hasil TTD
- Log audit setiap aktivitas (upload, ACC, tolak, unduh)
- Tiga role pengguna: Penyuluh, Admin, Superadmin

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend + Backend | Next.js 16 (App Router) |
| Autentikasi | NextAuth.js v5 |
| Database | PostgreSQL 17 + Prisma ORM 7 |
| PDF Stamping | Python 3.11 + PyMuPDF |
| Deploy | Docker + Docker Compose |

---

## Cara Kerja Placeholder

Dokumen PDF harus memuat teks penanda posisi tanda tangan:

```
$(ttd_bupati)
```

Sistem akan otomatis mencari teks ini, menghapusnya, lalu menempelkan gambar TTD tepat di posisi tersebut.

---

## Persiapan Lokal

### Prasyarat

- Node.js 20+
- Python 3.11 + PyMuPDF (`pip install pymupdf`)
- PostgreSQL 17

### 1. Clone & Install

```bash
git clone <repo-url>
cd ttd-superapp
npm install
```

### 2. Konfigurasi Environment

Salin file contoh lalu sesuaikan isinya:

```bash
cp .env.example .env
```

Isi `.env`:

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/ttd_superapp"
NEXTAUTH_SECRET="isi-random-string-panjang-minimal-32-karakter"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Buat Database

```bash
psql -U postgres -c "CREATE DATABASE ttd_superapp;"
```

### 4. Generate Prisma & Migrate

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Jalankan Dev Server

```bash
npm run dev
```

Aplikasi berjalan di **http://localhost:3000**

---

## Setup Akun Pertama

### Daftar akun

Buka `http://localhost:3000/register` dan daftarkan akun.

### Jadikan akun sebagai Admin

Setelah daftar, ubah role lewat psql atau pgAdmin:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'email-admin@contoh.com';
```

Role yang tersedia:

| Role | Akses |
|---|---|
| `PENYULUH` | Upload dokumen, pantau status, unduh hasil |
| `ADMIN` | Semua akses penyuluh + ACC/tolak antrian |
| `SUPERADMIN` | Semua akses + kelola pengguna |

### Upload spesimen TTD Admin

Masuk sebagai Admin, lalu upload file PNG tanda tangan melalui halaman profil.
File PNG sebaiknya memiliki **background transparan** dan ukuran **di bawah 300KB**.

---

## Struktur Folder

```
ttd-superapp/
├── src/
│   ├── app/
│   │   ├── login/              # Halaman login
│   │   ├── register/           # Halaman daftar
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Dashboard statistik
│   │   │   ├── ttd/            # Upload & status dokumen (Penyuluh)
│   │   │   └── antrian/        # ACC / tolak dokumen (Admin)
│   │   └── api/
│   │       ├── auth/           # Login, register endpoint
│   │       └── ttd/            # Upload, list, approve, reject, download
│   ├── components/
│   │   └── Sidebar.tsx         # Navigasi samping
│   ├── lib/
│   │   ├── auth.ts             # Konfigurasi NextAuth
│   │   ├── prisma.ts           # Prisma client
│   │   └── stamp.ts            # Memanggil Python script stamping
│   └── generated/prisma/       # Auto-generated Prisma client
├── scripts/
│   └── stamp_ttd.py            # Script Python stamping TTD
├── prisma/
│   ├── schema.prisma           # Definisi model database
│   └── migrations/             # Riwayat migrasi
├── uploads/
│   ├── originals/              # PDF asli yang diupload
│   └── results/                # PDF hasil TTD
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## API Endpoints

Semua endpoint membutuhkan sesi login (cookie session).

| Method | Endpoint | Akses | Keterangan |
|---|---|---|---|
| `POST` | `/api/auth/register` | Publik | Daftar akun baru |
| `POST` | `/api/auth/signin` | Publik | Login |
| `POST` | `/api/ttd/upload` | Penyuluh+ | Upload PDF |
| `GET` | `/api/ttd/list` | Penyuluh+ | Daftar dokumen |
| `POST` | `/api/ttd/[id]/approve` | Admin+ | ACC dokumen |
| `POST` | `/api/ttd/[id]/reject` | Admin+ | Tolak dokumen |
| `GET` | `/api/ttd/[id]/download` | Penyuluh+ | Unduh PDF ber-TTD |

---

## Deploy ke VPS (Ubuntu 22.04)

### Prasyarat VPS

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

### 1. Upload project ke VPS

```bash
# Via SCP
scp -r ./ttd-superapp user@IP-VPS:/opt/ttd-superapp

# Atau via Git
git clone <repo-url> /opt/ttd-superapp
```

### 2. Buat file .env di VPS

```bash
cd /opt/ttd-superapp
cp .env.example .env
nano .env
```

Isi untuk production:

```env
DATABASE_URL="postgresql://postgres:PASSWORD_KUAT@db:5432/ttd_superapp"
NEXTAUTH_SECRET="random-string-sangat-panjang-dan-aman"
NEXTAUTH_URL="https://domain-kamu.com"
POSTGRES_PASSWORD="PASSWORD_KUAT"
```

### 3. Jalankan Docker

```bash
cd /opt/ttd-superapp
docker compose up -d --build
```

### 4. Migrate database (pertama kali)

```bash
docker compose exec app npx prisma migrate deploy
```

### 5. Setup Nginx sebagai reverse proxy

Buat file `/etc/nginx/sites-available/sitta`:

```nginx
server {
    listen 80;
    server_name domain-kamu.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sitta /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6. HTTPS dengan Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d domain-kamu.com
```

---

## Update Aplikasi di VPS

```bash
cd /opt/ttd-superapp
git pull
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
```

---

## Troubleshooting

**Error: Spesimen TTD admin belum diatur**
Admin harus upload file PNG tanda tangan terlebih dahulu melalui halaman profil.

**Error: Hanya file PDF yang diizinkan**
Pastikan file yang diupload berformat `.pdf`.

**Placeholder tidak terdeteksi**
Pastikan teks di dalam PDF persis `$(ttd_bupati)` — huruf kecil semua, tanpa spasi ekstra.

**Database connection error**
Periksa `DATABASE_URL` di `.env` sudah benar dan PostgreSQL sedang berjalan.

---

## Roadmap

- [ ] Fitur arsip dokumen
- [ ] Upload spesimen TTD lewat UI
- [ ] Notifikasi email saat dokumen di-ACC/tolak
- [ ] Multiple placeholder per dokumen (`$(ttd_sekda)`, `$(stempel)`, dll)
- [ ] Tanda Tangan Elektronik (TTE) tersertifikat BSrE
- [ ] Dashboard laporan & rekap dokumen
