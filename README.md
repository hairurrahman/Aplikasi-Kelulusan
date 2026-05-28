# 🎓 Aplikasi Cek Kelulusan SD

Aplikasi mobile-first untuk cek kelulusan siswa SD berbasis React + Firebase.

---

## ✨ Fitur
- 👦 Login siswa via NISN + pilih tahun ajaran
- 🎉 Tampilan hasil kelulusan dengan animasi confetti
- 📊 Nilai per mata pelajaran
- 📄 Download Surat Keterangan Kelulusan (SKL)
- 👨‍💼 Panel admin lengkap (input siswa, nilai, upload SKL)
- ⚙️ Pengaturan nama sekolah & logo
- 📅 Multi tahun ajaran dengan database terpisah
- 📱 Tampilan mobile-first, tema ramah anak SD

---

## 🔥 Setup Firebase

### 1. Buat Akun Admin Pertama
Di Firebase Console → Authentication → Users → Add User

### 2. Firestore Security Rules
Buka Firebase Console → Firestore → Rules, paste ini:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Settings bisa dibaca siapa saja, hanya admin yang bisa edit
    match /settings/{doc} {
      allow read: if true;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // Admin check
    match /admins/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Tahun ajaran - siswa bisa baca, admin bisa tulis
    match /tahunAjaran/{tahun} {
      allow read: if true;
      allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));

      match /siswa/{nisn} {
        allow read: if true;
        allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
      }

      match /nilai/{nisn} {
        allow read: if true;
        allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
      }

      match /dokumen/{nisn} {
        allow read: if true;
        allow write: if request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
      }
    }
  }
}
```

### 3. Firebase Storage Rules
Firebase Console → Storage → Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 4. Daftarkan Admin Pertama
Setelah buat user di Firebase Auth, masuk ke Firestore → Collections → admins → Add Document:
- Document ID: {uid dari Firebase Auth}
- Field: email (string) = email admin kamu
- Field: createdAt (string) = tanggal

---

## 🚀 Cara Push ke GitHub

### Langkah 1: Install Git
Download dari https://git-scm.com

### Langkah 2: Buat Repository di GitHub
1. Buka https://github.com → New repository
2. Nama repo: `aplikasi-kelulusan-sd`
3. Pilih Public atau Private
4. Klik "Create repository"

### Langkah 3: Push dari terminal/CMD

```bash
# Masuk ke folder project
cd kelulusan-sd

# Install dependencies dulu
npm install

# Init git
git init
git add .
git commit -m "🎓 Initial commit: Aplikasi Kelulusan SD"

# Sambungkan ke GitHub (ganti USERNAME dengan username GitHub kamu)
git remote add origin https://github.com/USERNAME/aplikasi-kelulusan-sd.git
git branch -M main
git push -u origin main
```

---

## ☁️ Deploy ke Vercel

### Cara 1: Via Vercel Website (Mudah!)
1. Buka https://vercel.com → Sign up / Login dengan GitHub
2. Klik "New Project"
3. Import repository `aplikasi-kelulusan-sd` dari GitHub
4. Settings sudah otomatis terdeteksi sebagai React app
5. Klik **Deploy** → Tunggu beberapa menit
6. Selesai! Dapat URL seperti `https://aplikasi-kelulusan-sd.vercel.app`

### Cara 2: Via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Build dulu
npm run build

# Deploy
vercel

# Ikuti instruksi:
# - Set up and deploy: Y
# - Which scope: pilih akun kamu
# - Link to existing project: N
# - Project name: aplikasi-kelulusan-sd
# - Directory: ./
# - Override settings: N

# Deploy ke production
vercel --prod
```

### Cara 3: Auto-Deploy
Setelah connect GitHub ke Vercel, setiap `git push` otomatis deploy ulang!

```bash
# Setelah edit kode, tinggal:
git add .
git commit -m "Update fitur"
git push
# Vercel otomatis deploy dalam ~1 menit
```

---

## 📱 Cara Pakai

### Pertama Kali:
1. Buka URL aplikasi
2. Login sebagai Admin
3. Pergi ke **⚙️ Pengaturan** → isi nama sekolah & upload logo
4. Pergi ke **👦 Siswa** → tambah tahun ajaran → input data siswa
5. Pergi ke **📊 Nilai** → input nilai & status kelulusan
6. Pergi ke **📄 Dokumen** → upload file SKL PDF/gambar

### Siswa Cek Kelulusan:
1. Buka URL aplikasi
2. Pilih tab "👦 Siswa"
3. Masukkan NISN
4. Pilih tahun ajaran
5. Klik "Cek Kelulusan" 🎉

---

## 🗂️ Struktur Database Firestore

```
├── settings/
│   └── sekolah { nama, logo }
├── admins/
│   └── {uid} { email, createdAt }
└── tahunAjaran/
    └── {tahun e.g. "2024/2025"}/
        ├── siswa/
        │   └── {nisn} { nama, kelas, jenisKelamin, ttl, namaOrangTua, alamat }
        ├── nilai/
        │   └── {nisn} { mapel: {}, status, rataRata, catatan }
        └── dokumen/
            └── {nisn} { url, fileName, storagePath, uploadedAt }
```

---

## 🛠️ Teknologi
- React 18 + React Router v6
- Firebase v10 (Auth, Firestore, Storage)
- react-hot-toast (notifikasi)
- Font: Fredoka One + Nunito (Google Fonts)
- CSS Variables + Keyframe Animations
