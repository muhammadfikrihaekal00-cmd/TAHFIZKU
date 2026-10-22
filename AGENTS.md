# ATURAN OTOMATISASI WORKFLOW: AUTO-DEPLOY VERCEL

Setiap kali asisten (Antigravity/AI) melakukan perubahan, perbaikan bug, atau penambahan fitur pada codebase ini:

1. **WAJIB Bump Cache Buster**: Naikkan versi query string pada `index.html` (misal dari `?v=4.7` ke `?v=4.8` pada CSS dan seluruh file JS) agar browser pengguna/wali/ustadz tidak tertahan cache lama.
2. **WAJIB Git Auto-Commit & Auto-Push**:
   - Jalankan `git add .`
   - Jalankan `git commit -m "<deskripsi perubahan singkat dan jelas>"`
   - Jalankan `git push origin main`
3. **Konfirmasi ke Pengguna**: Konfirmasikan bahwa kode sudah ter-push ke GitHub dan proses deployment otomatis Vercel sudah aktif.
4. **Tidak boleh meninggalkan perubahan yang belum ter-push** di working tree setelah menyelesaikan permintaan pengguna.
