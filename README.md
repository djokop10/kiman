# 🐦 Kicau Mania — Platform Pendaftaran Lomba Burung Kleci

**Kicau Mania** adalah aplikasi web full-stack terintegrasi untuk manajemen pendaftaran lomba burung pleci/kleci, seleksi peserta oleh panitia, verifikasi pembayaran transfer manual, penomoran urut gantangan sequential otomatis, penerbitan surat & tiket resmi PDF (dengan QR Code verifikasi), serta sinkronisasi data secara asynchronous ke **Google Sheets**.

---

## 🚀 Fitur Utama

1. **Formulir Pendaftaran Publik & Auto-Create Akun**:
   - Calon peserta dapat mendaftar dengan memilih Event dan Kelas Lomba.
   - Sistem secara otomatis membuat akun peserta berbasis Nomor HP tanpa perlu input password manual.
   - Login selanjutnya menggunakan **Kode OTP No HP** (disimulasikan dengan antarmuka yang siap dihubungkan ke WhatsApp Gateway seperti Wablas/Fonnte/Twilio).
2. **Dashboard Peserta**:
   - Menampilkan riwayat pendaftaran beserta status pendaftaran real-time.
   - Fitur unggah bukti transfer pembayaran (gambar JPG, PNG, WEBP, atau file PDF).
   - Unduh Surat & Tiket Resmi Lomba (PDF) ber-QR Code setelah pembayaran diverifikasi lunas.
   - Pusat notifikasi dan instruksi dari panitia.
3. **Dashboard Admin (Panitia Seleksi)**:
   - Filter pendaftar berdasarkan Event, Kelas Lomba, dan Status.
   - Aksi **Seleksi**: Menandai peserta *Lolos* atau *Tidak Lolos*. Saat ditandai Lolos, sistem otomatis mengirim pesan instruksi pembayaran.
   - Aksi **Verifikasi Pembayaran**: Melihat bukti transfer, lalu melakukan *Approve* atau *Reject* (dengan catatan alasan penolakan).
4. **Auto-Generate Nomor Urut & Tiket PDF**:
   - Saat admin menyetujui pembayaran, sistem secara otomatis menghasilkan **Nomor Gantangan Sequential** unik per kelas lomba.
   - Otomatis menerbitkan Surat & Tiket Resmi PDF berformat A4 dengan stempel panitia, rincian peserta/lomba, dan QR Code verifikasi.
5. **Dashboard Superadmin**:
   - CRUD Master Event Lomba.
   - CRUD Master Kelas Lomba, Harga Tiket, dan Kuota Gantangan.
   - Kelola Akun Panitia/Admin.
   - Laporan Rekap Pendaftar, Progres Kuota per Kelas, dan Rekap Finansial/Pendapatan.
   - Monitoring antrean sinkronisasi Google Sheets API + Tombol Trigger Sinkronisasi Massal.
6. **Sinkronisasi Google Sheets Asynchronous**:
   - Setiap perubahan status pendaftaran dimasukkan ke antrean job (`SheetSyncQueue`) dan dieksekusi oleh background worker secara non-blocking sehingga performa API tetap responsif.
   - Mode Mock bawaan jika kredensial Google belum disetel, sehingga aplikasi tetap berjalan lancar.

---

## 🔄 Alur State Machine Status Pendaftaran

```
[ Publik Mendaftar ]
        │
        ▼
[ MENUNGGU_SELEKSI ]
   ├── (Admin: Tidak Lolos) ──> [ TIDAK_LOLOS ] (Selesai)
   │
   └── (Admin: Lolos) ───────> [ LOLOS_MENUNGGU_PEMBAYARAN ]
                                       │
                              (Peserta Upload Bukti)
                                       │
                                       ▼
                       [ MENUNGGU_VERIFIKASI_PEMBAYARAN ]
                          ├── (Admin: Reject) ──> [ DITOLAK_UPLOAD_ULANG ]
                          │                              │ (Peserta Upload Ulang)
                          │                              ▼
                          │                     [ MENUNGGU_VERIFIKASI_PEMBAYARAN ]
                          │
                          └── (Admin: Approve) ─> [ LUNAS_TERDAFTAR_RESMI ]
                                                  ├─ Generate Nomor Gantangan Sequential
                                                  ├─ Generate Surat & Tiket PDF (QR Code)
                                                  └─ Async Sync Google Sheets
```

---

## 📁 Struktur Folder Project

```
kiman/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Skema database Prisma (PostgreSQL / SQLite)
│   │   └── seed.ts                # Seeder akun admin, event & kelas lomba
│   ├── src/
│   │   ├── config/                # Konfigurasi env & storage
│   │   ├── controllers/           # Auth, Public, Peserta, Admin, Superadmin
│   │   ├── middleware/            # JWT Auth, Role Guard, Multer Upload
│   │   ├── services/
│   │   │   ├── otp.service.ts     # OTP generator & gateway interface
│   │   │   ├── pdf.service.ts     # Generator tiket PDF & QR Code (PDFKit)
│   │   │   ├── sheet.service.ts   # Google Sheets API v4 Integration
│   │   │   ├── queue.service.ts   # Worker antrean background sync
│   │   │   └── audit.service.ts   # Audit trail log perubahan status
│   │   ├── routes/                # Rute Express REST API
│   │   ├── types/                 # Definisi tipe & enum TypeScript
│   │   ├── app.ts                 # Express setup
│   │   └── server.ts              # Entry point server
│   ├── storage/                   # Folder bukti transfer & file PDF tiket
│   └── tests/                     # Test suite Jest (OTP & End-to-End API Workflow)
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/            # Login Peserta (OTP) & Login Panitia (Email)
│   │   │   ├── daftar/            # Form pendaftaran publik
│   │   │   ├── peserta/           # Dashboard Peserta (History, Upload Bukti, Tiket PDF)
│   │   │   ├── admin/             # Dashboard Admin (Seleksi & Verifikasi)
│   │   │   └── superadmin/        # Dashboard Superadmin (Master Data, Finansial, Sheet Sync)
│   │   ├── components/            # UI components (Navbar, StatusBadge, Modal)
│   │   └── lib/                   # API client & Auth context
│   └── public/
└── README.md
```

