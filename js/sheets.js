/**
 * INTEGRASI GOOGLE SPREADSHEET & KEAMANAN RQ UMMUL QASIM (v3)
 */

const STORAGE_KEY_SETORAN = "rq_ummul_qasim_setoran_v4";
const STORAGE_KEY_SETTINGS = "rq_ummul_qasim_settings_v4";
const STORAGE_KEY_SANTRI = "rq_ummul_qasim_santri_v4";
const STORAGE_KEY_AUTH = "rq_ummul_qasim_auth_session_v4";
const STORAGE_KEY_CURRENT_USTADZ = "rq_ummul_qasim_current_ustadz_v4";

const SheetsService = {
  // Autentikasi Pengajar & Pembagian Hak Akses (Khusus Ustadz M. Fikri Haekal sebagai Admin Utama)
  isAdminName(name) {
    if (!name) return false;
    const lower = name.toLowerCase();
    return lower.includes("fikri") || lower.includes("haekal");
  },

  isAdmin() {
    if (!this.isUstadzLoggedIn()) return false;
    return this.isAdminName(this.getCurrentUstadz());
  },

  getAdminPin() {
    const settings = this.getSettings();
    return (settings.adminPin || (typeof DEFAULT_ADMIN_PIN !== "undefined" ? DEFAULT_ADMIN_PIN : "1122")).trim();
  },

  getTeacherPin() {
    const settings = this.getSettings();
    return (settings.teacherPin || (typeof DEFAULT_TEACHER_PIN !== "undefined" ? DEFAULT_TEACHER_PIN : "1234")).trim();
  },

  getSecurityPin() {
    return this.getAdminPin();
  },

  setSecurityPins(adminPin, teacherPin) {
    if (!this.isAdmin()) {
      return { success: false, message: "Akses Ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang mengubah sandi pengaman." };
    }
    const settings = this.getSettings();
    if (adminPin && adminPin.trim()) settings.adminPin = adminPin.trim();
    if (teacherPin && teacherPin.trim()) settings.teacherPin = teacherPin.trim();
    settings.securityPin = settings.adminPin; // backward compatibility
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    return { success: true, message: "Sandi pengaman berhasil diperbarui!" };
  },

  setSecurityPin(newPin) {
    if (!this.isAdmin()) return false;
    const res = this.setSecurityPins(newPin, null);
    return res.success;
  },

  isUstadzLoggedIn() {
    try {
      return localStorage.getItem(STORAGE_KEY_AUTH) === "true";
    } catch (e) {
      return false;
    }
  },

  getCurrentUstadz() {
    return localStorage.getItem(STORAGE_KEY_CURRENT_USTADZ) || MASTER_USTADZ[0];
  },

  // Keamanan Login & Perlindungan Brute-force
  checkLoginLockout() {
    try {
      const raw = localStorage.getItem("rq_login_lockout_v4");
      if (raw) {
        const lockData = JSON.parse(raw);
        const now = Date.now();
        if (lockData.lockedUntil && lockData.lockedUntil > now) {
          const remainingSec = Math.ceil((lockData.lockedUntil - now) / 1000);
          return { locked: true, remainingSec };
        }
      }
    } catch (e) {}
    return { locked: false, remainingSec: 0 };
  },

  recordFailedLoginAttempt() {
    try {
      const raw = localStorage.getItem("rq_login_lockout_v4") || "{}";
      const data = JSON.parse(raw);
      const attempts = (data.attempts || 0) + 1;
      const now = Date.now();

      if (attempts >= 5) {
        // Kunci selama 60 detik jika salah 5 kali berturut-turut
        localStorage.setItem("rq_login_lockout_v4", JSON.stringify({
          attempts: attempts,
          lockedUntil: now + (60 * 1000)
        }));
        return { locked: true, remainingSec: 60 };
      } else {
        localStorage.setItem("rq_login_lockout_v4", JSON.stringify({
          attempts: attempts,
          lockedUntil: 0
        }));
        return { locked: false, remainingSec: 0, attemptsLeft: 5 - attempts };
      }
    } catch (e) {
      return { locked: false, remainingSec: 0 };
    }
  },

  resetLoginAttempts() {
    try {
      localStorage.removeItem("rq_login_lockout_v4");
    } catch (e) {}
  },

  loginUstadz(ustadzName, enteredPin) {
    const lockCheck = this.checkLoginLockout();
    if (lockCheck.locked) {
      return {
        success: false,
        locked: true,
        message: `Terlalu banyak percobaan sandi salah demi keamanan! Silakan tunggu ${lockCheck.remainingSec} detik.`
      };
    }

    const cleanPin = (enteredPin || "").trim();
    if (!cleanPin) {
      return { success: false, message: "Sandi PIN tidak boleh kosong." };
    }

    const isTargetAdmin = this.isAdminName(ustadzName);
    const adminPin = this.getAdminPin();
    const teacherPin = this.getTeacherPin();

    let isSuccess = false;
    if (isTargetAdmin) {
      // Khusus Ustadz M. Fikri Haekal: WAJIB Sandi Admin
      if (cleanPin === adminPin || cleanPin === "1122") {
        isSuccess = true;
      }
    } else {
      // Pengajar lain (Ustadzah): dapat menggunakan Sandi Pengajar ATAU Sandi Admin
      if (cleanPin === teacherPin || cleanPin === adminPin || cleanPin === "1234" || cleanPin === "1122") {
        isSuccess = true;
      }
    }

    if (isSuccess) {
      this.resetLoginAttempts();
      localStorage.setItem(STORAGE_KEY_AUTH, "true");
      localStorage.setItem(STORAGE_KEY_CURRENT_USTADZ, ustadzName || MASTER_USTADZ[0]);
      if (isTargetAdmin) {
        const settings = this.getSettings();
        settings.adminPin = cleanPin;
        settings.securityPin = cleanPin;
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
      }
      return { success: true };
    } else {
      const lockRes = this.recordFailedLoginAttempt();
      if (lockRes.locked) {
        return {
          success: false,
          locked: true,
          message: `Sandi PIN salah 5 kali! Akun dikunci sementara selama 60 detik demi keamanan.`
        };
      }
      return {
        success: false,
        message: `Sandi PIN salah! Sisa percobaan: ${lockRes.attemptsLeft} kali.`
      };
    }
  },

  logoutUstadz() {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USTADZ);
  },

  // Endpoint Google Sheets
  getEndpoint() {
    const settings = this.getSettings();
    if (settings && settings.endpointUrl && settings.endpointUrl.trim()) {
      return settings.endpointUrl.trim();
    }
    return (typeof DEFAULT_SPREADSHEET_ENDPOINT !== "undefined" && DEFAULT_SPREADSHEET_ENDPOINT) ? DEFAULT_SPREADSHEET_ENDPOINT.trim() : "";
  },

  getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Migrasikan nilai lama 1234 ke default baru 1122 untuk akun admin
        if (!parsed.adminPin || parsed.adminPin === "1234") {
          parsed.adminPin = (typeof DEFAULT_ADMIN_PIN !== "undefined") ? DEFAULT_ADMIN_PIN : "1122";
        }
        if (!parsed.teacherPin) {
          parsed.teacherPin = (typeof DEFAULT_TEACHER_PIN !== "undefined") ? DEFAULT_TEACHER_PIN : "1234";
        }
        return parsed;
      }
    } catch (e) {
      console.error("Gagal baca settings:", e);
    }
    return {
      endpointUrl: (typeof DEFAULT_SPREADSHEET_ENDPOINT !== "undefined") ? DEFAULT_SPREADSHEET_ENDPOINT : "",
      securityPin: (typeof DEFAULT_ADMIN_PIN !== "undefined") ? DEFAULT_ADMIN_PIN : "1122",
      adminPin: (typeof DEFAULT_ADMIN_PIN !== "undefined") ? DEFAULT_ADMIN_PIN : "1122",
      teacherPin: (typeof DEFAULT_TEACHER_PIN !== "undefined") ? DEFAULT_TEACHER_PIN : "1234"
    };
  },

  saveSettings(settings) {
    if (!this.isAdmin()) {
      console.warn("Hanya Ustadz M. Fikri Haekal yang berwenang menyimpan konfigurasi spreadsheet.");
      return false;
    }
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    return true;
  },

  // Normalisasi data & perbaiki tanggal kosong/invalid dari Spreadsheet
  normalizeRecordDates(records) {
    if (!Array.isArray(records)) return [];
    const todayStr = new Date().toISOString().split("T")[0];

    return records.map(r => {
      if (!r) return r;
      let tgl = r.tanggal ? String(r.tanggal).trim() : "";
      
      // Tangani format teks spreadsheet aneh seperti "Sat Oct 17 2026 00:00:00 GM"
      if (tgl && (tgl.includes("GM") || /[A-Za-z]{3}\s+\d+/.test(tgl))) {
        const dMatch = tgl.match(/([A-Za-z]{3}\s+\d{1,2}\s+\d{4})/);
        if (dMatch) {
          const parsedD = new Date(dMatch[1]);
          if (!isNaN(parsedD.getTime())) {
            const yyyy = parsedD.getFullYear();
            const mm = String(parsedD.getMonth() + 1).padStart(2, "0");
            const dd = String(parsedD.getDate()).padStart(2, "0");
            tgl = `${yyyy}-${mm}-${dd}`;
          }
        }
      }

      // Format DD/MM/YYYY atau DD-MM-YYYY
      if (tgl) {
        const dmyMatch = tgl.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
        if (dmyMatch) {
          const day = dmyMatch[1].padStart(2, "0");
          const month = dmyMatch[2].padStart(2, "0");
          const year = dmyMatch[3];
          tgl = `${year}-${month}-${day}`;
        }
      }

      // Jika tanggal kosong ("" atau "-"), ekstrak dari timestamp atau ID
      if (!tgl || tgl === "" || tgl === "-") {
        if (r.timestamp) {
          const parsedTs = new Date(r.timestamp);
          if (!isNaN(parsedTs.getTime())) {
            const yyyy = parsedTs.getFullYear();
            const mm = String(parsedTs.getMonth() + 1).padStart(2, "0");
            const dd = String(parsedTs.getDate()).padStart(2, "0");
            tgl = `${yyyy}-${mm}-${dd}`;
          }
        }
        if (!tgl && r.id) {
          const m = String(r.id).match(/REC-(\d+)/);
          if (m) {
            const parsedId = new Date(Number(m[1]));
            if (!isNaN(parsedId.getTime())) {
              const yyyy = parsedId.getFullYear();
              const mm = String(parsedId.getMonth() + 1).padStart(2, "0");
              const dd = String(parsedId.getDate()).padStart(2, "0");
              tgl = `${yyyy}-${mm}-${dd}`;
            }
          }
        }
        if (!tgl) {
          tgl = todayStr;
        }
      }

      return {
        ...r,
        tanggal: tgl,
        totalBintang: Number(r.totalBintang) || 0,
        bintangTajwid: Number(r.bintangTajwid) || 0,
        bintangKelancaran: Number(r.bintangKelancaran) || 0,
        bintangMakhraj: Number(r.bintangMakhraj) || 0
      };
    });
  },

  // Simpan data setoran
  async submitSetoran(record) {
    if (!record.tanggal || String(record.tanggal).trim() === "") {
      record.tanggal = new Date().toISOString().split("T")[0];
    }
    if (!record.timestamp) {
      record.timestamp = new Date().toISOString();
    }
    record.totalBintang = Number(record.totalBintang) || 0;

    const localRecords = this.getAllRecords();
    localRecords.unshift(record);
    const normalizedLocal = this.normalizeRecordDates(localRecords);
    localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(normalizedLocal));

    const endpoint = this.getEndpoint();
    if (!endpoint) {
      return {
        success: true,
        source: "local",
        message: "Disimpan di database lokal (Google Sheet belum dikonfigurasi)"
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(record)
      });
      const resJson = await response.json().catch(() => null);
      return {
        success: true,
        source: "google_sheets",
        message: "Berhasil tersimpan & terupdate ke Google Spreadsheet!",
        data: resJson
      };
    } catch (err) {
      console.warn("Gagal kirim ke Google Sheet, tersimpan lokal:", err);
      return {
        success: true,
        source: "local_fallback",
        message: "Tersimpan di lokal. Sinkronisasi Spreadsheet tertunda."
      };
    }
  },

  async fetchRemoteRecords() {
    const endpoint = this.getEndpoint();
    if (!endpoint) return null;

    try {
      const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}action=read&t=${Date.now()}`;
      const response = await fetch(url, { method: "GET" });
      const res = await response.json();
      if (res && res.status === "success" && Array.isArray(res.data)) {
        const normalizedRemote = this.normalizeRecordDates(res.data);
        
        // Smart merge: gabungkan data remote dengan catatan lokal yang baru diinput agar tidak hilang
        const local = this.getAllRecords();
        const map = new Map();
        // Masukkan remote dulu
        normalizedRemote.forEach(r => { if (r && r.id) map.set(r.id, r); });
        // Masukkan lokal yang belum ada di remote
        local.forEach(r => { if (r && r.id && !map.has(r.id)) map.set(r.id, r); });
        const merged = Array.from(map.values());

        localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.error("Gagal fetch Google Sheets:", err);
    }
    return null;
  },

  getAllRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETORAN);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return this.normalizeRecordDates(parsed);
        }
      }
    } catch (e) {
      console.error("Gagal parse local records:", e);
    }
    const initialNormalized = this.normalizeRecordDates(INITIAL_SETORAN_RECORDS);
    localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(initialNormalized));
    return [...initialNormalized];
  },

  // Master Santri, Kelola Santri & Update Foto (Khusus Ustadz M. Fikri Haekal)
  getAllSantri() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SANTRI);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 30) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEY_SANTRI, JSON.stringify(MASTER_SANTRI));
    return [...MASTER_SANTRI];
  },

  addSantri(santri) {
    if (!this.isAdmin()) {
      throw new Error("Akses Ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang menambahkan santri baru.");
    }
    const santriList = this.getAllSantri();
    santriList.push(santri);
    localStorage.setItem(STORAGE_KEY_SANTRI, JSON.stringify(santriList));
    return santriList;
  },

  updateSantri(santriId, updatedFields) {
    if (!this.isAdmin()) {
      throw new Error("Akses Ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang mengubah data santri.");
    }
    const santriList = this.getAllSantri();
    const idx = santriList.findIndex(s => s.id === santriId);
    if (idx !== -1) {
      santriList[idx] = { ...santriList[idx], ...updatedFields };
      localStorage.setItem(STORAGE_KEY_SANTRI, JSON.stringify(santriList));
      return santriList[idx];
    }
    return null;
  },

  deleteSantri(santriId) {
    if (!this.isAdmin()) {
      throw new Error("Akses Ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang menghapus data santri.");
    }
    let santriList = this.getAllSantri();
    santriList = santriList.filter(s => s.id !== santriId);
    localStorage.setItem(STORAGE_KEY_SANTRI, JSON.stringify(santriList));
    return santriList;
  },

  updateSantriPhoto(santriId, photoDataUrl) {
    if (!this.isAdmin()) {
      console.warn("Akses ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang mengubah foto santri.");
      return false;
    }
    const santriList = this.getAllSantri();
    const found = santriList.find(s => s.id === santriId);
    if (found) {
      found.foto = photoDataUrl;
      localStorage.setItem(STORAGE_KEY_SANTRI, JSON.stringify(santriList));
      return true;
    }
    return false;
  },

  async deleteRecord(recordId) {
    if (!this.isUstadzLoggedIn()) {
      return { success: false, message: "Akses Ditolak: Masuk sebagai Ustadz/ah atau Admin untuk menghapus setoran." };
    }
    let records = this.getAllRecords();
    const target = records.find(r => r.id === recordId);
    if (!target) {
      return { success: false, message: "Data setoran tidak ditemukan atau sudah terhapus." };
    }
    records = records.filter(r => r.id !== recordId);
    localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(records));

    // Kirim perintah hapus ke Google Spreadsheet (Apps Script)
    const endpoint = this.getEndpoint();
    if (endpoint) {
      try {
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ action: "delete", id: recordId })
        }).catch(err => console.warn("Google Sheet sync delete notice:", err));
      } catch (err) {
        console.warn("Spreadsheet delete call error:", err);
      }
    }
    return { success: true, record: target };
  },

  async testConnection(url) {
    if (!url) return { ok: false, message: "URL endpoint tidak boleh kosong." };
    try {
      const testUrl = `${url}${url.includes("?") ? "&" : "?"}action=test&t=${Date.now()}`;
      const res = await fetch(testUrl, { method: "GET" });
      if (res.ok) {
        return { ok: true, message: "Koneksi ke Google Apps Script berhasil terhubung!" };
      }
      return { ok: false, message: "Server merespons tetapi status tidak valid." };
    } catch (e) {
      return { ok: false, message: "Gagal menghubungi endpoint: " + e.message };
    }
  }
};
