/**
 * INTEGRASI GOOGLE SPREADSHEET & KEAMANAN RQ UMMUL QASIM (v3)
 */

const STORAGE_KEY_SETORAN = "rq_ummul_qasim_setoran_v3";
const STORAGE_KEY_SETTINGS = "rq_ummul_qasim_settings_v3";
const STORAGE_KEY_SANTRI = "rq_ummul_qasim_santri_v3";
const STORAGE_KEY_AUTH = "rq_ummul_qasim_auth_session_v3";
const STORAGE_KEY_CURRENT_USTADZ = "rq_ummul_qasim_current_ustadz_v3";

const SheetsService = {
  // Autentikasi Ustadz
  getSecurityPin() {
    const settings = this.getSettings();
    return settings.securityPin || DEFAULT_SECURITY_PIN;
  },

  setSecurityPin(newPin) {
    const settings = this.getSettings();
    settings.securityPin = newPin.trim();
    this.saveSettings(settings);
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
    const correctPin = this.getSecurityPin();
    if (enteredPin.trim() === correctPin) {
      localStorage.setItem(STORAGE_KEY_AUTH, "true");
      localStorage.setItem(STORAGE_KEY_CURRENT_USTADZ, ustadzName || MASTER_USTADZ[0]);
      return true;
    }
    return false;
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
      securityPin: DEFAULT_SECURITY_PIN
    };
  },

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
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
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(INITIAL_SETORAN_RECORDS));
    return [...INITIAL_SETORAN_RECORDS];
  },

  // Master Santri & Update Foto
  getAllSantri() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SANTRI);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEY_SANTRI, JSON.stringify(MASTER_SANTRI));
    return [...MASTER_SANTRI];
  },

  addSantri(santri) {
    const santriList = this.getAllSantri();
    santriList.push(santri);
    localStorage.setItem(STORAGE_KEY_SANTRI, JSON.stringify(santriList));
    return santriList;
  },

  updateSantriPhoto(santriId, photoDataUrl) {
    const santriList = this.getAllSantri();
    const found = santriList.find(s => s.id === santriId);
    if (found) {
      found.foto = photoDataUrl;
      localStorage.setItem(STORAGE_KEY_SANTRI, JSON.stringify(santriList));
      return true;
    }
    return false;
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
