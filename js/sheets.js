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
    return (settings.adminPin || settings.securityPin || DEFAULT_SECURITY_PIN).trim();
  },

  getTeacherPin() {
    const settings = this.getSettings();
    return (settings.teacherPin || settings.securityPin || DEFAULT_SECURITY_PIN).trim();
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

  loginUstadz(ustadzName, enteredPin) {
    const cleanPin = (enteredPin || "").trim();
    if (!cleanPin) return false;

    const isTargetAdmin = this.isAdminName(ustadzName);
    const adminPin = this.getAdminPin();
    const teacherPin = this.getTeacherPin();

    if (isTargetAdmin) {
      // Khusus Ustadz M. Fikri Haekal: WAJIB mencocokkan Sandi Admin
      if (cleanPin === adminPin) {
        localStorage.setItem(STORAGE_KEY_AUTH, "true");
        localStorage.setItem(STORAGE_KEY_CURRENT_USTADZ, ustadzName || MASTER_USTADZ[0]);
        return true;
      }
      return false;
    } else {
      // Pengajar lain (Ustadzah): dapat menggunakan Sandi Pengajar ATAU Sandi Admin
      if (cleanPin === teacherPin || cleanPin === adminPin) {
        localStorage.setItem(STORAGE_KEY_AUTH, "true");
        localStorage.setItem(STORAGE_KEY_CURRENT_USTADZ, ustadzName);
        return true;
      }
      return false;
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
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Gagal baca settings:", e);
    }
    return {
      endpointUrl: (typeof DEFAULT_SPREADSHEET_ENDPOINT !== "undefined") ? DEFAULT_SPREADSHEET_ENDPOINT : "",
      securityPin: DEFAULT_SECURITY_PIN,
      adminPin: DEFAULT_SECURITY_PIN,
      teacherPin: DEFAULT_SECURITY_PIN
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

  // Simpan data setoran
  async submitSetoran(record) {
    const localRecords = this.getAllRecords();
    localRecords.unshift(record);
    localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(localRecords));

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
        if (res.data.length > 0) {
          localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(res.data));
        }
        return res.data;
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
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.some(r => r.namaSantri === "Marcel" || r.namaSantri === "Ratu")) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(INITIAL_SETORAN_RECORDS));
    return [...INITIAL_SETORAN_RECORDS];
  },

  // Master Santri, Kelola Santri & Update Foto (Khusus Ustadz M. Fikri Haekal)
  getAllSantri() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SANTRI);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 36 && parsed.some(s => s.nama === "Marcel" || s.nama === "Ratu")) {
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

  deleteRecord(recordId) {
    if (!this.isAdmin()) {
      return { success: false, message: "Akses Ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang menghapus riwayat setoran." };
    }
    let records = this.getAllRecords();
    records = records.filter(r => r.id !== recordId);
    localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(records));
    return { success: true };
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