---

## 📋 Daftar REST API Endpoints

| Method | Endpoint | Role / Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/auth/otp/request` | Publik | Minta kode OTP via No. HP |
| `POST` | `/api/auth/otp/verify` | Publik | Verifikasi OTP & terbitkan JWT Peserta |
| `POST` | `/api/auth/admin/login` | Publik | Login Panitia/Superadmin dengan Email & Password |
| `GET`  | `/api/auth/me` | Authenticated | Ambil profil user yang sedang login |
| `GET`  | `/api/public/events/active` | Publik | Ambil daftar event aktif beserta kelas & kuota |
| `POST` | `/api/public/pendaftaran` | Publik | Submit formulir pendaftaran lomba |
| `GET`  | `/api/peserta/pendaftaran` | Peserta | Riwayat pendaftaran milik peserta |
| `GET`  | `/api/peserta/pendaftaran/:id` | Peserta | Detail status pendaftaran tertentu |
| `POST` | `/api/peserta/pendaftaran/:id/upload-bukti` | Peserta | Unggah bukti transfer manual (Multipart) |
| `GET`  | `/api/peserta/pendaftaran/:id/surat-pdf` | Peserta | Download file PDF Surat & Tiket Resmi |
| `GET`  | `/api/peserta/notifikasi` | Peserta | Riwayat pesan dan notifikasi peserta |
| `GET`  | `/api/admin/pendaftaran` | Admin / Superadmin | Ambil pendaftar (Filter by event, kelas, status) |
| `GET`  | `/api/admin/pendaftaran/:id` | Admin / Superadmin | Detail pendaftar, file bukti transfer & audit log |
| `POST` | `/api/admin/pendaftaran/:id/seleksi` | Admin / Superadmin | Aksi seleksi: Lolos / Tidak Lolos |
| `POST` | `/api/admin/pendaftaran/:id/verifikasi` | Admin / Superadmin | Verifikasi pembayaran: Approve / Reject |
| `GET`  | `/api/admin/stats` | Admin / Superadmin | Statistik pendaftar per status |
| `GET/POST` | `/api/superadmin/events` | Superadmin | CRUD Master Event Lomba |
| `PUT/DELETE` | `/api/superadmin/events/:id` | Superadmin | Update / Hapus Event |
| `GET/POST` | `/api/superadmin/kelas` | Superadmin | CRUD Master Kelas & Kuota |
| `PUT/DELETE` | `/api/superadmin/kelas/:id` | Superadmin | Update / Hapus Kelas Lomba |
| `GET/POST` | `/api/superadmin/admins` | Superadmin | Kelola Akun Admin / Panitia |
| `DELETE` | `/api/superadmin/admins/:id` | Superadmin | Hapus Akun Admin |
| `GET`  | `/api/superadmin/laporan` | Superadmin | Rekap finansial & data peserta per event |
| `GET`  | `/api/superadmin/sync-sheet/status` | Superadmin | Pantau statistik antrean Google Sheet |
| `POST` | `/api/superadmin/sync-sheet/trigger` | Superadmin | Trigger sinkronisasi massal seluruh data |

---

---

## 🛠️ Cara Menjalankan Aplikasi (Step-by-Step)

Pastikan Anda telah menginstal **Node.js** (v18+) pada komputer Anda.

### 1. Menjalankan Backend (Server REST API)

Buka terminal pertama dan jalankan perintah berikut:

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Install dependensi
npm install

# 3. Inisialisasi database & seed data default (Admin, Superadmin, Event, Kelas)
npx prisma generate
npx prisma db push
npm run prisma:seed

# 4. Jalankan server development
npm run dev
```

> 📡 **Backend API aktif di:** `http://localhost:5001`  
> 📁 **Database lokal:** `backend/prisma/dev.db` (SQLite tanpa perlu install software database eksternal)

---

### 2. Menjalankan Frontend (Next.js Web App)

Buka terminal kedua (jangan tutup terminal backend) dan jalankan:

```bash
# 1. Masuk ke folder frontend
cd frontend

# 2. Install dependensi
npm install

# 3. Jalankan server development
npm run dev
```

> 🌐 **Buka aplikasi di browser:** [http://localhost:3000](http://localhost:3000)

---

### 3. Menjalankan Automated Test (Unit & Integration Tests)

Untuk menjalankan seluruh rangkaian pengujian otomatis Jest (OTP + State Machine + Workflow penuh):

```bash
cd backend
npm test
```

---

## 🔑 Kredensial Default (Testing)

- **Superadmin:**
  - Email: `superadmin@kicaumania.id`
  - Password: `superadmin123`
  - URL Akses: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Admin / Panitia:**
  - Email: `admin@kicaumania.id`
  - Password: `admin123`
  - URL Akses: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Peserta (Login OTP):**
  - Masukkan No. HP apa saja (misal `081234567890`).
  - Kode OTP disimulasikan di konsol backend dan otomatis tertera di box helper halaman login.
  - URL Akses: [http://localhost:3000/login](http://localhost:3000/login) atau daftar di [http://localhost:3000/daftar](http://localhost:3000/daftar)

