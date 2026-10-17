# RQ UMMUL QASIM - PORTAL MUTABA'AH HAFALAN & TILAWAH (FINAL RELEASE)

Aplikasi web mutaba'ah hafalan Al-Qur'an (Tahfidz), Kitab Tamhid, dan Tartil Al-Qur'an yang dirancang khusus untuk **Rumah Qur'an (RQ) Ummul Qasim**.

---

## 🌟 Fitur Utama (Mode Final)

1. **4 Kelas Resmi & 4 Pengajar Resmi**:
   - **Kelas Menengah Ikhwan** — Pengampu: *Ustadz M. Fikri Haekal, C.LQ* (Kategori Menengah)
   - **Kelas Menengah Akhowat** — Pengampu: *Ustadzah A. Lulu Aprilia Latifa* (Kategori Menengah)
   - **Kelas Dasar Ikhwan & Akhowat** — Pengampu: *Ustadzah Ummu Khadijah* (Kategori Dasar)
   - **Kelas Dasar Ikhwan** — Pengampu: *Ustadzah Khirfatul Jannah* (Kategori Dasar)

2. **2 Kategori Capaian Reward Bulanan**:
   - **Kategori Kelas Menengah** (Gabungan Menengah Ikhwan & Akhowat) &rarr; **1 Juara Mendapat Reward**
   - **Kategori Kelas Dasar** (Gabungan Kelas Dasar Ikhwan & Akhowat serta Kelas Dasar Ikhwan) &rarr; **1 Juara Mendapat Reward**

3. **Capaian Bintang Pekanan, Bulanan (Reward) & Akumulasi**:
   - Filter sederhana untuk memantau bintang ananda per pekan berjalan (Senin–Ahad) maupun reward bulanan.
   - Papan peringkat lengkap menampilkan seluruh santri (bukan hanya 1-10) dengan foto dan avatar santri.

4. **Jenjang Tilawah Terpadu**:
   - **Kitab Tamhid** (Dasar): Jilid, Halaman/Bab, Status Lanjut/Ulang/Lulus Naik ke Tartil.
   - **Tartil Al-Qur'an** (Lanjutan): Pilihan Juz & Halaman mushaf (ringkas & praktis).

5. **Folder Hadits Pendek & Do'a Harian (Masing-masing 40 Materi Shahih)**:
   - 40 Hadits Pendek Shahih khusus anak SD lengkap Arab, Latin, Terjemahan, dan Takhrij.
   - 40 Do'a Harian Shahih khusus anak SD lengkap Arab, Latin, Terjemahan, dan Panduan.
   - Tombol salin teks & bagikan ke WhatsApp.

6. **Desain Mobile-First untuk Layar HP Pengajar**:
   - Navigasi bawah *(Mobile Bottom Bar)* dengan tombol input setoran di tengah.
   - Stepper sentuh (`+` dan `−`) serta pintasan cepat (`+5 Ayat`, `+10 Ayat`, `1 Surah Penuh`).
   - Tombol bintang penilaian ekstra besar (44px+) anti salah sentuh.
   - Dukungan *Add to Home screen* untuk tampil fullscreen seperti APK native.

---

## 📊 Cara Menyambungkan Google Spreadsheet (Penyimpanan Realtime untuk Orang Tua)

1. Buka spreadsheet baru di Google Drive: [sheets.new](https://sheets.new)
2. Beri nama spreadsheet Anda, misalnya: `RQ Ummul Qasim - Database Setoran`
3. Klik menu **Ekstensi (Extensions) > Apps Script**
4. Hapus kode bawaan di dalam editor, lalu salin seluruh isi file [`google-apps-script-code.js`](./google-apps-script-code.js) ke dalamnya.
5. Klik ikon **Simpan (Disket 💾)**.
6. Klik tombol biru **Terapkan (Deploy) > Penerapan Baru (New Deployment)**.
7. Pilih jenis **Aplikasi Web (Web App)**:
   - **Deskripsi**: `RQ Ummul Qasim API`
   - **Jalankan sebagai**: `Saya (Email Anda)`
   - **Siapa yang memiliki akses**: **`Siapa saja (Anyone)`** *(PENTING agar aplikasi web bisa mengirim dan membaca data)*.
8. Klik **Terapkan (Deploy)**, berikan izin akses Google akun Anda.
9. Salin **URL Aplikasi Web** yang berakhiran `/exec` (misal: `https://script.google.com/macros/s/.../exec`).
10. Buka aplikasi, masuk sebagai Ustadz (sandi: `1234`), klik ikon ⚙️ di pojok kanan atas, tempelkan URL tersebut lalu klik **Simpan URL**.

> **💡 Tips untuk Realtime Seluruh Perangkat:**
> Anda juga bisa langsung menempelkan URL tersebut ke dalam file `js/data.js` pada baris:
> `const DEFAULT_SPREADSHEET_ENDPOINT = "PASTE_URL_WEB_APP_DI_SINI";`
> Dengan begitu, saat aplikasi dibuka oleh siapapun (termasuk orang tua di rumah melalui Vercel), seluruh perangkat langsung terhubung ke Google Spreadsheet secara otomatis tanpa perlu mengisi pengaturan lagi!

---

## 🚀 Cara Menghubungkan ke GitHub & Vercel (Online 24 Jam)

### Langkah 1: Push ke GitHub
Buka terminal / PowerShell di folder proyek ini:
```bash
git init
git add .
git commit -m "feat: release final RQ Ummul Qasim mutabaah"
git branch -M main
git remote add origin https://github.com/USERNAME-ANDA/rq-ummul-qasim.git
git push -u origin main
```

### Langkah 2: Deploy ke Vercel (1 Menit)
1. Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik tombol **"Add New..." > "Project"**.
3. Pilih repositori **`rq-ummul-qasim`** yang baru saja Anda push.
4. Vercel akan otomatis mendeteksi file `vercel.json` dan file HTML statis.
5. Klik **"Deploy"**.
6. Dalam hitungan detik, aplikasi Anda sudah live di internet dengan link HTTPS gratis, misalnya:
   `https://rq-ummul-qasim.vercel.app`
7. Bagikan link tersebut kepada para ustadz/ah dan seluruh wali santri!

---

## 🔒 Akses Pengajar
- Sandi Pengaman Default: `1234`
- Sandi dapat diubah kapan saja melalui ikon Pengaturan (⚙️).
