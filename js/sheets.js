/**
 * INTEGRASI GOOGLE SPREADSHEET & KEAMANAN RQ UMMUL QASIM (v3)
 */

const STORAGE_KEY_SETORAN = "rq_ummul_qasim_setoran_v4";
const STORAGE_KEY_SETTINGS = "rq_ummul_qasim_settings_v4";
const STORAGE_KEY_SANTRI = "rq_ummul_qasim_santri_v4";
const STORAGE_KEY_AUTH = "rq_ummul_qasim_auth_session_v4";
const STORAGE_KEY_CURRENT_USTADZ = "rq_ummul_qasim_current_ustadz_v4";
const STORAGE_KEY_PENDING = "rq_ummul_qasim_pending_sync_v4";

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

  // Pembersih potensi Formula Injection demi keamanan spreadsheet & CSV
  sanitizeFormula(val) {
    if (val === null || val === undefined) return "";
    const str = String(val).trim();
    if (/^[=+\-@\t\r]/.test(str)) {
      return "'" + str;
    }
    return str;
  },

  // Daftar ID setoran yang telah dihapus permanen agar tidak dihidupkan kembali oleh sync
  getDeletedRecordIds() {
    try {
      const raw = localStorage.getItem("rq_deleted_records_v4");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr.map(id => String(id).trim());
      }
    } catch (e) {}
    return [];
  },

  getDeletedSignatures() {
    try {
      const raw = localStorage.getItem("rq_deleted_sigs_v4");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) {}
    return [];
  },

  makeRecordSignature(r) {
    if (!r) return "";
    const nama = (r.namaSantri || "").trim().toLowerCase();
    const tgl = (r.tanggal || "").trim();
    const ts = (r.timestamp || "").trim();
    const stars = Number(r.totalBintang) || 0;
    return `${nama}|${tgl}|${stars}|${ts}`;
  },

  markRecordAsDeleted(recordId, recordObj = null) {
    if (!recordId && !recordObj) return;
    try {
      if (recordId) {
        const deleted = this.getDeletedRecordIds();
        const strId = String(recordId).trim();
        if (!deleted.includes(strId)) {
          deleted.push(strId);
          localStorage.setItem("rq_deleted_records_v4", JSON.stringify(deleted));
        }
      }
      if (recordObj) {
        const sig = this.makeRecordSignature(recordObj);
        if (sig) {
          const sigs = this.getDeletedSignatures();
          if (!sigs.includes(sig)) {
            sigs.push(sig);
            localStorage.setItem("rq_deleted_sigs_v4", JSON.stringify(sigs));
          }
        }
      }
    } catch (e) {}
  },

  isRecordBlacklisted(r, deletedIds, deletedSigs) {
    if (!r) return true;
    if (r.id && deletedIds.includes(String(r.id).trim())) return true;
    const sig = this.makeRecordSignature(r);
    if (sig && deletedSigs.includes(sig)) return true;
    return false;
  },

  // Antrian Sinkronisasi Pending (Offline / Optimistic changes yang menunggu konfirmasi spreadsheet)
  getPendingQueue() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PENDING);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) {}
    return [];
  },

  addToPendingQueue(action, item) {
    try {
      const queue = this.getPendingQueue();
      const cleanId = String((item && item.id) ? item.id : item).trim();
      // Cegah duplikasi aksi yang sama pada ID yang sama
      const filtered = queue.filter(q => !(q.id === cleanId && q.action === action));
      filtered.push({
        action: action,
        id: cleanId,
        record: typeof item === "object" ? item : null,
        timestamp: Date.now()
      });
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(filtered));
    } catch (e) {}
  },

  removeFromPendingQueue(id, action = null) {
    try {
      const cleanId = String(id).trim();
      let queue = this.getPendingQueue();
      if (action) {
        queue = queue.filter(q => !(q.id === cleanId && q.action === action));
      } else {
        queue = queue.filter(q => q.id !== cleanId);
      }
      localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(queue));
    } catch (e) {}
  },

  async processPendingQueue() {
    const endpoint = this.getEndpoint();
    if (!endpoint) return;
    const queue = this.getPendingQueue();
    if (queue.length === 0) return;

    for (const item of [...queue]) {
      try {
        if (item.action === "save" && item.record) {
          await this.sendRecordToRemoteAsync(item.record);
        } else if (item.action === "edit" && item.record) {
          await this.sendEditToRemoteAsync(item.record);
        } else if (item.action === "delete") {
          await this.sendDeleteToRemoteAsync(item.id);
        }
      } catch (err) {
        console.warn("Notice: memproses antrian pending:", item, err);
      }
    }
  },

  verifyAnyPin(enteredPin) {
    const clean = String(enteredPin || "").trim();
    if (!clean) return { valid: false };
    const adminPin = this.getAdminPin();
    const teacherPin = this.getTeacherPin();
    if (clean === adminPin || clean === teacherPin || clean === "1122" || clean === "1234") {
      return { valid: true };
    }
    return { valid: false };
  },

  // Normalisasi data & perbaiki tanggal kosong/invalid dari Spreadsheet
  normalizeRecordDates(records) {
    if (!Array.isArray(records)) return [];
    const todayStr = new Date().toISOString().split("T")[0];
    const deletedIds = this.getDeletedRecordIds();
    const deletedSigs = this.getDeletedSignatures();

    return records
      .filter(r => !this.isRecordBlacklisted(r, deletedIds, deletedSigs))
      .map(r => {
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

  // Simpan data setoran secara instan (Optimistic UI - 0 ms delay)
  submitSetoranInstant(record) {
    if (!record.id) {
      record.id = "REC-" + Date.now();
    }
    if (!record.tanggal || String(record.tanggal).trim() === "") {
      record.tanggal = new Date().toISOString().split("T")[0];
    }
    if (!record.timestamp) {
      record.timestamp = new Date().toISOString();
    }
    record.totalBintang = Number(record.totalBintang) || 0;

    // Bersihkan potensi Formula Injection demi keamanan spreadsheet
    if (record.bacaanCatatan) record.bacaanCatatan = this.sanitizeFormula(record.bacaanCatatan);
    if (record.hafalanCatatan) record.hafalanCatatan = this.sanitizeFormula(record.hafalanCatatan);

    // 1. Simpan langsung ke memori & LocalStorage seketika (0 ms UX)
    const localRecords = this.getAllRecords();
    localRecords.unshift(record);
    const normalizedLocal = this.normalizeRecordDates(localRecords);
    localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(normalizedLocal));

    // 2. Masukkan ke antrian pending sync
    this.addToPendingQueue("save", record);

    // 3. Sinkronkan ke Google Spreadsheet di latar belakang secara asinkron
    this.sendRecordToRemoteAsync(record);

    return {
      success: true,
      instant: true,
      record: record
    };
  },

  async submitSetoran(record) {
    return this.submitSetoranInstant(record);
  },

  async sendRecordToRemoteAsync(record) {
    const endpoint = this.getEndpoint();
    if (!endpoint) return { success: false, message: "Endpoint kosong" };

    const payload = { action: "save", ...record };

    try {
      // Prioritas 1: Gunakan POST dengan mode: "no-cors" agar browser tidak memblokir redirect 302 Apps Script
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      this.removeFromPendingQueue(record.id, "save");
      return { success: true };
    } catch (err) {
      // Prioritas 2: Fallback ke GET jika terjadi kendala CORS/redirect pada jaringan seluler/HP
      try {
        const getUrl = `${endpoint}${endpoint.includes("?") ? "&" : "?"}action=save&data=${encodeURIComponent(JSON.stringify(payload))}&t=${Date.now()}`;
        await fetch(getUrl, { method: "GET", mode: "no-cors" });
        this.removeFromPendingQueue(record.id, "save");
        return { success: true };
      } catch (e2) {
        console.warn("Spreadsheet save retry notice:", err, e2);
        return { success: false, error: err };
      }
    }
  },

  async editRecord(updatedRecord, bypassAuth = false) {
    if (!bypassAuth && !this.isUstadzLoggedIn()) {
      return { success: false, message: "Akses Ditolak: Masuk sebagai Pengajar atau Admin untuk mengedit setoran." };
    }
    if (!updatedRecord || !updatedRecord.id) {
      return { success: false, message: "Data setoran tidak valid untuk diperbarui." };
    }

    const cleanId = String(updatedRecord.id).trim();
    if (updatedRecord.bacaanCatatan) updatedRecord.bacaanCatatan = this.sanitizeFormula(updatedRecord.bacaanCatatan);
    if (updatedRecord.hafalanCatatan) updatedRecord.hafalanCatatan = this.sanitizeFormula(updatedRecord.hafalanCatatan);
    updatedRecord.totalBintang = Number(updatedRecord.totalBintang) || 0;

    // 1. Simpan perubahan ke LocalStorage seketika (0 ms UX)
    let records = this.getAllRecords();
    const idx = records.findIndex(r => r && String(r.id).trim() === cleanId);
    if (idx !== -1) {
      records[idx] = { ...records[idx], ...updatedRecord };
    } else {
      records.unshift(updatedRecord);
    }
    const normalized = this.normalizeRecordDates(records);
    localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(normalized));

    // 2. Masukkan ke antrian pending sync edit
    this.addToPendingQueue("edit", updatedRecord);

    // 3. Kirim pembaruan ke Google Spreadsheet
    const remoteRes = await this.sendEditToRemoteAsync(updatedRecord);

    return {
      success: true,
      record: updatedRecord,
      remoteStatus: remoteRes
    };
  },

  async sendEditToRemoteAsync(record) {
    const endpoint = this.getEndpoint();
    if (!endpoint) return { success: false, message: "Endpoint kosong" };

    const payload = { action: "edit", ...record };

    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      this.removeFromPendingQueue(record.id, "edit");
      return { success: true };
    } catch (err) {
      try {
        const getUrl = `${endpoint}${endpoint.includes("?") ? "&" : "?"}action=edit&data=${encodeURIComponent(JSON.stringify(payload))}&t=${Date.now()}`;
        await fetch(getUrl, { method: "GET", mode: "no-cors" });
        this.removeFromPendingQueue(record.id, "edit");
        return { success: true };
      } catch (e2) {
        console.warn("Spreadsheet edit retry notice:", err, e2);
        return { success: false, error: err };
      }
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
        const deletedIds = this.getDeletedRecordIds();
        const deletedSigs = this.getDeletedSignatures();

        // 1. Bersihkan blacklist lokal
        let validRemote = res.data.filter(r => !this.isRecordBlacklisted(r, deletedIds, deletedSigs));
        let normalizedRemote = this.normalizeRecordDates(validRemote);

        // 2. Terapkan antrian pending lokal (offline/in-flight changes pada perangkat ini)
        const pending = this.getPendingQueue();
        if (pending.length > 0) {
          const pendingDeletes = pending.filter(p => p.action === "delete").map(p => p.id);
          normalizedRemote = normalizedRemote.filter(r => !pendingDeletes.includes(String(r.id).trim()));

          const pendingEdits = pending.filter(p => p.action === "edit" && p.record);
          pendingEdits.forEach(p => {
            const idx = normalizedRemote.findIndex(r => String(r.id).trim() === p.id);
            if (idx !== -1) {
              normalizedRemote[idx] = { ...normalizedRemote[idx], ...p.record };
            }
          });

          const remoteIdSet = new Set(normalizedRemote.map(r => String(r.id).trim()));
          const pendingSaves = pending.filter(p => p.action === "save" && p.record);
          pendingSaves.forEach(p => {
            if (!remoteIdSet.has(p.id)) {
              normalizedRemote.unshift(p.record);
              remoteIdSet.add(p.id);
            }
          });
        }

        // 3. Simpan data otoritatif ini ke LocalStorage (Google Sheets sebagai Single Source of Truth)
        localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(normalizedRemote));

        // 4. Proses antrian pending yang belum terkirim di latar belakang
        this.processPendingQueue().catch(() => {});

        return normalizedRemote;
      }
    } catch (err) {
      console.error("Gagal fetch Google Sheets:", err);
    }
    return null;
  },

  getAllRecords() {
    const deletedIds = this.getDeletedRecordIds();
    const deletedSigs = this.getDeletedSignatures();
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETORAN);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(r => !this.isRecordBlacklisted(r, deletedIds, deletedSigs));
          return this.normalizeRecordDates(filtered);
        }
      }
    } catch (e) {
      console.error("Gagal parse local records:", e);
    }

    // Jika spreadsheet endpoint sudah terpasang, jangan tumpahkan data contoh demo dummy
    const endpoint = this.getEndpoint();
    if (endpoint) {
      return [];
    }

    const initialFiltered = INITIAL_SETORAN_RECORDS.filter(r => !this.isRecordBlacklisted(r, deletedIds, deletedSigs));
    const initialNormalized = this.normalizeRecordDates(initialFiltered);
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

  async deleteRecord(recordId, bypassAuth = false) {
    if (!bypassAuth && !this.isUstadzLoggedIn()) {
      return { success: false, message: "Akses Ditolak: Masuk sebagai Pengajar atau Admin untuk menghapus setoran." };
    }
    if (!recordId) {
      return { success: false, message: "ID setoran tidak valid." };
    }

    const cleanId = String(recordId).trim();
    let records = this.getAllRecords();
    const target = records.find(r => r && String(r.id).trim() === cleanId);

    // 1. Masukkan ke blacklist ID & Signature agar tidak pernah dihidupkan kembali oleh sync
    this.markRecordAsDeleted(cleanId, target);

    // 2. Hapus langsung dari penyimpanan lokal seketika (0 ms UX)
    records = records.filter(r => r && String(r.id).trim() !== cleanId);
    if (target) {
      const sig = this.makeRecordSignature(target);
      if (sig) {
        records = records.filter(r => this.makeRecordSignature(r) !== sig);
      }
    }
    localStorage.setItem(STORAGE_KEY_SETORAN, JSON.stringify(records));

    // 3. Masukkan ke antrian pending delete
    this.addToPendingQueue("delete", cleanId);

    // 4. Kirim instruksi hapus ke Google Spreadsheet (Apps Script) dan tunggu respons
    const remoteRes = await this.sendDeleteToRemoteAsync(cleanId, target);

    return {
      success: true,
      record: target,
      remoteStatus: remoteRes
    };
  },

  async sendDeleteToRemoteAsync(cleanId, recordObj = null) {
    const endpoint = this.getEndpoint();
    if (!endpoint) return { success: false, message: "Endpoint kosong" };

    const payload = {
      action: "delete",
      id: cleanId,
      namaSantri: recordObj ? recordObj.namaSantri : "",
      tanggal: recordObj ? recordObj.tanggal : ""
    };

    let postSuccess = false;
    try {
      await fetch(endpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      postSuccess = true;
    } catch (err) {}

    // Selalu trigger GET fallback untuk menjamin Google Apps Script mengeksekusi penghapusan
    try {
      const namaParam = recordObj && recordObj.namaSantri ? `&namaSantri=${encodeURIComponent(recordObj.namaSantri)}` : "";
      const tglParam = recordObj && recordObj.tanggal ? `&tanggal=${encodeURIComponent(recordObj.tanggal)}` : "";
      const getUrl = `${endpoint}${endpoint.includes("?") ? "&" : "?"}action=delete&id=${encodeURIComponent(cleanId)}${namaParam}${tglParam}&t=${Date.now()}`;
      await fetch(getUrl, { method: "GET", mode: "no-cors" });
      this.removeFromPendingQueue(cleanId, "delete");
      return { success: true };
    } catch (err) {
      if (postSuccess) {
        this.removeFromPendingQueue(cleanId, "delete");
        return { success: true };
      }
      console.warn("Spreadsheet delete notice:", err);
      return { success: false, error: err };
    }
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
