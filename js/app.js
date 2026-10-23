/**
 * =======================================================================
 * RQ UMMUL QASIM - CONTROLLER TERPADU (v4)
 * 4 Kelas Resmi & 4 Pengajar Resmi
 * 2 Kategori Capaian Reward (1 Reward Menengah & 1 Reward Dasar)
 * Nomor Urut Saja (Tanpa Kode/NIS) & Perbaikan Tambah Santri
 * =======================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

const CLASS_TEACHER_MAP = {
  "Kelas Dasar Ikhwan & Akhowat": { ustadz: "Ustadzah Ummu Khadijah", kategori: "Dasar" },
  "Kelas Dasar Ikhwan": { ustadz: "Ustadzah Khirfatul Jannah", kategori: "Dasar" },
  "Kelas Menengah Ikhwan": { ustadz: "Ustadz M. Fikri Haekal, C.LQ", kategori: "Menengah" },
  "Kelas Menengah Akhowat": { ustadz: "Ustadzah A. Lulu Aprilia Latifa", kategori: "Menengah" },
  // Backward compatibility:
  "Kelas Dasar 1": { ustadz: "Ustadzah Ummu Khadijah", kategori: "Dasar" },
  "Kelas Dasar 2": { ustadz: "Ustadzah Khirfatul Jannah", kategori: "Dasar" }
};

// Fungsi Sanitasi HTML Universal (Mencegah XSS - Cross-Site Scripting)
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const App = {
  currentCategoryFilter: "Menengah", // Default ke Menengah atau Dasar
  currentPeriodFilter: "pekanan", // Default ke Capaian Bintang Pekanan (Simpel)
  currentParentClassFilter: "ALL", // Filter pemisah pantauan kelas di Portal Pantauan Anak
  haditsFilterCategory: "Semua",
  doaFilterCategory: "Semua",
  targetPhotoSantriId: null,

  ratings: {
    tajwid: 5,
    kelancaran: 5,
    makhraj: 5
  },

  init() {
    this.initDateTime();
    this.populateStaticDropdowns();
    this.setupAuthentication();
    this.setupTabNavigation();
    this.setupStageSwitch();
    this.setupStarRatings();
    this.setupPillToggles();
    this.setupFormSubmit();
    this.setupPeriodFilter();
    this.setupLeaderboard();
    this.setupCategoryFilter();
    this.setupParentPortal();
    this.setupHaditsModule();
    this.setupDoaModule();
    this.setupSettingsModal();
    this.setupAddSantriModal();
    this.setupEditSantriModal();
    this.setupPhotoUpload();
    this.setupHistoryNavigation();
    this.setupReportExportModule();
    this.setupRecentSetoranModal();
    this.updateSheetsStatusIndicator();

    this.tryBackgroundRemoteSync();
    this.startRealtimePolling();
  },

  initDateTime() {
    const inputTanggal = document.getElementById("inputTanggal");
    const today = new Date().toISOString().split("T")[0];
    if (inputTanggal) {
      inputTanggal.value = today;
    }
    const badge = document.getElementById("formCurrentDateBadge");
    if (badge) {
      const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      badge.textContent = new Date().toLocaleDateString('id-ID', options);
    }
  },

  // 1. Autentikasi Pengajar & Panel Login (Seperti Gambar 2)
  setupAuthentication() {
    const btnAuthToggle = document.getElementById("btnAuthToggle");
    const loginPortal = document.getElementById("loginPortalScreen");
    const formPortalLogin = document.getElementById("formPortalLogin");
    const portalSelectUstadz = document.getElementById("portalSelectUstadz");
    const portalInputPin = document.getElementById("portalInputPin");
    const portalBtnToggleEye = document.getElementById("portalBtnToggleEye");
    const portalBtnParentMode = document.getElementById("portalBtnParentMode");
    const portalBtnClose = document.getElementById("portalBtnClose");

    // Tampilkan 4 Pengajar Resmi di Select Portal
    if (portalSelectUstadz) {
      portalSelectUstadz.innerHTML = `<option value="">-- Pilih Profil Anda --</option>`;
      MASTER_USTADZ.forEach(u => {
        portalSelectUstadz.add(new Option(u, u));
      });
      portalSelectUstadz.value = SheetsService.getCurrentUstadz();
    }

    // Cek Status Login Saat Ini
    if (SheetsService.isUstadzLoggedIn()) {
      this.setAuthState(true, SheetsService.getCurrentUstadz());
      if (loginPortal) loginPortal.classList.remove("active");
    } else {
      this.setAuthState(false);
      // Buka Panel Login pada awal akses (Sesuai Gambar 2)
      if (loginPortal) loginPortal.classList.add("active");
    }

    // Toggle Tampilkan / Sembunyikan PIN (Ikon Mata)
    if (portalBtnToggleEye && portalInputPin) {
      portalBtnToggleEye.addEventListener("click", () => {
        if (portalInputPin.type === "password") {
          portalInputPin.type = "text";
          portalBtnToggleEye.textContent = "🙈";
        } else {
          portalInputPin.type = "password";
          portalBtnToggleEye.textContent = "👁️";
        }
      });
    }

    // Tombol Pantau Hafalan Anak (Mode Wali Santri - Tanpa Sandi)
    if (portalBtnParentMode) {
      portalBtnParentMode.addEventListener("click", () => {
        if (loginPortal) loginPortal.classList.remove("active");
        this.setAuthState(false);
        this.switchTab("tab-wali");
        this.showToast("Masuk sebagai Wali Santri. Selamat memantau ananda 👨‍👩‍👦", "info");
      });
    }

    // Tombol Tutup Panel
    if (portalBtnClose) {
      portalBtnClose.addEventListener("click", () => {
        if (loginPortal) loginPortal.classList.remove("active");
      });
    }

    // Tombol Header: Buka Login Panel atau Logout
    if (btnAuthToggle) {
      btnAuthToggle.addEventListener("click", () => {
        if (SheetsService.isUstadzLoggedIn()) {
          const roleLabel = SheetsService.isAdmin() ? "Admin Utama (Ustadz M. Fikri Haekal)" : "Pengajar";
          if (confirm(`Kunci kembali akses ${roleLabel} dan kembali ke Mode Wali Santri?`)) {
            SheetsService.logoutUstadz();
            this.setAuthState(false);
            this.showToast(`Akses ${roleLabel} telah dikunci 🔒`, "success");
            if (loginPortal) {
              if (portalInputPin) portalInputPin.value = "";
              loginPortal.classList.add("active");
            }
          }
        } else {
          if (loginPortal) {
            if (portalInputPin) portalInputPin.value = "";
            loginPortal.classList.add("active");
            setTimeout(() => portalInputPin && portalInputPin.focus(), 250);
          }
        }
      });
    }

    // Submit Form Login Pengajar
    if (formPortalLogin) {
      formPortalLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        const ustadzName = portalSelectUstadz ? portalSelectUstadz.value : "";
        const pin = portalInputPin ? portalInputPin.value : "";

        if (!ustadzName) {
          this.showToast("Silakan pilih profil pengajar terlebih dahulu!", "error");
          return;
        }

        const loginRes = SheetsService.loginUstadz(ustadzName, pin);
        if (loginRes && loginRes.success) {
          this.setAuthState(true, ustadzName);
          if (loginPortal) loginPortal.classList.remove("active");
          const isAdmin = SheetsService.isAdmin();
          if (isAdmin) {
            this.showToast(`Ahlan wa Sahlan, ${ustadzName}! Akses Admin Utama aktif 👑`, "success");
          } else {
            this.showToast(`Ahlan wa Sahlan, ${ustadzName}! Akses Pengajar aktif 📖`, "success");
          }
          
          // Cari kelas yang diampu pengajar ini dan set otomatis
          const foundClass = Object.keys(CLASS_TEACHER_MAP).find(k => CLASS_TEACHER_MAP[k].ustadz === ustadzName);
          const selectHalaqah = document.getElementById("selectHalaqah");
          const inputUstadz = document.getElementById("inputUstadz");

          if (selectHalaqah && foundClass) {
            selectHalaqah.value = foundClass;
            this.filterSantriByHalaqah(foundClass);
          }
          if (inputUstadz) {
            inputUstadz.value = ustadzName;
          }

          this.switchTab("tab-input");
        } else {
          const errMsg = (loginRes && loginRes.message) ? loginRes.message : "Kata sandi salah! Silakan periksa kembali sandi Anda.";
          this.showToast(errMsg, "error");
          if (portalInputPin) {
            portalInputPin.select();
          }
        }
      });
    }
  },

  setAuthState(isUstadz, ustadzName = "") {
    const authIcon = document.getElementById("authIcon");
    const authLabel = document.getElementById("authLabel");
    const btnAuth = document.getElementById("btnAuthToggle");
    const ustadzFeatures = document.querySelectorAll(".ustadz-feature");
    const headerTeacherText = document.getElementById("headerTeacherText");
    const btnQuickAddSantri = document.getElementById("btnQuickAddSantri");
    const btnParentEditSantri = document.getElementById("btnParentEditSantri");

    const isAdmin = isUstadz && SheetsService.isAdmin();

    if (isUstadz) {
      document.body.classList.add("is-ustadz");
      if (isAdmin) {
        document.body.classList.add("is-admin");
      } else {
        document.body.classList.remove("is-admin");
      }

      if (authIcon) authIcon.textContent = isAdmin ? "👑" : "🔓";
      if (authLabel) authLabel.textContent = isAdmin ? "Keluar (Admin)" : "Keluar (Pengajar)";
      if (btnAuth) {
        btnAuth.classList.add("logged-in");
        if (isAdmin) {
          btnAuth.classList.add("admin-badge");
          btnAuth.title = "Login sebagai Admin Utama (Ustadz M. Fikri Haekal)";
        } else {
          btnAuth.classList.remove("admin-badge");
          btnAuth.title = "Login sebagai Pengajar";
        }
      }
      
      if (headerTeacherText) {
        headerTeacherText.textContent = isAdmin 
          ? `${ustadzName || "Ustadz M. Fikri Haekal"} (Admin Utama 👑)`
          : `${ustadzName || "Pengampu RQ"} (Pengajar 📖)`;
      }

      ustadzFeatures.forEach(el => {
        if (el.classList.contains("admin-only-feature")) {
          el.style.display = isAdmin ? "inline-flex" : "none";
        } else {
          el.style.display = "inline-flex";
        }
      });

      if (btnQuickAddSantri) {
        btnQuickAddSantri.style.display = isAdmin ? "inline-flex" : "none";
      }
      if (btnParentEditSantri) {
        btnParentEditSantri.style.display = isAdmin ? "inline-flex" : "none";
      }

      // Sinkronkan kategori default leaderboard sesuai pengajar yang login
      const uName = ustadzName || "";
      if (uName.includes("Khadijah") || uName.includes("Khirfatul")) {
        this.currentCategoryFilter = "Dasar";
      } else if (uName.includes("Fikri") || uName.includes("Lulu")) {
        this.currentCategoryFilter = "Menengah";
      }
      const catBtns = document.querySelectorAll(".category-filter-btn");
      catBtns.forEach(b => {
        if (b.dataset.kategori === this.currentCategoryFilter) b.classList.add("active");
        else b.classList.remove("active");
      });

    } else {
      document.body.classList.remove("is-ustadz");
      document.body.classList.remove("is-admin");
      if (authIcon) authIcon.textContent = "🔒";
      if (authLabel) authLabel.textContent = "Masuk Ustadz/ah";
      if (btnAuth) {
        btnAuth.classList.remove("logged-in");
        btnAuth.classList.remove("admin-badge");
        btnAuth.title = "Beralih peran Ustadz / Wali Santri";
      }
      if (headerTeacherText) headerTeacherText.textContent = "Portal Mutaba'ah & Kontrol Hafalan";
      ustadzFeatures.forEach(el => el.style.display = "none");
      if (btnQuickAddSantri) {
        btnQuickAddSantri.style.display = "none";
      }
      if (btnParentEditSantri) {
        btnParentEditSantri.style.display = "none";
      }
    }
  },

  switchTab(targetId, shouldPushState = true) {
    const tabButtons = document.querySelectorAll(".tab-btn, .mobile-nav-item");
    const panels = document.querySelectorAll(".tab-panel");

    tabButtons.forEach(b => {
      if (b.dataset.tab === targetId) b.classList.add("active");
      else b.classList.remove("active");
    });

    panels.forEach(p => {
      if (p.id === targetId) p.classList.add("active");
      else p.classList.remove("active");
    });

    if (shouldPushState) {
      try {
        history.pushState({ screen: "tab", tab: targetId }, "");
      } catch (e) {}
    }

    if (targetId === "tab-leaderboard") {
      this.renderLeaderboard();
      this.tryBackgroundRemoteSync();
    } else if (targetId === "tab-wali") {
      this.renderParentPortal();
      this.tryBackgroundRemoteSync();
    } else if (targetId === "tab-hadits") {
      this.renderHaditsList();
    } else if (targetId === "tab-doa") {
      this.renderDoaList();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  setupTabNavigation() {
    const tabButtons = document.querySelectorAll(".tab-btn, .mobile-nav-item");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.tab;
        
        if (targetId === "tab-input" && !SheetsService.isUstadzLoggedIn()) {
          const loginPortal = document.getElementById("loginPortalScreen");
          if (loginPortal) loginPortal.classList.add("active");
          return;
        }

        this.switchTab(targetId);
      });
    });
  },

  // =======================================================================
  // FITUR PINTASAN & TOUCH STEPPER KHUSUS PENGAJAR DI HP
  // =======================================================================
  adjustAyat(inputId, delta) {
    const el = document.getElementById(inputId);
    if (!el) return;
    let val = parseInt(el.value, 10) || 1;
    val += delta;
    if (val < 1) val = 1;

    // Batasi maksimum ayat berdasarkan surah yang dipilih
    const surahAwalEl = document.getElementById("selectSurahAwal");
    const surahAkhirEl = document.getElementById("selectSurahAkhir");
    const surahName = (inputId === "inputAyatAwal") ? (surahAwalEl ? surahAwalEl.value : "") : (surahAkhirEl ? surahAkhirEl.value : "");
    const foundSurah = QURAN_SURAHS.find(s => s.name === surahName);
    if (foundSurah && val > foundSurah.verses) {
      val = foundSurah.verses;
    }

    el.value = val;

    // Sinkronisasi otomatis jika Ayat Akhir lebih kecil dari Ayat Awal
    const elAwal = document.getElementById("inputAyatAwal");
    const elAkhir = document.getElementById("inputAyatAkhir");
    const selAwal = document.getElementById("selectAyatAwal");
    const selAkhir = document.getElementById("selectAyatAkhir");

    if (elAwal && elAkhir && surahAwalEl && surahAkhirEl && surahAwalEl.value === surahAkhirEl.value) {
      const vAwal = parseInt(elAwal.value, 10) || 1;
      const vAkhir = parseInt(elAkhir.value, 10) || 1;
      if (inputId === "inputAyatAwal" && vAwal > vAkhir) {
        elAkhir.value = vAwal;
      } else if (inputId === "inputAyatAkhir" && vAkhir < vAwal) {
        elAwal.value = vAkhir;
      }
    }

    if (selAwal && elAwal) selAwal.value = elAwal.value;
    if (selAkhir && elAkhir) selAkhir.value = elAkhir.value;
  },

  toggleZiyadahActive() {
    const check = document.getElementById("checkEnableZiyadah");
    const isActive = check ? check.checked : true;
    this.setZiyadahActive(isActive, true);
  },

  setZiyadahActive(isActive, showToastMessage = true) {
    const check = document.getElementById("checkEnableZiyadah");
    const card = document.getElementById("cardZiyadahSection");
    const container = document.getElementById("containerZiyadahInputs");
    const badge = document.getElementById("badgeZiyadahStatus");
    const notice = document.getElementById("ziyadahEmptyNotice");
    const btnYes = document.getElementById("btnZiyadahActiveYes");
    const btnNo = document.getElementById("btnZiyadahActiveNo");
    const selAwal = document.getElementById("selectZiyadahSurahAwal");
    const selAkhir = document.getElementById("selectZiyadahSurahAkhir");
    const selAyatAwal = document.getElementById("selectZiyadahAyatAwal");
    const selAyatAkhir = document.getElementById("selectZiyadahAyatAkhir");
    const inAyatAwal = document.getElementById("inputZiyadahAyatAwal");
    const inAyatAkhir = document.getElementById("inputZiyadahAyatAkhir");

    if (check) check.checked = isActive;

    if (isActive) {
      if (card) card.classList.remove("disabled");
      if (container) {
        container.style.opacity = "1";
        container.style.pointerEvents = "auto";
      }
      if (badge) {
        badge.textContent = "Aktif";
        badge.style.background = "#dcfce7";
        badge.style.color = "#15803d";
        badge.style.border = "1px solid #bbf7d0";
      }
      if (btnYes) {
        btnYes.style.background = "#059669";
        btnYes.style.color = "#ffffff";
        btnYes.style.border = "1px solid #059669";
        btnYes.style.fontWeight = "700";
      }
      if (btnNo) {
        btnNo.style.background = "#f1f5f9";
        btnNo.style.color = "#475569";
        btnNo.style.border = "1px solid #cbd5e1";
        btnNo.style.fontWeight = "600";
      }
      if (notice) notice.style.display = "none";

      if (selAwal && !selAwal.value) {
        selAwal.value = "An-Naba'";
        if (selAkhir) selAkhir.value = "An-Naba'";
        const found = QURAN_SURAHS.find(s => s.name === "An-Naba'");
        if (found) {
          this.populateAyatDropdown(selAyatAwal, found.verses, 1);
          this.populateAyatDropdown(selAyatAkhir, found.verses, Math.min(10, found.verses));
          if (inAyatAwal) inAyatAwal.value = 1;
          if (inAyatAkhir) inAyatAkhir.value = Math.min(10, found.verses);
        }
      }
      if (showToastMessage) {
        this.showToast("⭐ Ziyadah (Hafalan Baru) diaktifkan", "info");
      }
    } else {
      if (card) card.classList.add("disabled");
      if (container) {
        container.style.opacity = "0.45";
        container.style.pointerEvents = "auto";
      }
      if (badge) {
        badge.textContent = "Kosong";
        badge.style.background = "#f1f5f9";
        badge.style.color = "#64748b";
        badge.style.border = "1px solid #cbd5e1";
      }
      if (btnYes) {
        btnYes.style.background = "#f1f5f9";
        btnYes.style.color = "#475569";
        btnYes.style.border = "1px solid #cbd5e1";
        btnYes.style.fontWeight = "600";
      }
      if (btnNo) {
        btnNo.style.background = "#fee2e2";
        btnNo.style.color = "#dc2626";
        btnNo.style.border = "1px solid #fca5a5";
        btnNo.style.fontWeight = "700";
      }
      if (notice) notice.style.display = "block";

      if (selAwal) selAwal.value = "";
      if (selAkhir) selAkhir.value = "";
      if (selAyatAwal) selAyatAwal.innerHTML = `<option value="0">-</option>`;
      if (selAyatAkhir) selAyatAkhir.innerHTML = `<option value="0">-</option>`;
      if (inAyatAwal) inAyatAwal.value = 0;
      if (inAyatAkhir) inAyatAkhir.value = 0;

      if (showToastMessage) {
        this.showToast("ℹ️ Ziyadah dikosongkan (Tanpa input surah baru)", "info");
      }
    }
  },

  toggleMurojaahActive() {
    const check = document.getElementById("checkEnableMurojaah");
    const isActive = check ? check.checked : true;
    this.setMurojaahActive(isActive, true);
  },

  setMurojaahActive(isActive, showToastMessage = true) {
    const check = document.getElementById("checkEnableMurojaah");
    const card = document.getElementById("cardMurojaahSection");
    const container = document.getElementById("containerMurojaahInputs");
    const badge = document.getElementById("badgeMurojaahStatus");
    const notice = document.getElementById("murojaahEmptyNotice");
    const btnYes = document.getElementById("btnMurojaahActiveYes");
    const btnNo = document.getElementById("btnMurojaahActiveNo");
    const selAwal = document.getElementById("selectMurojaahSurahAwal");
    const selAkhir = document.getElementById("selectMurojaahSurahAkhir");
    const selAyatAwal = document.getElementById("selectMurojaahAyatAwal");
    const selAyatAkhir = document.getElementById("selectMurojaahAyatAkhir");
    const inAyatAwal = document.getElementById("inputMurojaahAyatAwal");
    const inAyatAkhir = document.getElementById("inputMurojaahAyatAkhir");

    if (check) check.checked = isActive;

    if (isActive) {
      if (card) card.classList.remove("disabled");
      if (container) {
        container.style.opacity = "1";
        container.style.pointerEvents = "auto";
      }
      if (badge) {
        badge.textContent = "Aktif";
        badge.style.background = "#e0f2fe";
        badge.style.color = "#0369a1";
        badge.style.border = "1px solid #bae6fd";
      }
      if (btnYes) {
        btnYes.style.background = "#0284c7";
        btnYes.style.color = "#ffffff";
        btnYes.style.border = "1px solid #0284c7";
        btnYes.style.fontWeight = "700";
      }
      if (btnNo) {
        btnNo.style.background = "#f1f5f9";
        btnNo.style.color = "#475569";
        btnNo.style.border = "1px solid #cbd5e1";
        btnNo.style.fontWeight = "600";
      }
      if (notice) notice.style.display = "none";

      if (selAwal && !selAwal.value) {
        selAwal.value = "An-Nazi'at";
        if (selAkhir) selAkhir.value = "An-Nazi'at";
        const found = QURAN_SURAHS.find(s => s.name === "An-Nazi'at");
        if (found) {
          this.populateAyatDropdown(selAyatAwal, found.verses, 1);
          this.populateAyatDropdown(selAyatAkhir, found.verses, Math.min(20, found.verses));
          if (inAyatAwal) inAyatAwal.value = 1;
          if (inAyatAkhir) inAyatAkhir.value = Math.min(20, found.verses);
        }
      }
      if (showToastMessage) {
        this.showToast("🔄 Muroja'ah diaktifkan", "info");
      }
    } else {
      if (card) card.classList.add("disabled");
      if (container) {
        container.style.opacity = "0.45";
        container.style.pointerEvents = "auto";
      }
      if (badge) {
        badge.textContent = "Tanpa Muroja'ah";
        badge.style.background = "#f1f5f9";
        badge.style.color = "#64748b";
        badge.style.border = "1px solid #cbd5e1";
      }
      if (btnYes) {
        btnYes.style.background = "#f1f5f9";
        btnYes.style.color = "#475569";
        btnYes.style.border = "1px solid #cbd5e1";
        btnYes.style.fontWeight = "600";
      }
      if (btnNo) {
        btnNo.style.background = "#fee2e2";
        btnNo.style.color = "#dc2626";
        btnNo.style.border = "1px solid #fca5a5";
        btnNo.style.fontWeight = "700";
      }
      if (notice) notice.style.display = "block";

      if (selAwal) selAwal.value = "";
      if (selAkhir) selAkhir.value = "";
      if (selAyatAwal) selAyatAwal.innerHTML = `<option value="0">-</option>`;
      if (selAyatAkhir) selAyatAkhir.innerHTML = `<option value="0">-</option>`;
      if (inAyatAwal) inAyatAwal.value = 0;
      if (inAyatAkhir) inAyatAkhir.value = 0;

      if (showToastMessage) {
        this.showToast("💡 Muroja'ah dikosongkan. Santri hanya setoran Ziyadah (Hafalan baru).", "info");
      }
    }
  },

  setZiyadahAyatSpan(spanCount) {
    const selAwal = document.getElementById("selectZiyadahSurahAwal");
    if (!selAwal || !selAwal.value) {
      this.setZiyadahActive(true, false);
    }
    const selAkhir = document.getElementById("selectZiyadahSurahAkhir");
    const selAyatAkhir = document.getElementById("selectZiyadahAyatAkhir");
    const inAyatAwal = document.getElementById("inputZiyadahAyatAwal");
    const inAyatAkhir = document.getElementById("inputZiyadahAyatAkhir");

    if (selAwal && selAkhir && selAwal.value) {
      selAkhir.value = selAwal.value;
    }
    const vAwal = inAyatAwal ? (parseInt(inAyatAwal.value, 10) || 1) : 1;
    let targetAkhir = vAwal + spanCount - 1;

    const surahName = selAwal ? selAwal.value : "";
    const found = QURAN_SURAHS.find(s => s.name === surahName);
    if (found && targetAkhir > found.verses) {
      targetAkhir = found.verses;
    }

    if (inAyatAkhir) inAyatAkhir.value = targetAkhir;
    if (selAyatAkhir) selAyatAkhir.value = targetAkhir;
    this.showToast(`⭐ Ziyadah: ${surahName} (Ayat ${vAwal} - ${targetAkhir})`, "info");
  },

  setZiyadahFullSurah() {
    const selAwal = document.getElementById("selectZiyadahSurahAwal");
    if (!selAwal || !selAwal.value) {
      this.setZiyadahActive(true, false);
    }
    const selAkhir = document.getElementById("selectZiyadahSurahAkhir");
    const selAyatAwal = document.getElementById("selectZiyadahAyatAwal");
    const selAyatAkhir = document.getElementById("selectZiyadahAyatAkhir");
    const inAyatAwal = document.getElementById("inputZiyadahAyatAwal");
    const inAyatAkhir = document.getElementById("inputZiyadahAyatAkhir");

    if (!selAwal || !selAwal.value) return;
    const surahName = selAwal.value;
    if (selAkhir) selAkhir.value = surahName;

    const found = QURAN_SURAHS.find(s => s.name === surahName);
    const totalAyat = found ? found.verses : 10;

    if (inAyatAwal) inAyatAwal.value = 1;
    if (inAyatAkhir) inAyatAkhir.value = totalAyat;
    if (selAyatAwal) selAyatAwal.value = 1;
    if (selAyatAkhir) selAyatAkhir.value = totalAyat;

    this.showToast(`⭐ Ziyadah 1 Surah Penuh: ${surahName} (Ayat 1 - ${totalAyat})`, "success");
  },

  setMurojaahAyatSpan(spanCount) {
    const selAwal = document.getElementById("selectMurojaahSurahAwal");
    if (!selAwal || !selAwal.value) {
      this.setMurojaahActive(true, false);
    }
    const selAkhir = document.getElementById("selectMurojaahSurahAkhir");
    const selAyatAkhir = document.getElementById("selectMurojaahAyatAkhir");
    const inAyatAwal = document.getElementById("inputMurojaahAyatAwal");
    const inAyatAkhir = document.getElementById("inputMurojaahAyatAkhir");

    if (selAwal && selAkhir && selAwal.value) {
      selAkhir.value = selAwal.value;
    }
    const vAwal = inAyatAwal ? (parseInt(inAyatAwal.value, 10) || 1) : 1;
    let targetAkhir = vAwal + spanCount - 1;

    const surahName = selAwal ? selAwal.value : "";
    const found = QURAN_SURAHS.find(s => s.name === surahName);
    if (found && targetAkhir > found.verses) {
      targetAkhir = found.verses;
    }

    if (inAyatAkhir) inAyatAkhir.value = targetAkhir;
    if (selAyatAkhir) selAyatAkhir.value = targetAkhir;
    this.showToast(`🔄 Muroja'ah: ${surahName} (Ayat ${vAwal} - ${targetAkhir})`, "info");
  },

  setMurojaahFullSurah() {
    const selAwal = document.getElementById("selectMurojaahSurahAwal");
    if (!selAwal || !selAwal.value) {
      this.setMurojaahActive(true, false);
    }
    const selAkhir = document.getElementById("selectMurojaahSurahAkhir");
    const selAyatAwal = document.getElementById("selectMurojaahAyatAwal");
    const selAyatAkhir = document.getElementById("selectMurojaahAyatAkhir");
    const inAyatAwal = document.getElementById("inputMurojaahAyatAwal");
    const inAyatAkhir = document.getElementById("inputMurojaahAyatAkhir");

    if (!selAwal || !selAwal.value) return;
    const surahName = selAwal.value;
    if (selAkhir) selAkhir.value = surahName;

    const found = QURAN_SURAHS.find(s => s.name === surahName);
    const totalAyat = found ? found.verses : 20;

    if (inAyatAwal) inAyatAwal.value = 1;
    if (inAyatAkhir) inAyatAkhir.value = totalAyat;
    if (selAyatAwal) selAyatAwal.value = 1;
    if (selAyatAkhir) selAyatAkhir.value = totalAyat;

    this.showToast(`🔄 Muroja'ah 1 Surah Penuh: ${surahName} (Ayat 1 - ${totalAyat})`, "success");
  },

  setAyatSpan(spanCount) {
    const elAwal = document.getElementById("inputAyatAwal");
    const elAkhir = document.getElementById("inputAyatAkhir");
    const selAwal = document.getElementById("selectAyatAwal");
    const selAkhir = document.getElementById("selectAyatAkhir");
    const surahAwalEl = document.getElementById("selectSurahAwal");
    const surahAkhirEl = document.getElementById("selectSurahAkhir");

    if (surahAwalEl && surahAkhirEl && surahAwalEl.value) {
      surahAkhirEl.value = surahAwalEl.value;
    }

    const vAwal = elAwal ? (parseInt(elAwal.value, 10) || 1) : 1;
    let targetAkhir = vAwal + spanCount - 1;

    const surahName = surahAwalEl ? surahAwalEl.value : "";
    const foundSurah = QURAN_SURAHS.find(s => s.name === surahName);
    if (foundSurah && targetAkhir > foundSurah.verses) {
      targetAkhir = foundSurah.verses;
    }

    if (elAkhir) elAkhir.value = targetAkhir;
    if (selAwal && elAwal) selAwal.value = elAwal.value;
    if (selAkhir && elAkhir) selAkhir.value = elAkhir.value;

    this.showToast(`Batas hafalan disetel: Ayat ${vAwal} s/d ${targetAkhir}`, "info");
  },

  setFullSurah() {
    const surahAwalEl = document.getElementById("selectSurahAwal");
    const surahAkhirEl = document.getElementById("selectSurahAkhir");
    const elAwal = document.getElementById("inputAyatAwal");
    const elAkhir = document.getElementById("inputAyatAkhir");
    const selAwal = document.getElementById("selectAyatAwal");
    const selAkhir = document.getElementById("selectAyatAkhir");

    if (!surahAwalEl || !surahAwalEl.value) return;
    const surahName = surahAwalEl.value;
    if (surahAkhirEl) surahAkhirEl.value = surahName;

    const foundSurah = QURAN_SURAHS.find(s => s.name === surahName);
    const totalAyat = foundSurah ? foundSurah.verses : 10;

    if (elAwal) elAwal.value = 1;
    if (elAkhir) elAkhir.value = totalAyat;
    if (selAwal) selAwal.value = 1;
    if (selAkhir) selAkhir.value = totalAyat;

    this.showToast(`Hafalan 1 Surah Penuh: ${surahName} (Ayat 1 - ${totalAyat})`, "success");
  },

  adjustNumericInput(inputId, delta) {
    const el = document.getElementById(inputId);
    if (!el) return;
    const match = el.value.match(/\d+/);
    let num = match ? parseInt(match[0], 10) : 1;
    num += delta;
    if (num < 1) num = 1;
    if (inputId === "inputTartilHalaman" && num > 604) num = 604;
    el.value = `Halaman ${num}`;
  },

  populateAyatDropdown(selectEl, totalVerses, currentVal = 1) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    for (let i = 1; i <= totalVerses; i++) {
      selectEl.add(new Option(`Ayat ${i}`, i));
    }
    if (currentVal && currentVal <= totalVerses) {
      selectEl.value = currentVal;
    }
  },

  // 2. Populasi Dropdown Static & 4 Kelas Resmi
  populateStaticDropdowns() {
    const selectHalaqah = document.getElementById("selectHalaqah");
    const filterHalaqah = document.getElementById("filterHalaqahLeaderboard");
    const newSantriHalaqah = document.getElementById("newSantriHalaqah");
    const inputUstadz = document.getElementById("inputUstadz");

    // Masukkan 4 Kelas Resmi
    if (selectHalaqah) selectHalaqah.innerHTML = "";
    if (filterHalaqah) filterHalaqah.innerHTML = `<option value="">Semua Kelas</option>`;
    if (newSantriHalaqah) newSantriHalaqah.innerHTML = "";

    MASTER_CLASSES.forEach(c => {
      if (selectHalaqah) selectHalaqah.add(new Option(`${c.name} (${c.pengampu})`, c.name));
      if (filterHalaqah) filterHalaqah.add(new Option(c.name, c.name));
      if (newSantriHalaqah) newSantriHalaqah.add(new Option(`${c.name} (${c.pengampu})`, c.name));
    });

    // Otomatis update Ustadz Pengampu saat Kelas diubah
    if (selectHalaqah) {
      selectHalaqah.addEventListener("change", (e) => {
        const chosenClass = e.target.value;
        if (CLASS_TEACHER_MAP[chosenClass] && inputUstadz) {
          inputUstadz.value = CLASS_TEACHER_MAP[chosenClass].ustadz;
        }
        this.filterSantriByHalaqah(chosenClass);
      });

      // Default select
      if (selectHalaqah.options.length > 0) {
        const firstClass = selectHalaqah.options[0].value;
        if (inputUstadz && CLASS_TEACHER_MAP[firstClass]) {
          inputUstadz.value = CLASS_TEACHER_MAP[firstClass].ustadz;
        }
      }
    }

    // Tamhid Jilid (Jilid 1 - 5 tanpa keterangan tambahan)
    const selectTamhid = document.getElementById("selectTamhidJilid");
    if (selectTamhid) {
      selectTamhid.innerHTML = "";
      TAMHID_JILID_OPTIONS.forEach(j => {
        selectTamhid.add(new Option(j, j));
      });
      selectTamhid.value = "Jilid 1";
    }

    // Tartil Juz (1 s/d 30)
    const selectTartilJuz = document.getElementById("selectTartilJuz");
    if (selectTartilJuz) {
      selectTartilJuz.innerHTML = "";
      for (let j = 1; j <= 30; j++) {
        selectTartilJuz.add(new Option(`Juz ${j}`, j));
      }
      selectTartilJuz.value = "30";
    }

    // 1. Surah Ziyadah (Hafalan Baru)
    const selZiyadahAwal = document.getElementById("selectZiyadahSurahAwal");
    const selZiyadahAkhir = document.getElementById("selectZiyadahSurahAkhir");
    const selZiyadahAyatAwal = document.getElementById("selectZiyadahAyatAwal");
    const selZiyadahAyatAkhir = document.getElementById("selectZiyadahAyatAkhir");
    const inZiyadahAyatAwal = document.getElementById("inputZiyadahAyatAwal");
    const inZiyadahAyatAkhir = document.getElementById("inputZiyadahAyatAkhir");

    // 2. Surah Muroja'ah (Ulang Hafalan)
    const selMurojaahAwal = document.getElementById("selectMurojaahSurahAwal");
    const selMurojaahAkhir = document.getElementById("selectMurojaahSurahAkhir");
    const selMurojaahAyatAwal = document.getElementById("selectMurojaahAyatAwal");
    const selMurojaahAyatAkhir = document.getElementById("selectMurojaahAyatAkhir");
    const inMurojaahAyatAwal = document.getElementById("inputMurojaahAyatAwal");
    const inMurojaahAyatAkhir = document.getElementById("inputMurojaahAyatAkhir");

    // Populate all Surah select dropdowns (Mendukung opsi kosong untuk muroja'ah/ziyadah fleksibel)
    const populateSurahSelect = (selectEl, defaultVal, allowEmpty = false, emptyLabel = "-- Kosongkan --") => {
      if (!selectEl) return;
      selectEl.innerHTML = "";
      if (allowEmpty) {
        selectEl.add(new Option(emptyLabel, ""));
      }
      QURAN_SURAHS.forEach(s => {
        const text = `${s.no}. ${s.name} (${s.verses} ayat)`;
        selectEl.add(new Option(text, s.name));
      });
      selectEl.value = defaultVal !== undefined ? defaultVal : "";
    };

    populateSurahSelect(selZiyadahAwal, "An-Naba'", true, "-- Tidak Ada Ziyadah Baru --");
    populateSurahSelect(selZiyadahAkhir, "An-Naba'", true, "-- Tidak Ada Ziyadah Baru --");
    populateSurahSelect(selMurojaahAwal, "An-Nazi'at", true, "-- Tidak Muroja'ah (Kosongkan) --");
    populateSurahSelect(selMurojaahAkhir, "An-Nazi'at", true, "-- Tidak Muroja'ah (Kosongkan) --");

    // Inisialisasi Ayat Ziyadah
    const defaultZiyadah = QURAN_SURAHS.find(s => s.name === "An-Naba'") || QURAN_SURAHS[0];
    if (selZiyadahAyatAwal && defaultZiyadah) {
      this.populateAyatDropdown(selZiyadahAyatAwal, defaultZiyadah.verses, 1);
    }
    if (selZiyadahAyatAkhir && defaultZiyadah) {
      this.populateAyatDropdown(selZiyadahAyatAkhir, defaultZiyadah.verses, Math.min(10, defaultZiyadah.verses));
    }

    // Inisialisasi Ayat Muroja'ah
    const defaultMurojaah = QURAN_SURAHS.find(s => s.name === "An-Nazi'at") || QURAN_SURAHS[0];
    if (selMurojaahAyatAwal && defaultMurojaah) {
      this.populateAyatDropdown(selMurojaahAyatAwal, defaultMurojaah.verses, 1);
    }
    if (selMurojaahAyatAkhir && defaultMurojaah) {
      this.populateAyatDropdown(selMurojaahAyatAkhir, defaultMurojaah.verses, Math.min(20, defaultMurojaah.verses));
    }

    // Event listeners Ziyadah
    if (selZiyadahAwal) {
      selZiyadahAwal.addEventListener("change", (e) => {
        const chosenVal = e.target.value;
        if (!chosenVal) {
          this.setZiyadahActive(false, true);
          return;
        }
        this.setZiyadahActive(true, false);
        const found = QURAN_SURAHS.find(s => s.name === chosenVal);
        if (found) {
          if (selZiyadahAkhir) selZiyadahAkhir.value = found.name;
          if (inZiyadahAyatAwal) inZiyadahAyatAwal.value = 1;
          if (inZiyadahAyatAkhir) inZiyadahAyatAkhir.value = Math.min(10, found.verses);
          this.populateAyatDropdown(selZiyadahAyatAwal, found.verses, 1);
          this.populateAyatDropdown(selZiyadahAyatAkhir, found.verses, Math.min(10, found.verses));
        }
      });
    }

    if (selZiyadahAkhir) {
      selZiyadahAkhir.addEventListener("change", (e) => {
        const chosenVal = e.target.value;
        if (!chosenVal) {
          if (inZiyadahAyatAkhir) inZiyadahAyatAkhir.value = 0;
          if (selZiyadahAyatAkhir) selZiyadahAyatAkhir.innerHTML = `<option value="0">-</option>`;
          return;
        }
        const found = QURAN_SURAHS.find(s => s.name === chosenVal);
        if (found) {
          if (inZiyadahAyatAkhir) inZiyadahAyatAkhir.value = Math.min(10, found.verses);
          this.populateAyatDropdown(selZiyadahAyatAkhir, found.verses, Math.min(10, found.verses));
        }
      });
    }

    if (selZiyadahAyatAwal && inZiyadahAyatAwal) {
      selZiyadahAyatAwal.addEventListener("change", (e) => {
        inZiyadahAyatAwal.value = parseInt(e.target.value, 10) || 1;
      });
    }
    if (selZiyadahAyatAkhir && inZiyadahAyatAkhir) {
      selZiyadahAyatAkhir.addEventListener("change", (e) => {
        inZiyadahAyatAkhir.value = parseInt(e.target.value, 10) || 1;
      });
    }

    // Event listeners Muroja'ah
    if (selMurojaahAwal) {
      selMurojaahAwal.addEventListener("change", (e) => {
        const chosenVal = e.target.value;
        if (!chosenVal) {
          // Ustadz memilih opsi kosong: Matikan Muroja'ah seketika
          this.setMurojaahActive(false, true);
          return;
        }

        // Ustadz memilih surah nyata: Aktifkan Muroja'ah
        this.setMurojaahActive(true, false);
        const found = QURAN_SURAHS.find(s => s.name === chosenVal);
        if (found) {
          if (selMurojaahAkhir) selMurojaahAkhir.value = found.name;
          if (inMurojaahAyatAwal) inMurojaahAyatAwal.value = 1;
          if (inMurojaahAyatAkhir) inMurojaahAyatAkhir.value = Math.min(20, found.verses);
          this.populateAyatDropdown(selMurojaahAyatAwal, found.verses, 1);
          this.populateAyatDropdown(selMurojaahAyatAkhir, found.verses, Math.min(20, found.verses));
        }
      });
    }

    if (selMurojaahAkhir) {
      selMurojaahAkhir.addEventListener("change", (e) => {
        const chosenVal = e.target.value;
        if (!chosenVal) {
          if (inMurojaahAyatAkhir) inMurojaahAyatAkhir.value = 0;
          if (selMurojaahAyatAkhir) selMurojaahAyatAkhir.innerHTML = `<option value="0">-</option>`;
          return;
        }
        const found = QURAN_SURAHS.find(s => s.name === chosenVal);
        if (found) {
          if (inMurojaahAyatAkhir) inMurojaahAyatAkhir.value = Math.min(20, found.verses);
          this.populateAyatDropdown(selMurojaahAyatAkhir, found.verses, Math.min(20, found.verses));
        }
      });
    }

    if (selMurojaahAyatAwal && inMurojaahAyatAwal) {
      selMurojaahAyatAwal.addEventListener("change", (e) => {
        inMurojaahAyatAwal.value = parseInt(e.target.value, 10) || 1;
      });
    }
    if (selMurojaahAyatAkhir && inMurojaahAyatAkhir) {
      selMurojaahAyatAkhir.addEventListener("change", (e) => {
        inMurojaahAyatAkhir.value = parseInt(e.target.value, 10) || 1;
      });
    }

    this.refreshSantriDropdowns();

    // Quick Add Santri Button inside input panel (Khusus Admin Utama)
    const btnQuickAddSantri = document.getElementById("btnQuickAddSantri");
    if (btnQuickAddSantri) {
      btnQuickAddSantri.addEventListener("click", () => {
        if (!SheetsService.isAdmin()) {
          this.showToast("Akses Terbatas: Hanya Ustadz M. Fikri Haekal yang berwenang menambahkan santri baru.", "error");
          return;
        }
        this.switchSantriModalSubtab("add");
        const modal = document.getElementById("modalAddSantri");
        if (modal) modal.classList.add("active");
      });
    }
  },

  refreshSantriDropdowns() {
    const selectSantri = document.getElementById("selectSantri");
    const selectParentSantri = document.getElementById("selectParentSantri");
    const allSantri = SheetsService.getAllSantri();
    const selectHalaqah = document.getElementById("selectHalaqah");
    const currentClass = selectHalaqah ? selectHalaqah.value : "";

    const filtered = currentClass ? allSantri.filter(s => s.halaqah === currentClass) : allSantri;

    if (selectSantri) {
      const currentVal = selectSantri.value;
      selectSantri.innerHTML = `<option value="">-- Pilih Santri --</option>`;
      filtered.forEach((s, idx) => {
        selectSantri.add(new Option(`No. ${idx + 1} - ${s.nama}`, s.id));
      });
      if (currentVal) selectSantri.value = currentVal;
    }

    if (selectParentSantri) {
      const currentParent = selectParentSantri.value;
      selectParentSantri.innerHTML = `<option value="">-- Pilih Nama Ananda --</option>`;
      allSantri.forEach((s, idx) => {
        selectParentSantri.add(new Option(`No. ${idx + 1} - ${s.nama} (${s.halaqah})`, s.id));
      });
      if (currentParent) selectParentSantri.value = currentParent;
    }
  },

  filterSantriByHalaqah(halaqah) {
    const selectSantri = document.getElementById("selectSantri");
    if (!selectSantri) return;
    const allSantri = SheetsService.getAllSantri();
    const filtered = halaqah ? allSantri.filter(s => s.halaqah === halaqah) : allSantri;

    selectSantri.innerHTML = `<option value="">-- Pilih Santri --</option>`;
    filtered.forEach((s, idx) => {
      selectSantri.add(new Option(`No. ${idx + 1} - ${s.avatar} ${s.nama}`, s.id));
    });
  },

  // 3. Switcher: Kitab Tamhid vs Tartil Al-Qur'an (Tartil Ringkas)
  setupStageSwitch() {
    const btnSwitchTamhid = document.getElementById("btnSwitchTamhid");
    const btnSwitchTartil = document.getElementById("btnSwitchTartil");
    const subFormTamhid = document.getElementById("subFormTamhid");
    const subFormTartil = document.getElementById("subFormTartil");
    const inputBacaanTipe = document.getElementById("inputBacaanTipe");
    const badgeBacaanActive = document.getElementById("badgeBacaanActive");

    const setMode = (mode) => {
      inputBacaanTipe.value = mode;
      if (mode === "Tamhid") {
        btnSwitchTamhid.classList.add("active");
        btnSwitchTartil.classList.remove("active");
        subFormTamhid.style.display = "block";
        subFormTartil.style.display = "none";
        badgeBacaanActive.textContent = "Kitab Tamhid";
        badgeBacaanActive.style.background = "#0284c7";
      } else {
        btnSwitchTartil.classList.add("active");
        btnSwitchTamhid.classList.remove("active");
        subFormTamhid.style.display = "none";
        subFormTartil.style.display = "block";
        badgeBacaanActive.textContent = "Tartil Al-Qur'an";
        badgeBacaanActive.style.background = "#f43f7a";
      }
    };

    if (btnSwitchTamhid && btnSwitchTartil) {
      btnSwitchTamhid.addEventListener("click", () => setMode("Tamhid"));
      btnSwitchTartil.addEventListener("click", () => setMode("Tartil"));
    }

    const btnTamhidLulusNaik = document.getElementById("btnTamhidLulusNaik");
    if (btnTamhidLulusNaik) {
      btnTamhidLulusNaik.addEventListener("click", () => {
        this.showToast("Maa syaa Allah! Santri LULUS Kitab Tamhid dan naik ke jenjang Tartil Al-Qur'an 🎓🎉", "success");
        setMode("Tartil");
      });
    }

    const selectSantri = document.getElementById("selectSantri");
    if (selectSantri) {
      selectSantri.addEventListener("change", (e) => {
        const santriId = e.target.value;
        const allSantri = SheetsService.getAllSantri();
        const found = allSantri.find(s => s.id === santriId);
        if (found) {
          if (found.statusBelajar === "Tartil Qur'an") setMode("Tartil");
          else setMode("Tamhid");
        }
      });
    }
  },

  // 4. Rating Bintang Interaktif (Dengan Dukungan Tombol Batal seperti Gambar 1)
  setupStarRatings() {
    const starContainers = document.querySelectorAll(".star-inputs, .star-inputs-clean");
    starContainers.forEach(container => {
      const category = container.dataset.rating;
      const stars = container.querySelectorAll(".star-btn, .star-btn-clean");
      const resetBtn = container.querySelector(".star-btn-reset, .btn-cancel-rating");

      stars.forEach(star => {
        star.addEventListener("click", () => {
          const val = parseInt(star.dataset.val, 10);
          this.ratings[category] = val;
          this.renderCategoryStars(container, val);
          this.updateTotalStars();
        });
      });

      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          this.ratings[category] = 0;
          this.renderCategoryStars(container, 0);
          this.updateTotalStars();
        });
      }

      this.renderCategoryStars(container, this.ratings[category] || 5);
    });

    // Handle tombol ❌ Batal di luar container jika ada
    const cancelBtns = document.querySelectorAll(".btn-cancel-rating");
    cancelBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.rating;
        if (cat && this.ratings[cat] !== undefined) {
          this.ratings[cat] = 0;
          const targetCont = document.querySelector(`[data-rating="${cat}"].star-inputs-clean, [data-rating="${cat}"].star-inputs`);
          if (targetCont) this.renderCategoryStars(targetCont, 0);
          this.updateTotalStars();
          this.showToast(`Penilaian ${cat} dibatalkan`, "info");
        }
      });
    });

    this.updateTotalStars();
  },

  renderCategoryStars(container, count) {
    const stars = container.querySelectorAll(".star-btn, .star-btn-clean");
    stars.forEach(star => {
      const val = parseInt(star.dataset.val, 10);
      if (val <= count && count > 0) star.classList.add("active");
      else star.classList.remove("active");
    });
  },

  updateTotalStars() {
    const total = this.ratings.tajwid + this.ratings.kelancaran + this.ratings.makhraj;
    
    const starTajwid = document.getElementById("inputStarTajwid");
    const starKelancaran = document.getElementById("inputStarKelancaran");
    const starMakhraj = document.getElementById("inputStarMakhraj");
    const starTotal = document.getElementById("inputStarTotal");
    const labelTotal = document.getElementById("labelTotalBintang");
    const predikatBadge = document.getElementById("predikatBadge");

    if (starTajwid) starTajwid.value = this.ratings.tajwid;
    if (starKelancaran) starKelancaran.value = this.ratings.kelancaran;
    if (starMakhraj) starMakhraj.value = this.ratings.makhraj;
    if (starTotal) starTotal.value = total;
    if (labelTotal) labelTotal.textContent = total;

    if (predikatBadge) {
      if (total >= 14) {
        predikatBadge.textContent = "Mumtaz (Istimewa)";
        predikatBadge.style.background = "#ecfdf5";
        predikatBadge.style.color = "#047857";
        predikatBadge.style.borderColor = "#d1fae5";
      } else if (total >= 11) {
        predikatBadge.textContent = "Jayyid Jiddan (Sangat Baik)";
        predikatBadge.style.background = "#f0fdf4";
        predikatBadge.style.color = "#059669";
        predikatBadge.style.borderColor = "#a7f3d0";
      } else if (total >= 8) {
        predikatBadge.textContent = "Jayyid (Baik)";
        predikatBadge.style.background = "#fffbeb";
        predikatBadge.style.color = "#b45309";
        predikatBadge.style.borderColor = "#fde68a";
      } else {
        predikatBadge.textContent = "Maqbul (Perlu Bimbingan)";
        predikatBadge.style.background = "#fef2f2";
        predikatBadge.style.color = "#dc2626";
        predikatBadge.style.borderColor = "#fecaca";
      }
    }
  },

  setupPillToggles() {
    // Tamhid Status
    const btnTamhidLanjut = document.getElementById("btnTamhidLanjut");
    const btnTamhidUlang = document.getElementById("btnTamhidUlang");
    const inputTamhidStatus = document.getElementById("inputTamhidStatus");

    if (btnTamhidLanjut && btnTamhidUlang) {
      btnTamhidLanjut.addEventListener("click", () => {
        btnTamhidLanjut.className = "pill-btn-clean active-green";
        btnTamhidUlang.className = "pill-btn-clean";
        inputTamhidStatus.value = "Lanjut";
      });
      btnTamhidUlang.addEventListener("click", () => {
        btnTamhidUlang.className = "pill-btn-clean active-amber";
        btnTamhidLanjut.className = "pill-btn-clean";
        inputTamhidStatus.value = "Ulang";
      });
    }

    // Tartil Status
    const btnTartilLanjut = document.getElementById("btnTartilLanjut");
    const btnTartilUlang = document.getElementById("btnTartilUlang");
    const inputTartilStatus = document.getElementById("inputTartilStatus");

    if (btnTartilLanjut && btnTartilUlang) {
      btnTartilLanjut.addEventListener("click", () => {
        btnTartilLanjut.className = "pill-btn-clean active-green";
        btnTartilUlang.className = "pill-btn-clean";
        inputTartilStatus.value = "Lanjut";
      });
      btnTartilUlang.addEventListener("click", () => {
        btnTartilUlang.className = "pill-btn-clean active-amber";
        btnTartilLanjut.className = "pill-btn-clean";
        inputTartilStatus.value = "Ulang";
      });
    }

    // Hafalan Jenis
    const btnHafalanZiyadah = document.getElementById("btnHafalanZiyadah");
    const btnHafalanMurojaah = document.getElementById("btnHafalanMurojaah");
    const inputHafalanJenis = document.getElementById("inputHafalanJenis");

    if (btnHafalanZiyadah && btnHafalanMurojaah) {
      btnHafalanZiyadah.addEventListener("click", () => {
        btnHafalanZiyadah.className = "pill-btn-clean active-green";
        btnHafalanMurojaah.className = "pill-btn-clean";
        inputHafalanJenis.value = "Ziyadah";
      });
      btnHafalanMurojaah.addEventListener("click", () => {
        btnHafalanMurojaah.className = "pill-btn-clean active-green";
        btnHafalanZiyadah.className = "pill-btn-clean";
        inputHafalanJenis.value = "Muroja'ah";
      });
    }

    // Hafalan Status (Lulus vs Ulang - Gambar 1)
    const btnHafalanLulus = document.getElementById("btnHafalanLulus");
    const btnHafalanUlang = document.getElementById("btnHafalanUlang");
    const inputHafalanStatus = document.getElementById("inputHafalanStatus");

    if (btnHafalanLulus && btnHafalanUlang) {
      btnHafalanLulus.addEventListener("click", () => {
        btnHafalanLulus.className = "btn-action-tindakan active-lulus";
        btnHafalanUlang.className = "btn-action-tindakan";
        inputHafalanStatus.value = "Lulus";
      });
      btnHafalanUlang.addEventListener("click", () => {
        btnHafalanUlang.className = "btn-action-tindakan active-ulang";
        btnHafalanLulus.className = "btn-action-tindakan";
        inputHafalanStatus.value = "Ulang";
      });
    }
  },

  // 5. Submit Form Setoran Santri
  setupFormSubmit() {
    const form = document.getElementById("formSetoran");
    const submitBtn = document.getElementById("btnSubmitSetoran");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const santriId = document.getElementById("selectSantri").value;
      if (!santriId) {
        this.showToast("Mohon pilih santri terlebih dahulu!", "error");
        return;
      }

      const allSantri = SheetsService.getAllSantri();
      const currentSantri = allSantri.find(s => s.id === santriId);
      const namaSantri = currentSantri ? currentSantri.nama : "Santri RQ";
      const kategoriSantri = currentSantri ? currentSantri.kategori : "Menengah";
      const bacaanTipe = document.getElementById("inputBacaanTipe").value;

      const checkZiyadah = document.getElementById("checkEnableZiyadah")?.checked ?? true;
      const checkMurojaah = document.getElementById("checkEnableMurojaah")?.checked ?? true;
      const rawZiyadahSurah = (document.getElementById("selectZiyadahSurahAwal")?.value || "").trim();
      const rawMurojaahSurah = (document.getElementById("selectMurojaahSurahAwal")?.value || "").trim();

      // Ziyadah & Muroja'ah aktif HANYA JIKA dicentang DAN surahnya tidak kosong
      const isZiyadahActive = checkZiyadah && rawZiyadahSurah !== "";
      const isMurojaahActive = checkMurojaah && rawMurojaahSurah !== "";

      const ziyadahSurah = isZiyadahActive ? rawZiyadahSurah : "";
      const ziyadahAyatAwal = isZiyadahActive ? (parseInt(document.getElementById("inputZiyadahAyatAwal")?.value, 10) || 1) : 0;
      const ziyadahSurahAkhir = isZiyadahActive ? (document.getElementById("selectZiyadahSurahAkhir")?.value || ziyadahSurah) : "";
      const ziyadahAyatAkhir = isZiyadahActive ? (parseInt(document.getElementById("inputZiyadahAyatAkhir")?.value, 10) || 1) : 0;

      const murojaahSurah = isMurojaahActive ? rawMurojaahSurah : "";
      const murojaahAyatAwal = isMurojaahActive ? (parseInt(document.getElementById("inputMurojaahAyatAwal")?.value, 10) || 1) : 0;
      const murojaahSurahAkhir = isMurojaahActive ? (document.getElementById("selectMurojaahSurahAkhir")?.value || murojaahSurah) : "";
      const murojaahAyatAkhir = isMurojaahActive ? (parseInt(document.getElementById("inputMurojaahAyatAkhir")?.value, 10) || 1) : 0;

      let hafalanJenis = "Ziyadah & Muroja'ah";
      if (isZiyadahActive && !isMurojaahActive) hafalanJenis = "Ziyadah Saja";
      else if (!isZiyadahActive && isMurojaahActive) hafalanJenis = "Muroja'ah Saja";
      else if (!isZiyadahActive && !isMurojaahActive) hafalanJenis = "Tilawah Saja";

      const rawTanggal = document.getElementById("inputTanggal")?.value;
      const todayStr = new Date().toISOString().split("T")[0];
      const tanggalVal = (rawTanggal && rawTanggal.trim()) ? rawTanggal.trim() : todayStr;

      const record = {
        id: "REC-" + Date.now(),
        timestamp: new Date().toISOString(),
        tanggal: tanggalVal,
        santriId: santriId,
        namaSantri: namaSantri,
        halaqah: document.getElementById("selectHalaqah").value,
        kategori: kategoriSantri,
        ustadz: document.getElementById("inputUstadz").value || SheetsService.getCurrentUstadz(),
        
        // Tilawah (Tamhid vs Tartil Ringkas)
        bacaanTipe: bacaanTipe,
        tamhidJilid: bacaanTipe === "Tamhid" ? document.getElementById("selectTamhidJilid").value : "-",
        tamhidHalaman: bacaanTipe === "Tamhid" ? document.getElementById("inputTamhidHalaman").value.trim() : "-",
        tartilJuz: bacaanTipe === "Tartil" ? document.getElementById("selectTartilJuz").value : "-",
        tartilHalaman: bacaanTipe === "Tartil" ? document.getElementById("inputTartilHalaman").value.trim() : "-",
        bacaanStatus: bacaanTipe === "Tamhid" ? document.getElementById("inputTamhidStatus").value : document.getElementById("inputTartilStatus").value,
        bacaanCatatan: document.getElementById("inputBacaanCatatan").value.trim() || "-",

        // Hafalan Al-Qur'an (Terpisah Ziyadah & Muroja'ah)
        hafalanJenis: hafalanJenis,
        ziyadahActive: isZiyadahActive,
        ziyadahSurah: ziyadahSurah,
        ziyadahAyatAwal: ziyadahAyatAwal,
        ziyadahSurahAkhir: ziyadahSurahAkhir,
        ziyadahAyatAkhir: ziyadahAyatAkhir,

        murojaahActive: isMurojaahActive,
        murojaahSurah: murojaahSurah,
        murojaahAyatAwal: murojaahAyatAwal,
        murojaahSurahAkhir: murojaahSurahAkhir,
        murojaahAyatAkhir: murojaahAyatAkhir,

        // Fallback untuk tabel/spreadsheet & backward compatibility
        surahAwal: isZiyadahActive ? ziyadahSurah : (isMurojaahActive ? murojaahSurah : "-"),
        ayatAwal: isZiyadahActive ? ziyadahAyatAwal : (isMurojaahActive ? murojaahAyatAwal : 0),
        surahAkhir: isZiyadahActive ? ziyadahSurahAkhir : (isMurojaahActive ? murojaahSurahAkhir : "-"),
        ayatAkhir: isZiyadahActive ? ziyadahAyatAkhir : (isMurojaahActive ? murojaahAyatAkhir : 0),

        bintangTajwid: parseInt(document.getElementById("inputStarTajwid").value, 10),
        bintangKelancaran: parseInt(document.getElementById("inputStarKelancaran").value, 10),
        bintangMakhraj: parseInt(document.getElementById("inputStarMakhraj").value, 10),
        totalBintang: parseInt(document.getElementById("inputStarTotal").value, 10),
        hafalanStatus: document.getElementById("inputHafalanStatus").value,
        hafalanCatatan: document.getElementById("inputHafalanCatatan").value.trim() || "-"
      };

      const originalBtnText = submitBtn.innerHTML;

      try {
        // 1. Simpan seketika (0 ms delay - Optimistic Save)
        SheetsService.submitSetoranInstant(record);

        // 2. Tampilkan umpan balik sukses seketika pada tombol
        submitBtn.innerHTML = `<span>✅ Setoran Berhasil Disimpan!</span>`;
        submitBtn.style.background = "#059669";
        
        // 3. Langsung reset input formulir agar ustadz bisa langsung input santri berikutnya
        document.getElementById("inputTamhidHalaman").value = "";
        document.getElementById("inputTartilHalaman").value = "";
        document.getElementById("inputBacaanCatatan").value = "";
        document.getElementById("inputHafalanCatatan").value = "";
        document.getElementById("selectSantri").value = "";

        this.ratings = { tajwid: 5, kelancaran: 5, makhraj: 5 };
        this.setupStarRatings();

        this.showToast(`Alhamdulillah! Setoran ${escapeHtml(namaSantri)} tersimpan seketika. ⭐ +${record.totalBintang} Bintang`, "success");

        // 4. Langsung update tampilan Leaderboard, Pantauan Anak, dan Riwayat
        if (kategoriSantri) {
          this.currentCategoryFilter = kategoriSantri;
          const catBtns = document.querySelectorAll(".category-filter-btn");
          catBtns.forEach(b => {
            if (b.dataset.kategori === kategoriSantri) b.classList.add("active");
            else b.classList.remove("active");
          });
        }

        this.renderLeaderboard();
        this.refreshParentPortalIfActive(santriId);
        this.renderRecentSetoranList();

        // 5. Kembalikan teks tombol dalam 900ms
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
          submitBtn.style.background = "";
        }, 900);

      } catch (err) {
        console.error(err);
        this.showToast("Terjadi kendala saat menyimpan data: " + err.message, "error");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        submitBtn.style.background = "";
      }
    });
  },

  // 6. Helper Tanggal Pekanan & Bulanan (Robust Date Parsing - Memperbaiki Bintang Peringkat Pekanan & Bulanan)
  parseDateSafe(dateVal, fallbackRecord = null) {
    // 1. Jika tanggal kosong/falsy, coba ekstrak dari fallbackRecord (timestamp atau ID)
    if (!dateVal || dateVal === "" || dateVal === "-") {
      if (fallbackRecord) {
        if (fallbackRecord.timestamp) {
          const d = new Date(fallbackRecord.timestamp);
          if (!isNaN(d.getTime())) return d;
        }
        if (fallbackRecord.id) {
          const m = String(fallbackRecord.id).match(/REC-(\d+)/);
          if (m) {
            const d = new Date(Number(m[1]));
            if (!isNaN(d.getTime())) return d;
          }
        }
      }
      return new Date(); // Fallback ke hari ini agar data setoran baru tidak pernah hilang
    }

    if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? new Date() : dateVal;
    
    let s = String(dateVal).trim();
    if (s.includes("T")) s = s.split("T")[0].trim();
    
    // Format YYYY-MM-DD atau YYYY/MM/DD
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) {
      return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    }
    // Format DD-MM-YYYY atau DD/MM/YYYY (format standar spreadsheet Indonesia)
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (m) {
      return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    }

    // Format teks seperti "Sat Oct 17 2026..."
    if (s.includes("GM") || /[A-Za-z]{3}\s+\d+/.test(s)) {
      const matchMonth = s.match(/([A-Za-z]{3}\s+\d{1,2}\s+\d{4})/);
      if (matchMonth) {
        const d = new Date(matchMonth[1]);
        if (!isNaN(d.getTime())) return d;
      }
    }

    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;

    if (fallbackRecord) {
      return this.parseDateSafe(null, fallbackRecord);
    }
    return new Date();
  },

  isDateInCurrentWeek(dateStr, fallbackRecord = null) {
    const targetDate = this.parseDateSafe(dateStr, fallbackRecord);
    if (!targetDate) return true; // Amankan agar setoran terhitung
    
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0: Ahad, 1: Senin...
    const diffToMonday = (currentDayOfWeek === 0 ? -6 : 1) - currentDayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

    return target >= monday && target <= sunday;
  },

  isDateInCurrentMonth(dateStr, fallbackRecord = null) {
    const targetDate = this.parseDateSafe(dateStr, fallbackRecord);
    if (!targetDate) return true;
    const now = new Date();
    return targetDate.getFullYear() === now.getFullYear() && targetDate.getMonth() === now.getMonth();
  },

  // 7. Filter Periode: Pekanan vs Bulanan (Reward) vs Semua Waktu
  setupPeriodFilter() {
    const periodBtns = document.querySelectorAll(".period-btn");
    periodBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        periodBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentPeriodFilter = btn.dataset.period || "pekanan";
        this.renderLeaderboard();
      });
    });
  },

  // 8. Kategori Capaian Reward: HANYA 2 KATEGORI (Dasar & Menengah)
  setupCategoryFilter() {
    const categoryBtns = document.querySelectorAll(".category-filter-btn");
    categoryBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        categoryBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentCategoryFilter = btn.dataset.kategori;
        this.renderLeaderboard();
      });
    });
  },

  // 9. Papan Peringkat (Capaian Pekanan, Bulanan Reward & Akumulasi)
  setupLeaderboard() {
    this.renderLeaderboard();

    const searchInput = document.getElementById("searchLeaderboard");
    if (searchInput) {
      searchInput.addEventListener("input", () => this.renderLeaderboard());
    }

    const filterHalaqah = document.getElementById("filterHalaqahLeaderboard");
    if (filterHalaqah) {
      filterHalaqah.addEventListener("change", () => this.renderLeaderboard());
    }

    const btnRefresh = document.getElementById("btnRefreshLeaderboard");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", async () => {
        this.showToast("Memperbarui data realtime dari Google Spreadsheet...", "success");
        const remoteData = await SheetsService.fetchRemoteRecords();
        if (remoteData) {
          this.showToast("Data terbaru berhasil disinkronkan!", "success");
        }
        this.renderLeaderboard();
      });
    }
  },

  renderLeaderboard() {
    const allSantri = SheetsService.getAllSantri();
    const allRecords = SheetsService.getAllRecords();
    const podiumContainer = document.getElementById("podiumContainer");
    const leaderboardList = document.getElementById("leaderboardList");
    const searchVal = (document.getElementById("searchLeaderboard")?.value || "").toLowerCase().trim();
    const filterHalaqah = document.getElementById("filterHalaqahLeaderboard")?.value || "";

    const bannerTitle = document.getElementById("rewardBannerTitle");
    const bannerDesc = document.getElementById("rewardBannerDesc");
    const bannerIcon = document.getElementById("rewardBannerIcon");
    const badgeCategoryLabel = document.getElementById("badgeCategoryLabel");

    // Dynamic Banner Updates sesuai Periode
    if (bannerTitle && bannerDesc) {
      if (this.currentPeriodFilter === "pekanan") {
        if (bannerIcon) bannerIcon.textContent = "📅";
        if (this.currentCategoryFilter === "Dasar") {
          bannerTitle.textContent = "📅 Capaian Bintang Pekan Ini: Kategori Kelas Dasar (TK s/d 2 SD)";
          bannerDesc.innerHTML = "Memantau keaktifan dan capaian bintang hafalan santri <strong>Kelas Dasar</strong> sepanjang pekan ini.";
          if (badgeCategoryLabel) badgeCategoryLabel.textContent = "Santri Kelas Dasar (Pekan Ini):";
        } else if (this.currentCategoryFilter === "Menengah") {
          bannerTitle.textContent = "📅 Capaian Bintang Pekan Ini: Kategori Kelas Menengah (3 s/d 6 SD)";
          bannerDesc.innerHTML = "Memantau keaktifan dan capaian bintang hafalan santri <strong>Kelas Menengah</strong> sepanjang pekan ini.";
          if (badgeCategoryLabel) badgeCategoryLabel.textContent = "Santri Kelas Menengah (Pekan Ini):";
        } else {
          bannerTitle.textContent = "📅 Capaian Bintang Pekan Ini (Senin – Ahad)";
          bannerDesc.innerHTML = "Memantau perolehan bintang prestasi seluruh santri RQ Ummul Qasim sepanjang pekan berjalan secara realtime.";
          if (badgeCategoryLabel) badgeCategoryLabel.textContent = "Semua Santri (Pekan Ini):";
        }
      } else if (this.currentPeriodFilter === "bulanan") {
        if (bannerIcon) bannerIcon.textContent = "🏆";
        if (this.currentCategoryFilter === "Dasar") {
          bannerTitle.textContent = "🏆 Reward Bulanan: Kategori Kelas Dasar (TK s/d 2 SD)";
          bannerDesc.innerHTML = "Hanya <strong>Juara 1 Kategori Kelas Dasar</strong> (Gabungan Kelas Dasar Ikhwan & Akhowat serta Kelas Dasar Ikhwan) yang berhak mendapatkan <strong>Hadiah Apresiasi (Reward) Bulanan</strong>!";
          if (badgeCategoryLabel) badgeCategoryLabel.textContent = "Peringkat Reward Santri Kelas Dasar:";
        } else if (this.currentCategoryFilter === "Menengah") {
          bannerTitle.textContent = "🏆 Reward Bulanan: Kategori Kelas Menengah (3 s/d 6 SD)";
          bannerDesc.innerHTML = "Hanya <strong>Juara 1 Kategori Kelas Menengah</strong> (Gabungan Menengah Ikhwan & Akhowat) yang berhak mendapatkan <strong>Hadiah Apresiasi (Reward) Bulanan</strong>!";
          if (badgeCategoryLabel) badgeCategoryLabel.textContent = "Peringkat Reward Santri Kelas Menengah:";
        } else {
          bannerTitle.textContent = "🏆 Peringkat Reward Bulanan Santri RQ Ummul Qasim";
          bannerDesc.innerHTML = "Reward diberikan kepada <strong>1 Juara Kategori Dasar</strong> dan <strong>1 Juara Kategori Menengah</strong>.";
          if (badgeCategoryLabel) badgeCategoryLabel.textContent = "Semua Santri RQ Ummul Qasim:";
        }
      } else {
        if (bannerIcon) bannerIcon.textContent = "🌟";
        bannerTitle.textContent = "🌟 Peringkat Akumulasi Semua Waktu";
        bannerDesc.innerHTML = "Pencapaian akumulasi seluruh bintang prestasi santri sejak awal bergabung di RQ Ummul Qasim.";
        if (badgeCategoryLabel) badgeCategoryLabel.textContent = "Seluruh Santri (Akumulasi Total):";
      }
    }

    const santriStats = allSantri.map(s => {
      const allSantriRecords = allRecords.filter(r => {
        if (!r) return false;
        if (r.santriId && s.id && r.santriId === s.id) return true;
        if (r.namaSantri && s.nama && r.namaSantri.trim().toLowerCase() === s.nama.trim().toLowerCase()) return true;
        return false;
      });
      const totalStars = allSantriRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
      const totalSetoran = allSantriRecords.length;

      // Filter Pekanan (Senin - Ahad pekan ini)
      const weekRecords = allSantriRecords.filter(r => this.isDateInCurrentWeek(r.tanggal, r));
      const weekStars = weekRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
      const weekSetoran = weekRecords.length;

      // Filter Bulanan (Bulan ini)
      const monthRecords = allSantriRecords.filter(r => this.isDateInCurrentMonth(r.tanggal, r));
      const monthStars = monthRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
      const monthSetoran = monthRecords.length;

      const latestRecord = allSantriRecords.length > 0 ? allSantriRecords[0] : null;

      let latestBacaanBadge = "";
      if (latestRecord) {
        if (latestRecord.bacaanTipe === "Tartil") {
          latestBacaanBadge = `<span class="meta-badge meta-badge-tartil">📜 Tartil: Juz ${latestRecord.tartilJuz} (${latestRecord.tartilHalaman})</span>`;
        } else {
          latestBacaanBadge = `<span class="meta-badge meta-badge-tamhid">📖 ${latestRecord.tamhidJilid || "Tamhid"} (${latestRecord.tamhidHalaman})</span>`;
        }
      } else {
        latestBacaanBadge = s.statusBelajar === "Tartil Qur'an" 
          ? `<span class="meta-badge meta-badge-tartil">📜 Tartil Qur'an</span>`
          : `<span class="meta-badge meta-badge-tamhid">📖 Kitab Tamhid</span>`;
      }

      // Tentukan nilai bintang & setoran aktif yang ditampilkan sesuai Periode
      let displayStars = totalStars;
      let displaySetoran = totalSetoran;
      let periodLabel = "Total Bintang";

      if (this.currentPeriodFilter === "pekanan") {
        displayStars = weekStars;
        displaySetoran = weekSetoran;
        periodLabel = "Pekan Ini";
      } else if (this.currentPeriodFilter === "bulanan") {
        displayStars = monthStars;
        displaySetoran = monthSetoran;
        periodLabel = "Bulan Ini";
      }

      let latestHafalanText = "Belum ada";
      if (latestRecord) {
        if (latestRecord.ziyadahSurah && latestRecord.murojaahSurah) {
          latestHafalanText = `Ziyadah: ${latestRecord.ziyadahSurah} (${latestRecord.ziyadahAyatAwal}-${latestRecord.ziyadahAyatAkhir}) • Muroja'ah: ${latestRecord.murojaahSurah} (${latestRecord.murojaahAyatAwal}-${latestRecord.murojaahAyatAkhir})`;
        } else if (latestRecord.ziyadahSurah) {
          latestHafalanText = `Ziyadah: ${latestRecord.ziyadahSurah} (${latestRecord.ziyadahAyatAwal}-${latestRecord.ziyadahAyatAkhir})`;
        } else if (latestRecord.murojaahSurah) {
          latestHafalanText = `Muroja'ah: ${latestRecord.murojaahSurah} (${latestRecord.murojaahAyatAwal}-${latestRecord.murojaahAyatAkhir})`;
        } else if (latestRecord.surahAwal) {
          latestHafalanText = `${latestRecord.surahAwal} (${latestRecord.ayatAwal}-${latestRecord.ayatAkhir})`;
        }
      }

      return {
        ...s,
        displayStars,
        displaySetoran,
        periodLabel,
        totalStars,
        totalSetoran,
        weekStars,
        weekSetoran,
        monthStars,
        monthSetoran,
        latestBacaanBadge,
        latestHafalan: latestHafalanText,
        latestRecord
      };
    });

    // Filter Kategori (Dasar / Menengah / Semua)
    let categoryFiltered = santriStats;
    if (this.currentCategoryFilter === "Dasar") {
      categoryFiltered = santriStats.filter(s => s.kategori === "Dasar");
    } else if (this.currentCategoryFilter === "Menengah") {
      categoryFiltered = santriStats.filter(s => s.kategori === "Menengah");
    }

    // Urutkan Bintang Terbanyak berdasarkan Periode Aktif
    categoryFiltered.sort((a, b) => {
      if (b.displayStars !== a.displayStars) return b.displayStars - a.displayStars;
      return b.displaySetoran - a.displaySetoran;
    });

    const finalFiltered = categoryFiltered.filter(s => {
      const matchSearch = s.nama.toLowerCase().includes(searchVal);
      const matchHalaqah = filterHalaqah ? s.halaqah === filterHalaqah : true;
      return matchSearch && matchHalaqah;
    });

    const badgeCount = document.getElementById("badgeTotalSantriCount");
    if (badgeCount) {
      badgeCount.textContent = `${finalFiltered.length} Santri`;
    }

    // Render Podium Top 3
    if (podiumContainer) {
      const top3 = categoryFiltered.slice(0, 3);
      if (top3.length >= 3) {
        const getPhotoHtml = (s) => {
          if (s.foto) {
            return `<img src="${s.foto}" class="podium-photo-img" alt="${s.nama}">`;
          }
          return `<span class="podium-photo-emoji">${s.avatar}</span>`;
        };

        let rank1BadgeText = "🏆 PENERIMA REWARD BULANAN";
        if (this.currentPeriodFilter === "pekanan") {
          rank1BadgeText = "🥇 BINTANG PEKAN INI";
        } else if (this.currentPeriodFilter === "semua") {
          rank1BadgeText = "👑 TERBANYAK AKUMULASI";
        }

        podiumContainer.innerHTML = `
          <!-- Rank 2: Silver -->
          <div class="podium-card podium-rank-2" onclick="App.openParentDetailDirectly('${top3[1].id}')" style="cursor:pointer;">
            <div class="podium-medal">🥈</div>
            <div class="podium-photo-wrapper">${getPhotoHtml(top3[1])}</div>
            <div class="podium-name" title="${top3[1].nama}">${top3[1].nama}</div>
            <div class="podium-halaqah">${top3[1].halaqah}</div>
            <div class="podium-stars">⭐ ${top3[1].displayStars} Bintang</div>
            <div style="font-size:0.7rem; font-weight:800; color:#64748b; margin-top:4px;">Peringkat #2 (${top3[1].periodLabel})</div>
          </div>

          <!-- Rank 1: Gold -->
          <div class="podium-card podium-rank-1" onclick="App.openParentDetailDirectly('${top3[0].id}')" style="cursor:pointer;">
            <div style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); font-size:1.4rem;">👑</div>
            <div class="podium-medal">🥇</div>
            <div class="podium-photo-wrapper">${getPhotoHtml(top3[0])}</div>
            <div class="podium-name" title="${top3[0].nama}">${top3[0].nama}</div>
            <div class="podium-halaqah">${top3[0].halaqah}</div>
            <div class="podium-stars" style="background:#fbbf24; color:#78350f;">⭐ ${top3[0].displayStars} Bintang</div>
            <div style="font-size:0.74rem; font-weight:900; color:#b45309; margin-top:4px; background:#fef3c7; padding:3px 8px; border-radius:99px; display:inline-block; border:1px solid #fde68a;">
              ${rank1BadgeText}
            </div>
          </div>

          <!-- Rank 3: Bronze -->
          <div class="podium-card podium-rank-3" onclick="App.openParentDetailDirectly('${top3[2].id}')" style="cursor:pointer;">
            <div class="podium-medal">🥉</div>
            <div class="podium-photo-wrapper">${getPhotoHtml(top3[2])}</div>
            <div class="podium-name" title="${top3[2].nama}">${top3[2].nama}</div>
            <div class="podium-halaqah">${top3[2].halaqah}</div>
            <div class="podium-stars">⭐ ${top3[2].displayStars} Bintang</div>
            <div style="font-size:0.7rem; font-weight:800; color:#c2410c; margin-top:4px;">Peringkat #3 (${top3[2].periodLabel})</div>
          </div>
        `;
      }
    }

    // Render Full List: DENGAN NOMOR URUT SAJA (No. 1, No. 2...)
    if (leaderboardList) {
      if (finalFiltered.length === 0) {
        leaderboardList.innerHTML = `
          <div style="text-align:center; padding:30px; background:#fff; border-radius:12px; color:var(--text-muted);">
            Tidak ditemukan santri dengan kriteria pencarian ini.
          </div>
        `;
        return;
      }

      leaderboardList.innerHTML = finalFiltered.map((s) => {
        const rankNumber = categoryFiltered.findIndex(item => item.id === s.id) + 1;
        let rankClass = "";
        let rewardBadge = "";

        if (rankNumber === 1) {
          rankClass = "rank-1";
          if (this.currentPeriodFilter === "bulanan") {
            rewardBadge = `<span class="meta-badge" style="background:#fef3c7; color:#92400e; border:1px solid #fde68a; font-weight:800;">🏆 Juara 1 (Penerima Reward Bulanan)</span>`;
          } else if (this.currentPeriodFilter === "pekanan") {
            rewardBadge = `<span class="meta-badge" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; font-weight:800;">🥇 Peringkat 1 Pekan Ini</span>`;
          } else {
            rewardBadge = `<span class="meta-badge" style="background:#f3e8ff; color:#6b21a8; border:1px solid #e9d5ff; font-weight:800;">👑 Peringkat 1 Akumulasi</span>`;
          }
        }

        const photoHtml = s.foto 
          ? `<img src="${s.foto}" class="santri-avatar-img" alt="${s.nama}">`
          : `<span class="santri-avatar-emoji">${s.avatar}</span>`;

        return `
          <div class="santri-rank-row" style="cursor: pointer;" title="Klik untuk lihat riwayat / ganti foto">
            <!-- Nomor Urut Peringkat -->
            <div class="rank-number-badge ${rankClass}" onclick="App.openParentDetailDirectly('${s.id}')">#${rankNumber}</div>
            
            <!-- Foto Santri -->
            <div class="santri-avatar-container" onclick="App.triggerPhotoUpload('${s.id}')" title="Klik untuk mengunggah foto ${s.nama}">
              ${photoHtml}
            </div>

            <div class="santri-info-col" onclick="App.openParentDetailDirectly('${s.id}')">
              <div class="santri-name-header">
                <span>${s.nama}</span>
                ${rewardBadge}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">
                ${s.halaqah} • <span class="meta-badge meta-badge-kategori">${s.kategori === "Dasar" ? "🌱 Kelas Dasar" : "🚀 Kelas Menengah"}</span>
              </div>
              <div class="santri-meta-badges">
                ${s.latestBacaanBadge}
                <span class="meta-badge meta-badge-quran">✨ Hafalan: ${s.latestHafalan}</span>
              </div>
            </div>

            <div class="santri-stars-col" onclick="App.openParentDetailDirectly('${s.id}')">
              <div class="total-stars-val">${s.displayStars} ⭐</div>
              <div class="total-setoran-count">${s.displaySetoran}x Setoran (${s.periodLabel})</div>
            </div>
          </div>
        `;
      }).join("");
    }
  },

  // 8. Fitur Upload Foto Santri (Khusus Admin Utama: Ustadz M. Fikri Haekal)
  setupPhotoUpload() {
    const fileInput = document.getElementById("globalPhotoInput");
    if (!fileInput) return;

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file || !this.targetPhotoSantriId) return;

      if (!SheetsService.isAdmin()) {
        this.showToast("Akses Terbatas: Hanya Ustadz M. Fikri Haekal yang berwenang mengubah foto santri.", "error");
        fileInput.value = "";
        this.targetPhotoSantriId = null;
        return;
      }

      this.compressAndSavePhoto(file, (compressedBase64) => {
        SheetsService.updateSantriPhoto(this.targetPhotoSantriId, compressedBase64);
        this.showToast("Foto santri berhasil diperbarui!", "success");
        
        this.renderLeaderboard();
        this.refreshParentPortalIfActive(this.targetPhotoSantriId);
        this.targetPhotoSantriId = null;
        fileInput.value = "";
      });
    });

    const parentHeroPhotoBox = document.getElementById("parentHeroPhotoBox");
    if (parentHeroPhotoBox) {
      parentHeroPhotoBox.addEventListener("click", () => {
        const santriId = document.getElementById("selectParentSantri")?.value;
        if (santriId) {
          this.triggerPhotoUpload(santriId);
        }
      });
    }
  },

  triggerPhotoUpload(santriId) {
    if (!SheetsService.isAdmin()) {
      this.showToast("Akses Khusus: Hanya Ustadz M. Fikri Haekal yang berwenang mengunggah/mengubah foto santri.", "info");
      return;
    }
    this.targetPhotoSantriId = santriId;
    const fileInput = document.getElementById("globalPhotoInput");
    if (fileInput) fileInput.click();
  },

  compressAndSavePhoto(file, callback) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 200; // Kompres ke ukuran optimal (~12KB)
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        callback(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  },

  // 9. Portal Pantauan Anak (Dipisahkan Berdasarkan Masing-Masing Kelas)
  setupParentPortal() {
    const selectParent = document.getElementById("selectParentSantri");
    if (selectParent) {
      selectParent.addEventListener("change", (e) => {
        const santriId = e.target.value;
        this.renderParentStudentDetail(santriId);
      });
    }

    // Filter Kelas di Portal Pantauan Anak (Permintaan User: Pisahkan pantauannya pada masing-masing kelas)
    const classPills = document.querySelectorAll("#parentClassFilterPills .pantauan-class-pill");
    classPills.forEach(pill => {
      pill.addEventListener("click", () => {
        classPills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.currentParentClassFilter = pill.dataset.class;
        this.refreshParentSantriList();
      });
    });

    const btnShareWA = document.getElementById("btnShareWhatsApp");
    if (btnShareWA) {
      btnShareWA.addEventListener("click", () => {
        const santriId = document.getElementById("selectParentSantri").value;
        this.shareStudentProgressWhatsApp(santriId);
      });
    }

    this.refreshParentSantriList();
  },

  refreshParentSantriList() {
    const selectParentSantri = document.getElementById("selectParentSantri");
    const chipsContainer = document.getElementById("parentQuickSantriChips");
    const allSantri = SheetsService.getAllSantri();
    const filterClass = this.currentParentClassFilter || "ALL";

    const filtered = filterClass === "ALL" 
      ? allSantri 
      : allSantri.filter(s => s.halaqah === filterClass);

    // Update Dropdown
    if (selectParentSantri) {
      const currentVal = selectParentSantri.value;
      selectParentSantri.innerHTML = `<option value="">-- Pilih Nama Ananda (${filtered.length} Santri) --</option>`;
      filtered.forEach((s, idx) => {
        selectParentSantri.add(new Option(`No. ${idx + 1} - ${s.nama} (${s.halaqah})`, s.id));
      });
      if (currentVal && filtered.some(s => s.id === currentVal)) {
        selectParentSantri.value = currentVal;
      }
    }

    // Update Quick Santri Chips (Tanpa icon wajah agar bersih dan tidak ramai)
    if (chipsContainer) {
      chipsContainer.innerHTML = filtered.map(s => `
        <button type="button" class="quick-santri-chip" onclick="App.openParentDetailDirectly('${s.id}')" title="Buka pantauan ${escapeHtml(s.nama)}">
          <span>${escapeHtml(s.nama)}</span>
        </button>
      `).join("");
    }
  },

  openParentDetailDirectly(santriId) {
    this.switchTab("tab-wali");
    const selectParent = document.getElementById("selectParentSantri");
    if (selectParent) {
      selectParent.value = santriId;
      this.renderParentStudentDetail(santriId);
      try {
        history.pushState({ screen: "studentDetail", santriId: santriId }, "");
      } catch (e) {}
    }
  },

  renderParentStudentDetail(santriId) {
    this.currentParentStudentId = santriId;
    const detailBox = document.getElementById("parentStudentDetail");
    const emptyBox = document.getElementById("parentEmptyState");

    if (!santriId) {
      if (detailBox) detailBox.style.display = "none";
      if (emptyBox) emptyBox.style.display = "block";
      return;
    }

    const allSantri = SheetsService.getAllSantri();
    const allRecords = SheetsService.getAllRecords();
    const santri = allSantri.find(s => s.id === santriId);

    if (!santri) return;

    const records = allRecords.filter(r => {
      if (!r) return false;
      if (r.santriId && santri.id && r.santriId === santri.id) return true;
      if (r.namaSantri && santri.nama && r.namaSantri.trim().toLowerCase() === santri.nama.trim().toLowerCase()) return true;
      return false;
    });

    const totalStars = records.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
    const latest = records.length > 0 ? records[0] : null;

    // Hitung Ranking di kategorinya
    const categorySantri = allSantri.filter(s => s.kategori === santri.kategori);
    const categoryRanks = categorySantri.map(s => {
      const recs = allRecords.filter(r => r.santriId === s.id || (r.namaSantri && s.nama && r.namaSantri.trim().toLowerCase() === s.nama.trim().toLowerCase()));
      const stars = recs.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
      return { id: s.id, stars };
    }).sort((a, b) => b.stars - a.stars);

    const rankIndex = categoryRanks.findIndex(item => item.id === santri.id) + 1;

    // Foto atau Avatar
    const avatarSpan = document.getElementById("parentHeroAvatar");
    const photoImg = document.getElementById("parentHeroImg");
    if (santri.foto) {
      photoImg.src = santri.foto;
      photoImg.style.display = "block";
      avatarSpan.style.display = "none";
    } else {
      avatarSpan.textContent = santri.avatar;
      avatarSpan.style.display = "block";
      photoImg.style.display = "none";
    }

    document.getElementById("parentHeroName").textContent = santri.nama;
    document.getElementById("parentHeroHalaqah").textContent = `${santri.halaqah} (Kategori ${santri.kategori})`;
    
    const btnEditSantri = document.getElementById("btnParentEditSantri");
    if (btnEditSantri) {
      btnEditSantri.onclick = () => this.openEditSantri(santri.id);
      btnEditSantri.style.display = SheetsService.isAdmin() ? "inline-flex" : "none";
    }
    
    const rankBadge = document.getElementById("parentHeroRankBadge");
    if (rankBadge) {
      if (rankIndex === 1) {
        rankBadge.textContent = `🥇 Juara 1 Kategori ${santri.kategori} • PENERIMA REWARD BULANAN 🏆`;
        rankBadge.style.background = "#fef3c7";
        rankBadge.style.color = "#92400e";
      } else {
        rankBadge.textContent = `⭐ Peringkat #${rankIndex} di Kategori ${santri.kategori}`;
        rankBadge.style.background = "#e0f2fe";
        rankBadge.style.color = "#0369a1";
      }
    }

    // Hitung Bintang Pekan Ini, Bulan Ini, dan Total (Memakai parseDateSafe yang robust)
    const weekRecords = records.filter(r => this.isDateInCurrentWeek(r.tanggal));
    const weekStars = weekRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
    const monthRecords = records.filter(r => this.isDateInCurrentMonth(r.tanggal));
    const monthStars = monthRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);

    const statWeek = document.getElementById("parentStatStarsWeek");
    const statMonth = document.getElementById("parentStatStarsMonth");
    const statTotal = document.getElementById("parentStatStars");

    if (statWeek) statWeek.textContent = `${weekStars} ⭐`;
    if (statMonth) statMonth.textContent = `${monthStars} ⭐`;
    if (statTotal) statTotal.textContent = `${totalStars} ⭐`;
    
    const statBacaan = document.getElementById("parentStatBacaan");
    if (statBacaan) {
      if (latest) {
        if (latest.bacaanTipe === "Tartil") {
          statBacaan.textContent = `Tartil Juz ${latest.tartilJuz}`;
          statBacaan.style.color = "#f43f7a";
        } else {
          statBacaan.textContent = latest.tamhidJilid || "Kitab Tamhid";
          statBacaan.style.color = "#0284c7";
        }
      } else {
        statBacaan.textContent = santri.statusBelajar || "Kitab Tamhid";
      }
    }

    // Render Timeline
    const timelineContainer = document.getElementById("parentTimelineContainer");
    if (timelineContainer) {
      if (records.length === 0) {
        timelineContainer.innerHTML = `
          <div style="background:#fff; padding:24px; text-align:center; border-radius:14px; color:var(--text-muted); border:1.5px solid var(--surface-border);">
            Belum ada catatan setoran mutaba'ah untuk ananda ini.
          </div>
        `;
      } else {
        timelineContainer.innerHTML = records.map(r => {
          const parsedDate = this.parseDateSafe(r.tanggal);
          const dateStr = parsedDate 
            ? parsedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
            : r.tanggal;

          let tilawahBoxHtml = "";
          if (r.bacaanTipe === "Tartil") {
            const tartilBadge = r.bacaanStatus === "Lanjut" 
              ? `<span class="meta-badge" style="background:#fff1f2; color:#be123c; border:1px solid #fecdd3;">✅ Lanjut Halaman</span>`
              : `<span class="meta-badge" style="background:#fef3c7; color:#92400e;">🔄 Ulang Halaman</span>`;

            tilawahBoxHtml = `
              <div class="timeline-subbox timeline-subbox-tartil">
                <div class="timeline-box-title" style="color:#be123c; display:flex; justify-content:space-between;">
                  <span>📜 Tartil Al-Qur'an</span>
                  ${tartilBadge}
                </div>
                <div style="font-weight:800; font-size:0.88rem; color:#9f1239;">
                  Juz ${escapeHtml(r.tartilJuz)}
                </div>
                <div style="font-size:0.78rem; color:#be123c; margin-top:2px;">Posisi: ${escapeHtml(r.tartilHalaman || "-")}</div>
                ${r.bacaanCatatan && r.bacaanCatatan !== "-" ? `<div style="font-size:0.75rem; color:#881337; margin-top:4px; font-style:italic;">Catatan: "${escapeHtml(r.bacaanCatatan)}"</div>` : ""}
              </div>
            `;
          } else {
            const tamhidBadge = r.bacaanStatus === "Lanjut" 
              ? `<span class="meta-badge" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;">✅ Lanjut</span>`
              : `<span class="meta-badge" style="background:#fef3c7; color:#92400e;">🔄 Ulang</span>`;

            tilawahBoxHtml = `
              <div class="timeline-subbox timeline-subbox-tamhid">
                <div class="timeline-box-title" style="color:#0369a1; display:flex; justify-content:space-between;">
                  <span>📚 Kitab Tamhid</span>
                  ${tamhidBadge}
                </div>
                <div style="font-weight:800; font-size:0.88rem; color:#0c4a6e;">${escapeHtml(r.tamhidJilid || "Tamhid")}</div>
                <div style="font-size:0.78rem; color:#0284c7; margin-top:2px;">Posisi: ${escapeHtml(r.tamhidHalaman || "-")}</div>
                ${r.bacaanCatatan && r.bacaanCatatan !== "-" ? `<div style="font-size:0.75rem; color:#0369a1; margin-top:4px; font-style:italic;">Catatan: "${escapeHtml(r.bacaanCatatan)}"</div>` : ""}
              </div>
            `;
          }

          const hafalanBadge = r.hafalanStatus === "Lulus"
            ? `<span class="meta-badge" style="background:#dcfce7; color:#166534; border:1px solid #bbf7d0;">✅ Lulus</span>`
            : `<span class="meta-badge" style="background:#fee2e2; color:#991b1b; border:1px solid #fecaca;">🔄 Perbaiki</span>`;

          // Tombol hapus setoran keliru: Bisa diakses langsung dengan konfirmasi PIN & hilangkan instan dari layar
          const delBtn = `<button type="button" class="btn-manage-del" onclick="App.deleteSetoranRecord('${escapeHtml(r.id)}', this)" style="padding:4px 10px; font-size:0.75rem; margin-left:8px; border-radius:6px; cursor:pointer;" title="Hapus catatan evaluasi ini jika terjadi keliru input">🗑️ Hapus</button>`;

          // Rincian Hafalan Ziyadah & Muroja'ah Terpisah
          let hafalanDetailsHtml = "";
          if (r.ziyadahSurah && r.murojaahSurah) {
            hafalanDetailsHtml = `
              <div style="font-weight:800; font-size:0.86rem; color:#78350f;">
                ⭐ Ziyadah: Surah ${escapeHtml(r.ziyadahSurah)} (Ayat ${r.ziyadahAyatAwal} - ${r.ziyadahAyatAkhir})
              </div>
              <div style="font-weight:700; font-size:0.82rem; color:#92400e; margin-top:3px;">
                🔄 Muroja'ah: Surah ${escapeHtml(r.murojaahSurah)} (Ayat ${r.murojaahAyatAwal} - ${r.murojaahAyatAkhir})
              </div>
            `;
          } else if (r.ziyadahSurah) {
            hafalanDetailsHtml = `
              <div style="font-weight:800; font-size:0.86rem; color:#78350f;">
                ⭐ Ziyadah: Surah ${escapeHtml(r.ziyadahSurah)} (Ayat ${r.ziyadahAyatAwal} - ${r.ziyadahAyatAkhir})
              </div>
              <div style="font-size:0.75rem; color:#64748b; font-weight:600; margin-top:3px;">
                (Hanya Setoran Ziyadah • Tanpa Muroja'ah)
              </div>
            `;
          } else if (r.murojaahSurah) {
            hafalanDetailsHtml = `
              <div style="font-weight:800; font-size:0.86rem; color:#92400e;">
                🔄 Muroja'ah: Surah ${escapeHtml(r.murojaahSurah)} (Ayat ${r.murojaahAyatAwal} - ${r.murojaahAyatAkhir})
              </div>
              <div style="font-size:0.75rem; color:#64748b; font-weight:600; margin-top:3px;">
                (Hanya Setoran Muroja'ah • Tanpa Ziyadah Baru)
              </div>
            `;
          } else if (r.surahAwal && r.surahAwal !== "-") {
            hafalanDetailsHtml = `
              <div style="font-weight:800; font-size:0.88rem; color:#78350f;">
                Surah ${escapeHtml(r.surahAwal)} (Ayat ${r.ayatAwal || 1} - ${r.ayatAkhir || 1})
              </div>
            `;
          } else {
            hafalanDetailsHtml = `
              <div style="font-size:0.8rem; color:#64748b; font-style:italic;">
                (Fokus Bimbingan Tilawah/Tartil)
              </div>
            `;
          }

          return `
            <div class="timeline-card">
              <div class="timeline-header">
                <span class="timeline-date">📅 ${escapeHtml(dateStr)}</span>
                <div style="display:flex; align-items:center;">
                  <span class="timeline-ustadz">${escapeHtml(r.ustadz || "Pengampu RQ")}</span>
                  ${delBtn}
                </div>
              </div>

              <div class="timeline-body-grid">
                ${tilawahBoxHtml}

                <div class="timeline-subbox timeline-subbox-quran">
                  <div class="timeline-box-title" style="color:#92400e; display:flex; justify-content:space-between;">
                    <span>✨ ${r.hafalanJenis || "Hafalan"} Al-Qur'an</span>
                    ${hafalanBadge}
                  </div>
                  ${hafalanDetailsHtml}
                  <div class="timeline-result-badge">
                    <span>⭐ +${r.totalBintang || 0} Bintang</span>
                  </div>
                </div>
              </div>

              ${r.hafalanCatatan && r.hafalanCatatan !== "-" ? `
                <div class="timeline-notes">
                  <strong>Catatan Evaluasi:</strong> "${escapeHtml(r.hafalanCatatan)}"
                </div>
              ` : ""}
            </div>
          `;
        }).join("");
      }
    }

    if (emptyBox) emptyBox.style.display = "none";
    if (detailBox) detailBox.style.display = "block";
  },

  refreshParentPortalIfActive(santriId) {
    const selectParent = document.getElementById("selectParentSantri");
    if (selectParent && selectParent.value === santriId) {
      this.renderParentStudentDetail(santriId);
    }
  },

  shareStudentProgressWhatsApp(santriId) {
    const allSantri = SheetsService.getAllSantri();
    const allRecords = SheetsService.getAllRecords();
    const santri = allSantri.find(s => s.id === santriId);
    if (!santri) return;

    const records = allRecords.filter(r => r.santriId === santri.id || r.namaSantri === santri.nama);
    const totalStars = records.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
    const weekRecords = records.filter(r => this.isDateInCurrentWeek(r.tanggal));
    const weekStars = weekRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
    const monthRecords = records.filter(r => this.isDateInCurrentMonth(r.tanggal));
    const monthStars = monthRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
    const latest = records.length > 0 ? records[0] : null;

    let text = `*LAPORAN MUTABA'AH HAFALAN & TILAWAH SANTRI*\n`;
    text += `*RQ UMMUL QASIM*\n`;
    text += `------------------------------------\n`;
    text += `👤 *Nama Santri:* ${santri.nama}\n`;
    text += `🏫 *Kelas:* ${santri.halaqah} (Kategori ${santri.kategori})\n`;
    text += `📅 *Bintang Pekan Ini:* ${weekStars} ⭐ (${weekRecords.length}x setoran)\n`;
    text += `🏆 *Bintang Bulan Ini:* ${monthStars} ⭐ (${monthRecords.length}x setoran)\n`;
    text += `🌟 *Total Akumulasi Bintang:* ${totalStars} ⭐\n`;
    
    if (latest) {
      text += `📅 *Evaluasi Terakhir:* ${latest.tanggal}\n`;
      if (latest.bacaanTipe === "Tartil") {
        text += `📜 *Tartil Al-Qur'an:* Juz ${latest.tartilJuz} / ${latest.tartilHalaman} (${latest.bacaanStatus})\n`;
      } else {
        text += `📚 *Kitab Tamhid:* ${latest.tamhidJilid} - ${latest.tamhidHalaman} (${latest.bacaanStatus})\n`;
      }
      text += `✨ *Hafalan Quran:* ${latest.hafalanJenis} Surah ${latest.surahAwal} (Ayat ${latest.ayatAwal}-${latest.ayatAkhir})\n`;
      text += `🎯 *Nilai Mutu:* Tajwid ★${latest.bintangTajwid}, Kelancaran ★${latest.bintangKelancaran}, Makhraj ★${latest.bintangMakhraj}\n`;
      if (latest.hafalanCatatan && latest.hafalanCatatan !== "-") {
        text += `💬 *Pesan Ustadz:* "${latest.hafalanCatatan}"\n`;
      }
    }
    text += `------------------------------------\n`;
    text += `Semoga Allah memberkahi ananda dalam menuntut ilmu Al-Qur'an. Aamiin 🤲\n`;
    text += `_RQ Ummul Qasim - Menjaga Generasi Qur'ani_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  },

  // 10. Modal Pengaturan
  setupSettingsModal() {
    const modal = document.getElementById("modalSettings");
    const btnOpen = document.getElementById("btnOpenSettings");
    const statusPill = document.getElementById("sheetStatusPill");
    const closeBtns = document.querySelectorAll('[data-close="modalSettings"]');
    const inputUrl = document.getElementById("inputSheetsUrl");
    const btnSave = document.getElementById("btnSaveSheets");
    const btnTest = document.getElementById("btnTestSheets");
    const btnCopy = document.getElementById("btnCopyScript");
    const codeBlock = document.getElementById("scriptCodeBlock");
    const inputAdminPin = document.getElementById("inputAdminPin");
    const inputTeacherPin = document.getElementById("inputTeacherPin");
    const btnSaveNewPin = document.getElementById("btnSaveNewPin");

    if (codeBlock) {
      codeBlock.textContent = `// SCRIPT GOOGLE APPS SCRIPT UNTUK RQ UMMUL QASIM
const SHEET_NAME_SETORAN = "Data_Setoran";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, SHEET_NAME_SETORAN);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return createJsonResponse({ status: "success", data: [] });
    
    const headers = data[0];
    const rows = [];
    for (let i = 1; i < data.length; i++) {
      const rowObj = {};
      for (let j = 0; j < headers.length; j++) {
        rowObj[headers[j]] = data[i][j];
      }
      rows.push(rowObj);
    }
    return createJsonResponse({ status: "success", total: rows.length, data: rows });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, SHEET_NAME_SETORAN);
    const payload = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : e.parameter;
    const timestamp = new Date();
    
    const row = [
      payload.id || Utilities.getUuid(),
      timestamp,
      payload.tanggal || Utilities.formatDate(timestamp, "GMT+7", "yyyy-MM-dd"),
      payload.namaSantri || "-",
      payload.halaqah || "-",
      payload.kategori || "-",
      payload.ustadz || "-",
      payload.bacaanTipe || "Tamhid",
      payload.tamhidJilid || "-",
      payload.tamhidHalaman || "-",
      payload.tartilJuz || "-",
      payload.tartilHalaman || "-",
      payload.bacaanStatus || "Lanjut",
      payload.bacaanCatatan || "-",
      payload.hafalanJenis || "Ziyadah",
      payload.surahAwal || "-",
      payload.ayatAwal || 1,
      payload.surahAkhir || "-",
      payload.ayatAkhir || 1,
      Number(payload.bintangTajwid || 0),
      Number(payload.bintangKelancaran || 0),
      Number(payload.bintangMakhraj || 0),
      Number(payload.totalBintang || 0),
      payload.hafalanStatus || "Lulus",
      payload.hafalanCatatan || "-"
    ];
    sheet.appendRow(row);
    return createJsonResponse({ status: "success", message: "Tersimpan", data: payload });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = [
      "ID", "Timestamp", "Tanggal", "Nama Santri", "Kelas", "Kategori", "Ustadz",
      "Tipe Tilawah", "Tamhid Jilid", "Tamhid Halaman", "Tartil Juz", "Tartil Halaman",
      "Status Tilawah", "Catatan Tilawah",
      "Jenis Hafalan", "Surah Awal", "Ayat Awal", "Surah Akhir", "Ayat Akhir",
      "Bintang Tajwid", "Bintang Kelancaran", "Bintang Makhraj", "Total Bintang",
      "Status Hafalan", "Catatan Hafalan"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;
    }

    if (btnCopy) {
      btnCopy.addEventListener("click", () => {
        if (codeBlock) {
          navigator.clipboard.writeText(codeBlock.textContent).then(() => {
            this.showToast("Kode Google Apps Script berhasil disalin!", "success");
          });
        }
      });
    }

    const openModal = () => {
      if (!SheetsService.isAdmin()) {
        this.showToast("Akses Khusus: Menu Pengaturan hanya dapat diakses oleh Ustadz M. Fikri Haekal, C.LQ.", "error");
        return;
      }
      const settings = SheetsService.getSettings();
      if (inputUrl) inputUrl.value = settings.endpointUrl || "";
      if (inputAdminPin) inputAdminPin.value = SheetsService.getAdminPin();
      if (inputTeacherPin) inputTeacherPin.value = SheetsService.getTeacherPin();
      modal.classList.add("active");
    };

    if (btnOpen) btnOpen.addEventListener("click", openModal);
    if (statusPill) statusPill.addEventListener("click", openModal);

    closeBtns.forEach(btn => {
      btn.addEventListener("click", () => modal.classList.remove("active"));
    });

    if (btnSaveNewPin) {
      btnSaveNewPin.addEventListener("click", () => {
        if (!SheetsService.isAdmin()) {
          this.showToast("Akses Ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang mengubah sandi!", "error");
          return;
        }
        const adminPin = inputAdminPin ? inputAdminPin.value.trim() : "";
        const teacherPin = inputTeacherPin ? inputTeacherPin.value.trim() : "";
        if (!adminPin || !teacherPin) {
          this.showToast("Sandi Admin dan Sandi Pengajar tidak boleh kosong!", "error");
          return;
        }
        const res = SheetsService.setSecurityPins(adminPin, teacherPin);
        if (res.success) {
          this.showToast("Sandi Admin Utama & Sandi Pengajar berhasil diperbarui! 🔑", "success");
        } else {
          this.showToast(res.message, "error");
        }
      });
    }

    if (btnSave) {
      btnSave.addEventListener("click", () => {
        if (!SheetsService.isAdmin()) {
          this.showToast("Akses Ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang mengubah integrasi spreadsheet!", "error");
          return;
        }
        const url = inputUrl.value.trim();
        const settings = SheetsService.getSettings();
        settings.endpointUrl = url;
        SheetsService.saveSettings(settings);

        this.updateSheetsStatusIndicator();
        this.showToast("URL Google Apps Script berhasil disimpan!", "success");
        modal.classList.remove("active");

        if (url) {
          this.tryBackgroundRemoteSync();
        }
      });
    }

    if (btnTest) {
      btnTest.addEventListener("click", async () => {
        const url = inputUrl.value.trim();
        if (!url) {
          this.showToast("Masukkan URL Google Apps Script terlebih dahulu!", "error");
          return;
        }
        btnTest.disabled = true;
        btnTest.textContent = "Menguji...";
        const res = await SheetsService.testConnection(url);
        btnTest.disabled = false;
        btnTest.textContent = "🔍 Tes Koneksi";

        if (res.ok) {
          this.showToast(res.message, "success");
        } else {
          this.showToast(res.message, "error");
        }
      });
    }
  },

  updateSheetsStatusIndicator() {
    const endpoint = SheetsService.getEndpoint();
    const dot = document.getElementById("sheetStatusDot");
    const label = document.getElementById("sheetStatusLabel");

    if (dot && label) {
      if (endpoint) {
        dot.className = "status-dot";
        label.textContent = "Spreadsheet Terhubung";
      } else {
        dot.className = "status-dot offline";
        label.textContent = "Spreadsheet";
      }
    }
  },

  async tryBackgroundRemoteSync() {
    const endpoint = SheetsService.getEndpoint();
    if (!endpoint) return;

    try {
      const remote = await SheetsService.fetchRemoteRecords();
      if (remote && remote.length > 0) {
        this.renderLeaderboard();
        this.renderParentPortal();
      }
      this.updateSheetsStatusIndicator();
    } catch (e) {
      console.log("Remote sync silent error:", e);
    }
  },

  startRealtimePolling() {
    // Sinkronisasi realtime otomatis setiap 20 detik agar orang tua di rumah mendapatkan data terkini
    setInterval(() => {
      this.tryBackgroundRemoteSync();
    }, 20000);
  },

  // 11. Modal Tambah & Kelola Santri (Khusus Ustadz M. Fikri Haekal)
  setupAddSantriModal() {
    const modal = document.getElementById("modalAddSantri");
    const btnOpen = document.getElementById("btnAddSantriModal");
    const closeBtns = document.querySelectorAll('[data-close="modalAddSantri"]');
    const btnSubtabAdd = document.getElementById("btnSubtabAddSantri");
    const btnSubtabManage = document.getElementById("btnSubtabManageSantri");
    const halaqahSelect = document.getElementById("newSantriHalaqah");
    const searchInput = document.getElementById("searchManageSantri");

    if (halaqahSelect) {
      halaqahSelect.innerHTML = MASTER_HALAQAH.map(h => `<option value="${h}">${h}</option>`).join("");
    }

    if (btnOpen) {
      btnOpen.addEventListener("click", () => {
        if (!SheetsService.isAdmin()) {
          this.showToast("Akses Terbatas: Hanya Ustadz M. Fikri Haekal yang berwenang menambah & mengelola santri.", "error");
          return;
        }
        this.switchSantriModalSubtab("add");
        modal.classList.add("active");
      });
    }

    closeBtns.forEach(btn => {
      btn.addEventListener("click", () => modal.classList.remove("active"));
    });

    if (btnSubtabAdd) {
      btnSubtabAdd.addEventListener("click", () => this.switchSantriModalSubtab("add"));
    }
    if (btnSubtabManage) {
      btnSubtabManage.addEventListener("click", () => this.switchSantriModalSubtab("manage"));
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => this.renderManageSantriList());
    }
  },

  switchSantriModalSubtab(tab) {
    const panelAdd = document.getElementById("panelAddSantri");
    const panelManage = document.getElementById("panelManageSantri");
    const btnAdd = document.getElementById("btnSubtabAddSantri");
    const btnManage = document.getElementById("btnSubtabManageSantri");

    if (tab === "add") {
      if (panelAdd) panelAdd.style.display = "block";
      if (panelManage) panelManage.style.display = "none";
      if (btnAdd) btnAdd.classList.add("active");
      if (btnManage) btnManage.classList.remove("active");
    } else {
      if (panelAdd) panelAdd.style.display = "none";
      if (panelManage) panelManage.style.display = "block";
      if (btnAdd) btnAdd.classList.remove("active");
      if (btnManage) btnManage.classList.add("active");
      this.renderManageSantriList();
    }
  },

  renderManageSantriList() {
    const container = document.getElementById("manageSantriListContainer");
    const badge = document.getElementById("totalSantriBadge");
    const searchVal = (document.getElementById("searchManageSantri")?.value || "").toLowerCase().trim();
    const allSantri = SheetsService.getAllSantri();

    if (badge) badge.textContent = allSantri.length;
    if (!container) return;

    let filtered = allSantri;
    if (searchVal) {
      filtered = filtered.filter(s => s.nama.toLowerCase().includes(searchVal) || s.halaqah.toLowerCase().includes(searchVal));
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 25px; color: var(--text-muted); background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
          Tidak ada santri yang cocok dengan pencarian "${searchVal}"
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(s => {
      const avatarHtml = s.foto 
        ? `<img src="${s.foto}" alt="${s.nama}">` 
        : `<span>${s.avatar || "👦🏻"}</span>`;
      return `
        <div class="manage-santri-row">
          <div class="manage-santri-info">
            <div class="manage-santri-avatar" onclick="App.triggerPhotoUpload('${s.id}')" style="cursor: pointer;" title="Klik untuk ganti foto">
              ${avatarHtml}
            </div>
            <div class="manage-santri-details">
              <div class="manage-santri-name">${s.nama}</div>
              <div class="manage-santri-sub">${s.halaqah} • ${s.statusBelajar || "Tamhid"}</div>
            </div>
          </div>
          <div class="manage-santri-actions">
            <button type="button" class="btn-manage-edit" onclick="App.openEditSantri('${s.id}')" title="Edit data santri">
              ✏️ Edit
            </button>
            <button type="button" class="btn-manage-del" onclick="App.deleteSantriDirect('${s.id}')" title="Hapus santri ini">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join("");
  },

  // 12. Modal Edit Data Santri (Khusus Ustadz M. Fikri Haekal)
  setupEditSantriModal() {
    const modal = document.getElementById("modalEditSantri");
    const closeBtns = document.querySelectorAll('[data-close="modalEditSantri"]');
    const editHalaqahSelect = document.getElementById("editSantriHalaqah");

    if (editHalaqahSelect) {
      editHalaqahSelect.innerHTML = MASTER_HALAQAH.map(h => `<option value="${h}">${h}</option>`).join("");
    }

    closeBtns.forEach(btn => {
      btn.addEventListener("click", () => modal && modal.classList.remove("active"));
    });
  },

  openEditSantri(santriId) {
    if (!SheetsService.isAdmin()) {
      this.showToast("Akses Terbatas: Hanya Ustadz M. Fikri Haekal yang berwenang mengedit data santri.", "error");
      return;
    }
    const santri = SheetsService.getAllSantri().find(s => s.id === santriId);
    if (!santri) return;

    const modal = document.getElementById("modalEditSantri");
    const inputId = document.getElementById("editSantriId");
    const inputNama = document.getElementById("editSantriNama");
    const selectHalaqah = document.getElementById("editSantriHalaqah");
    const selectJenjang = document.getElementById("editSantriJenjang");
    const avatarRadios = document.querySelectorAll('input[name="editSantriAvatar"]');

    if (inputId) inputId.value = santri.id;
    if (inputNama) inputNama.value = santri.nama;
    if (selectHalaqah) selectHalaqah.value = santri.halaqah;
    if (selectJenjang) selectJenjang.value = santri.statusBelajar || "Tamhid";

    avatarRadios.forEach(radio => {
      radio.checked = (radio.value === santri.avatar);
    });

    if (modal) modal.classList.add("active");
  },

  submitEditSantri(event) {
    if (event) event.preventDefault();
    if (!SheetsService.isAdmin()) {
      this.showToast("Akses Ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang mengubah data santri.", "error");
      return;
    }

    const id = document.getElementById("editSantriId")?.value;
    const nama = document.getElementById("editSantriNama")?.value.trim();
    const halaqah = document.getElementById("editSantriHalaqah")?.value;
    const statusBelajar = document.getElementById("editSantriJenjang")?.value;
    const avatar = document.querySelector('input[name="editSantriAvatar"]:checked')?.value || "👦🏻";

    if (!id || !nama) {
      this.showToast("Nama santri tidak boleh kosong!", "error");
      return;
    }

    const kategori = (CLASS_TEACHER_MAP[halaqah] && CLASS_TEACHER_MAP[halaqah].kategori) ? CLASS_TEACHER_MAP[halaqah].kategori : "Menengah";

    try {
      SheetsService.updateSantri(id, { nama, halaqah, kategori, statusBelajar, avatar });
      this.refreshSantriDropdowns();
      this.renderLeaderboard();
      this.renderParentPortal();
      this.renderManageSantriList();

      const modal = document.getElementById("modalEditSantri");
      if (modal) modal.classList.remove("active");

      this.showToast(`Data santri "${nama}" berhasil diperbarui! ✅`, "success");
    } catch (e) {
      this.showToast("Gagal memperbarui santri: " + e.message, "error");
    }
  },

  confirmDeleteSantri() {
    const id = document.getElementById("editSantriId")?.value;
    const nama = document.getElementById("editSantriNama")?.value;
    if (!id) return;
    if (!SheetsService.isAdmin()) {
      this.showToast("Akses Ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang menghapus santri.", "error");
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus santri "${nama}" dari database?`)) {
      try {
        SheetsService.deleteSantri(id);
        this.refreshSantriDropdowns();
        this.renderLeaderboard();
        this.renderParentPortal();
        this.renderManageSantriList();

        const modal = document.getElementById("modalEditSantri");
        if (modal) modal.classList.remove("active");

        this.showToast(`Santri "${nama}" telah dihapus.`, "success");
      } catch (e) {
        this.showToast("Gagal menghapus santri: " + e.message, "error");
      }
    }
  },

  deleteSantriDirect(santriId) {
    if (!SheetsService.isAdmin()) {
      this.showToast("Akses Ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang menghapus santri.", "error");
      return;
    }
    const santri = SheetsService.getAllSantri().find(s => s.id === santriId);
    const nama = santri ? santri.nama : "santri ini";

    if (confirm(`Apakah Anda yakin ingin menghapus santri "${nama}"?`)) {
      try {
        SheetsService.deleteSantri(santriId);
        this.refreshSantriDropdowns();
        this.renderLeaderboard();
        this.renderParentPortal();
        this.renderManageSantriList();
        this.showToast(`Santri "${nama}" berhasil dihapus.`, "success");
      } catch (e) {
        this.showToast("Gagal menghapus santri: " + e.message, "error");
      }
    }
  },

  async deleteSetoranRecord(recordId, btnEl = null) {
    let bypassAuth = false;

    // Verifikasi keamanan jika belum login
    if (!SheetsService.isUstadzLoggedIn()) {
      const pin = prompt("Konfirmasi Keamanan Pengajar / Admin:\nMasukkan PIN Anda untuk menghapus catatan setoran ini:");
      if (!pin) return;
      const verify = SheetsService.verifyAnyPin(pin);
      if (!verify.valid) {
        this.showToast("PIN salah! Penghapusan dibatalkan demi keamanan.", "error");
        return;
      }
      bypassAuth = true;
      // Simpan status otentikasi agar pengajar tidak perlu mengetik PIN berulang kali
      localStorage.setItem("rq_ummul_qasim_auth_session_v4", "true");
    } else {
      if (!confirm("Apakah Anda yakin ingin menghapus catatan evaluasi ini? Data yang terhapus tidak dapat dikembalikan.")) {
        return;
      }
    }

    // Efek visual seketika: langsung hilangkan baris item dari layar (0 delay UX)
    if (btnEl) {
      const rowItem = btnEl.closest(".recent-setoran-item") || btnEl.closest(".timeline-card");
      if (rowItem) {
        rowItem.style.transition = "all 0.2s ease-out";
        rowItem.style.opacity = "0";
        rowItem.style.transform = "scale(0.92)";
        rowItem.style.maxHeight = "0";
        rowItem.style.padding = "0";
        rowItem.style.margin = "0";
        rowItem.style.overflow = "hidden";
        setTimeout(() => rowItem.remove(), 200);
      }
    }

    try {
      const res = await SheetsService.deleteRecord(recordId, bypassAuth);
      if (res.success) {
        this.renderLeaderboard();
        this.renderParentPortal();
        this.renderRecentSetoranList();
        if (this.currentParentStudentId) {
          this.renderParentStudentDetail(this.currentParentStudentId);
        }
        this.showToast("Catatan evaluasi setoran berhasil dihapus permanen. 🗑️", "success");
      } else {
        this.showToast(res.message || "Gagal menghapus catatan setoran.", "error");
      }
    } catch (err) {
      console.error("Error deleting setoran:", err);
      this.showToast("Terjadi kendala saat menghapus: " + err.message, "error");
    }
  },

  // Fungsi Tambah Santri Langsung (Khusus Ustadz M. Fikri Haekal)
  submitNewSantriManual(event) {
    if (event) event.preventDefault();

    if (!SheetsService.isAdmin()) {
      this.showToast("Akses Ditolak: Hanya Ustadz M. Fikri Haekal yang berwenang menginput data santri baru!", "error");
      return;
    }

    const namaInput = document.getElementById("newSantriNama");
    const halaqahSelect = document.getElementById("newSantriHalaqah");
    const statusSelect = document.getElementById("newSantriJenjang");
    const photoFileInput = document.getElementById("newSantriFoto");
    const avatarRadio = document.querySelector('input[name="santriAvatar"]:checked');
    const modal = document.getElementById("modalAddSantri");
    const form = document.getElementById("formAddSantri");

    const nama = namaInput ? namaInput.value.trim() : "";
    if (!nama) {
      this.showToast("Mohon masukkan nama lengkap santri!", "error");
      if (namaInput) namaInput.focus();
      return;
    }

    const halaqah = halaqahSelect ? halaqahSelect.value : "Kelas Menengah Ikhwan";
    const kategori = (CLASS_TEACHER_MAP[halaqah] && CLASS_TEACHER_MAP[halaqah].kategori) ? CLASS_TEACHER_MAP[halaqah].kategori : "Menengah";
    const statusBelajar = statusSelect ? statusSelect.value : "Tamhid";
    const avatar = avatarRadio ? avatarRadio.value : "👦🏻";
    const photoFile = photoFileInput?.files?.[0];

    const finalizeAdd = (fotoData = "") => {
      try {
        const newSantri = {
          id: "S" + Date.now(),
          nama,
          halaqah,
          kategori,
          avatar,
          foto: fotoData,
          statusBelajar
        };

        SheetsService.addSantri(newSantri);
        this.refreshSantriDropdowns();
        this.renderLeaderboard();
        this.renderManageSantriList();

        this.showToast(`Santri "${nama}" berhasil ditambahkan ke ${halaqah}! 🎉`, "success");
        if (form) form.reset();
        if (modal) modal.classList.remove("active");

        // Otomatis pilih santri yang baru ditambahkan di formulir input setoran
        const selectSantri = document.getElementById("selectSantri");
        if (selectSantri) {
          selectSantri.value = newSantri.id;
        }
      } catch (err) {
        console.error("Gagal simpan santri:", err);
        this.showToast("Gagal menyimpan santri: " + err.message, "error");
      }
    };

    if (photoFile) {
      this.compressAndSavePhoto(photoFile, (compressedBase64) => {
        finalizeAdd(compressedBase64);
      });
    } else {
      finalizeAdd("");
    }
  },

  showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "✅" : "⚠️";
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // ===================================================================
  // 14. MODUL FOLDER HADITS PENDEK PILIHAN (KHUSUS ANAK SD - SHOHIH)
  // ===================================================================
  setupHaditsModule() {
    this.renderHaditsCategories();
    this.renderHaditsList();

    const searchInput = document.getElementById("searchHadits");
    if (searchInput) {
      searchInput.addEventListener("input", () => this.renderHaditsList());
    }
  },

  renderHaditsCategories() {
    const container = document.getElementById("haditsCategoryContainer");
    if (!container || typeof MASTER_HADITS === "undefined") return;

    const categories = ["Semua", ...new Set(MASTER_HADITS.map(h => h.kategori))];
    container.innerHTML = categories.map(cat => `
      <button type="button" class="materi-tag-btn ${cat === this.haditsFilterCategory ? "active" : ""}" data-cat="${cat}">
        ${cat}
      </button>
    `).join("");

    container.querySelectorAll(".materi-tag-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".materi-tag-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.haditsFilterCategory = btn.dataset.cat;
        this.renderHaditsList();
      });
    });
  },

  renderHaditsList() {
    const container = document.getElementById("haditsListContainer");
    const countBadge = document.getElementById("badgeHaditsCount");
    const searchVal = (document.getElementById("searchHadits")?.value || "").toLowerCase().trim();

    if (!container || typeof MASTER_HADITS === "undefined") return;

    let filtered = MASTER_HADITS;
    if (this.haditsFilterCategory && this.haditsFilterCategory !== "Semua") {
      filtered = filtered.filter(h => h.kategori === this.haditsFilterCategory);
    }

    if (searchVal) {
      filtered = filtered.filter(h => 
        h.judul.toLowerCase().includes(searchVal) ||
        h.latin.toLowerCase().includes(searchVal) ||
        h.arti.toLowerCase().includes(searchVal) ||
        h.riwayat.toLowerCase().includes(searchVal) ||
        h.kategori.toLowerCase().includes(searchVal)
      );
    }

    if (countBadge) {
      countBadge.textContent = `${filtered.length} Hadits`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding:40px; background:#fff; border-radius:12px; color:var(--text-muted); border:1.5px dashed #bae6fd;">
          <span style="font-size:2.5rem; display:block; margin-bottom:8px;">🔍</span>
          <p style="font-weight:700;">Tidak ditemukan hadits yang sesuai pencarian "${searchVal}"</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(h => `
      <div class="materi-card">
        <div>
          <div class="materi-card-header">
            <div class="materi-card-title-group">
              <span class="materi-num-badge">#${h.nomor}</span>
              <h3 class="materi-card-title">${h.judul}</h3>
            </div>
            <span class="materi-category-badge">${h.kategori}</span>
          </div>

          <div class="materi-arabic">${h.arab}</div>
          <div class="materi-latin">"${h.latin}"</div>
          <div class="materi-arti"><strong>Artinya:</strong> "${h.arti}"</div>
          
          <div class="materi-source">
            <span>📚</span>
            <span>Riwayat: ${h.riwayat}</span>
          </div>

          ${h.penjelasan ? `
            <div class="materi-keutamaan">
              💡 <strong>Bimbingan untuk Anak:</strong> ${h.penjelasan}
            </div>
          ` : ""}
        </div>

        <div class="materi-actions">
          <button type="button" class="btn-materi-action" onclick="App.copyHaditsToClipboard('${h.id}')" title="Salin teks hadits">
            <span>📋 Salin Teks</span>
          </button>
          <button type="button" class="btn-materi-action btn-materi-wa" onclick="App.shareHaditsWhatsApp('${h.id}')" title="Kirim ke WhatsApp Wali Santri">
            <span>💬 Bagikan ke WA</span>
          </button>
        </div>
      </div>
    `).join("");
  },

  copyHaditsToClipboard(id) {
    const h = MASTER_HADITS.find(item => item.id === id);
    if (!h) return;

    const text = `*HADITS HAFALAN RQ UMMUL QASIM* 📜\n*${h.nomor}. ${h.judul}*\n\n${h.arab}\n\n_${h.latin}_\n\nArtinya:\n"${h.arti}"\n\n📚 ${h.riwayat}\n💡 ${h.penjelasan || ""}\n\n_Rumah Qur'an Ummul Qasim_`;
    this.copyToClipboard(text, `Hadits "${h.judul}" berhasil disalin! 📋`);
  },

  shareHaditsWhatsApp(id) {
    const h = MASTER_HADITS.find(item => item.id === id);
    if (!h) return;

    const text = `*HADITS HAFALAN RQ UMMUL QASIM* 📜\n*${h.nomor}. ${h.judul}*\n\n${h.arab}\n\n_${h.latin}_\n\nArtinya:\n"${h.arti}"\n\n📚 ${h.riwayat}\n💡 ${h.penjelasan || ""}\n\n_Rumah Qur'an Ummul Qasim - Menjaga Generasi Qur'ani_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  },

  // ===================================================================
  // 15. MODUL FOLDER DO'A-DO'A HARIAN (KHUSUS ANAK SD - SHOHIH)
  // ===================================================================
  setupDoaModule() {
    this.renderDoaCategories();
    this.renderDoaList();

    const searchInput = document.getElementById("searchDoa");
    if (searchInput) {
      searchInput.addEventListener("input", () => this.renderDoaList());
    }
  },

  renderDoaCategories() {
    const container = document.getElementById("doaCategoryContainer");
    if (!container || typeof MASTER_DOA === "undefined") return;

    const categories = ["Semua", ...new Set(MASTER_DOA.map(d => d.kategori))];
    container.innerHTML = categories.map(cat => `
      <button type="button" class="materi-tag-btn ${cat === this.doaFilterCategory ? "active" : ""}" data-cat="${cat}">
        ${cat}
      </button>
    `).join("");

    container.querySelectorAll(".materi-tag-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".materi-tag-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.doaFilterCategory = btn.dataset.cat;
        this.renderDoaList();
      });
    });
  },

  renderDoaList() {
    const container = document.getElementById("doaListContainer");
    const countBadge = document.getElementById("badgeDoaCount");
    const searchVal = (document.getElementById("searchDoa")?.value || "").toLowerCase().trim();

    if (!container || typeof MASTER_DOA === "undefined") return;

    let filtered = MASTER_DOA;
    if (this.doaFilterCategory && this.doaFilterCategory !== "Semua") {
      filtered = filtered.filter(d => d.kategori === this.doaFilterCategory);
    }

    if (searchVal) {
      filtered = filtered.filter(d => 
        d.judul.toLowerCase().includes(searchVal) ||
        d.latin.toLowerCase().includes(searchVal) ||
        d.arti.toLowerCase().includes(searchVal) ||
        d.riwayat.toLowerCase().includes(searchVal) ||
        d.kategori.toLowerCase().includes(searchVal)
      );
    }

    if (countBadge) {
      countBadge.textContent = `${filtered.length} Do'a`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding:40px; background:#fff; border-radius:12px; color:var(--text-muted); border:1.5px dashed #fecdd3;">
          <span style="font-size:2.5rem; display:block; margin-bottom:8px;">🔍</span>
          <p style="font-weight:700;">Tidak ditemukan do'a yang sesuai pencarian "${searchVal}"</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(d => `
      <div class="materi-card" style="border-color: #fce7f3;">
        <div>
          <div class="materi-card-header">
            <div class="materi-card-title-group">
              <span class="materi-num-badge" style="background:#fce7f3; color:#be185d;">#${d.nomor}</span>
              <h3 class="materi-card-title">${d.judul}</h3>
            </div>
            <span class="materi-category-badge" style="background:#fdf2f8; color:#9d174d; border-color:#fbcfe8;">${d.kategori}</span>
          </div>

          <div class="materi-arabic" style="border-right-color: #f43f7a;">${d.arab}</div>
          <div class="materi-latin" style="color:#be185d; background:#fdf2f8; border-left-color:#f43f7a;">"${d.latin}"</div>
          <div class="materi-arti"><strong>Artinya:</strong> "${d.arti}"</div>
          
          <div class="materi-source">
            <span>📖</span>
            <span>Sumber: ${d.riwayat}</span>
          </div>

          ${d.keutamaan ? `
            <div class="materi-keutamaan" style="color:#831843; background:#fff1f2; border-color:#fecdd3;">
              ✨ <strong>Keutamaan & Adab:</strong> ${d.keutamaan}
            </div>
          ` : ""}
        </div>

        <div class="materi-actions">
          <button type="button" class="btn-materi-action" onclick="App.copyDoaToClipboard('${d.id}')" title="Salin teks do'a">
            <span>📋 Salin Teks</span>
          </button>
          <button type="button" class="btn-materi-action btn-materi-wa" onclick="App.shareDoaWhatsApp('${d.id}')" title="Kirim ke WhatsApp Wali Santri">
            <span>💬 Bagikan ke WA</span>
          </button>
        </div>
      </div>
    `).join("");
  },

  copyDoaToClipboard(id) {
    const d = MASTER_DOA.find(item => item.id === id);
    if (!d) return;

    const text = `*DO'A HARIAN RQ UMMUL QASIM* 🤲\n*${d.nomor}. ${d.judul}*\n\n${d.arab}\n\n_${d.latin}_\n\nArtinya:\n"${d.arti}"\n\n📖 Sumber: ${d.riwayat}\n✨ Keutamaan: ${d.keutamaan || ""}\n\n_Rumah Qur'an Ummul Qasim_`;
    this.copyToClipboard(text, `Do'a "${d.judul}" berhasil disalin! 📋`);
  },

  shareDoaWhatsApp(id) {
    const d = MASTER_DOA.find(item => item.id === id);
    if (!d) return;

    const text = `*DO'A HARIAN RQ UMMUL QASIM* 🤲\n*${d.nomor}. ${d.judul}*\n\n${d.arab}\n\n_${d.latin}_\n\nArtinya:\n"${d.arti}"\n\n📖 Sumber: ${d.riwayat}\n✨ Keutamaan: ${d.keutamaan || ""}\n\n_Rumah Qur'an Ummul Qasim - Menjaga Generasi Qur'ani_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  },

  copyToClipboard(text, successMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast(successMsg, "success");
      }).catch(() => {
        this.fallbackCopyText(text, successMsg);
      });
    } else {
      this.fallbackCopyText(text, successMsg);
    }
  },

  fallbackCopyText(text, successMsg) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      this.showToast(successMsg, "success");
    } catch (err) {
      this.showToast("Gagal menyalin teks secara otomatis.", "error");
    }
    document.body.removeChild(textArea);
  },

  // ===================================================================
  // 16. MOBILE FRIENDLY UX: NAVIGASI SWIPE BACK & BROWSER HISTORY
  // ===================================================================
  setupHistoryNavigation() {
    if (!history.state) {
      try {
        history.replaceState({ screen: "main", tab: "tab-leaderboard" }, "");
      } catch (e) {}
    }

    window.addEventListener("popstate", (e) => {
      // 1. Jika ada modal aktif yang terbuka, tutup modal terlebih dahulu
      const activeModal = document.querySelector(".modal.active, #loginPortalScreen.active");
      if (activeModal) {
        activeModal.classList.remove("active");
        try {
          history.pushState({ screen: "main", tab: this.getCurrentActiveTab() }, "");
        } catch (err) {}
        return;
      }

      // 2. Jika sedang membuka detail pantauan santri, kembali ke daftar santri
      const parentDetail = document.getElementById("parentStudentDetail");
      const selectParentSantri = document.getElementById("selectParentSantri");
      if (parentDetail && parentDetail.style.display !== "none") {
        parentDetail.style.display = "none";
        if (selectParentSantri) selectParentSantri.value = "";
        const emptyState = document.getElementById("parentEmptyState");
        if (emptyState) emptyState.style.display = "block";
        try {
          history.pushState({ screen: "main", tab: "tab-wali" }, "");
        } catch (err) {}
        return;
      }

      // 3. Jika sedang berada di tab lain, kembali ke tab Papan Peringkat (Capaian)
      const activeTabBtn = document.querySelector(".tab-btn.active, .mobile-nav-item.active");
      const currentTab = activeTabBtn ? activeTabBtn.dataset.tab : "tab-leaderboard";
      if (currentTab && currentTab !== "tab-leaderboard") {
        this.switchTab("tab-leaderboard", false);
        try {
          history.pushState({ screen: "main", tab: "tab-leaderboard" }, "");
        } catch (err) {}
        return;
      }

      // 4. Cegah keluar dari webview/PWA secara tidak sengaja
      try {
        history.pushState({ screen: "main", tab: "tab-leaderboard" }, "");
      } catch (err) {}
    });
  },

  getCurrentActiveTab() {
    const activeTab = document.querySelector(".tab-panel.active");
    return activeTab ? activeTab.id : "tab-leaderboard";
  },

  // ===================================================================
  // 17. MODAL RIWAYAT SETORAN TERAKHIR & HAPUS INPUT KELIRU
  // ===================================================================
  setupRecentSetoranModal() {
    const modal = document.getElementById("modalRecentSetoran");
    const openBtn = document.getElementById("btnOpenRecentSetoranModal");
    const headerBtn = document.getElementById("btnHeaderRecentSetoran");
    const closeBtn = document.getElementById("btnCloseRecentSetoranModal");

    const openHandler = () => {
      this.renderRecentSetoranList();
      if (modal) {
        modal.classList.add("active");
        try {
          history.pushState({ modal: "modalRecentSetoran" }, "");
        } catch (e) {}
      }
    };

    if (openBtn) {
      openBtn.addEventListener("click", openHandler);
    }
    if (headerBtn) {
      headerBtn.addEventListener("click", openHandler);
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
      });
    }
  },

  renderRecentSetoranList() {
    const container = document.getElementById("recentSetoranListContainer");
    if (!container) return;

    const allRecords = SheetsService.getAllRecords() || [];
    if (allRecords.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted);">
          <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">📭</span>
          <p style="font-weight: 700; margin: 0;">Belum ada riwayat input evaluasi setoran.</p>
        </div>
      `;
      return;
    }

    // Tampilkan 25 setoran terakhir (terurut paling baru)
    const recentRecords = [...allRecords].reverse().slice(0, 25);

    container.innerHTML = recentRecords.map(r => {
      let hafalanText = "";
      if (r.ziyadahSurah && r.murojaahSurah) {
        hafalanText = `⭐ Ziyadah: ${escapeHtml(r.ziyadahSurah)} (${r.ziyadahAyatAwal || 1}-${r.ziyadahAyatAkhir || 1}) • 🔄 Muroja'ah: ${escapeHtml(r.murojaahSurah)} (${r.murojaahAyatAwal || 1}-${r.murojaahAyatAkhir || 1})`;
      } else if (r.ziyadahSurah) {
        hafalanText = `⭐ Ziyadah: ${escapeHtml(r.ziyadahSurah)} (${r.ziyadahAyatAwal || 1}-${r.ziyadahAyatAkhir || 1}) <span style="color:#64748b; font-size:0.7rem;">(Tanpa Muroja'ah)</span>`;
      } else if (r.murojaahSurah) {
        hafalanText = `🔄 Muroja'ah: ${escapeHtml(r.murojaahSurah)} (${r.murojaahAyatAwal || 1}-${r.murojaahAyatAkhir || 1}) <span style="color:#64748b; font-size:0.7rem;">(Hanya Muroja'ah)</span>`;
      } else if (r.surahAwal && r.surahAwal !== "-") {
        hafalanText = `${escapeHtml(r.surahAwal)} (${r.ayatAwal || 1}-${r.ayatAkhir || 1})`;
      } else {
        hafalanText = "Tilawah saja";
      }

      let tilawahText = "";
      if (r.bacaanTipe === "Tartil") {
        tilawahText = `📜 Tartil: Juz ${escapeHtml(r.tartilJuz || "30")} (${escapeHtml(r.tartilHalaman || "-")})`;
      } else {
        tilawahText = `📖 ${escapeHtml(r.tamhidJilid || "Tamhid")} (${escapeHtml(r.tamhidHalaman || "-")})`;
      }

      return `
        <div class="recent-setoran-item">
          <div class="recent-setoran-info">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="recent-setoran-name">${escapeHtml(r.namaSantri || "Santri RQ")}</span>
              <span class="meta-badge" style="font-size: 0.68rem; padding: 2px 6px;">${escapeHtml(r.halaqah || "Kelas")}</span>
            </div>
            <div class="recent-setoran-meta">
              <span>📅 ${escapeHtml(r.tanggal || "-")}</span> • 
              <span>${tilawahText}</span> • 
              <span style="color: #b45309; font-weight: 700;">⭐ +${Number(r.totalBintang) || 0}</span>
            </div>
            <div style="font-size: 0.74rem; color: #475569; margin-top: 2px;">
              ${hafalanText}
            </div>
          </div>
          <button type="button" class="btn-delete-row" onclick="App.deleteSetoranRecord('${escapeHtml(r.id)}', this)" title="Hapus catatan setoran yang keliru ini" style="background: #fee2e2; color: #dc2626; border: 1.5px solid #fecaca; border-radius: 8px; padding: 6px 12px; font-weight: 700; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;">
            <span>🗑️ Hapus</span>
          </button>
        </div>
      `;
    }).join("");
  },

  // ===================================================================
  // 18. MODUL UNDUH LAPORAN RESMI (TAMHID, TARTIL, HAFALAN & REKAP)
  // ===================================================================
  setupReportExportModule() {
    const modal = document.getElementById("modalExportReport");
    const openBtn = document.getElementById("btnOpenExportModal");
    const closeBtn = document.getElementById("btnCloseExportModal");

    if (openBtn && modal) {
      openBtn.addEventListener("click", () => {
        modal.classList.add("active");
        try {
          history.pushState({ modal: "modalExportReport" }, "");
        } catch (e) {}
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
      });
    }
  },

  generatePrintableReport(format = "pdf") {
    const classSelect = document.getElementById("exportClassSelect");
    const chosenClass = classSelect ? classSelect.value : "ALL";
    const reportTypeRadio = document.querySelector('input[name="reportTypeRadio"]:checked');
    const reportType = reportTypeRadio ? reportTypeRadio.value : "tamhid";

    let santriList = SheetsService.getAllSantri();
    if (chosenClass !== "ALL") {
      santriList = santriList.filter(s => s.halaqah === chosenClass);
    }

    const allRecords = SheetsService.getAllRecords();
    const currentDate = new Date().toLocaleDateString("id-ID", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    let reportTitle = "LAPORAN PERKEMBANGAN MUTABA'AH TILAWAH & TAHFIDZ AL-QUR'AN";
    let reportSubtitle = "";
    if (reportType === "tamhid") {
      reportSubtitle = "FOKUS MATERI: KITAB TAMHID (JILID 1 - 5)";
    } else if (reportType === "tartil") {
      reportSubtitle = "FOKUS MATERI: TARTIL AL-QUR'AN (JUZ 1 - 30)";
    } else if (reportType === "hafalan") {
      reportSubtitle = "FOKUS MATERI: BATAS HAFALAN (ZIYADAH & MUROJA'AH)";
    } else {
      reportSubtitle = "REKAPITULASI CAPAIAN BINTANG PRESTASI & MUTABA'AH LENGKAP";
    }

    let classTitle = chosenClass === "ALL" ? "Seluruh Kelas Resmi (Dasar & Menengah)" : chosenClass;
    let ustadzPengampu = CLASS_TEACHER_MAP[chosenClass] ? CLASS_TEACHER_MAP[chosenClass].ustadz : "Tim Pengajar RQ";

    const rowsHtml = santriList.map((s, idx) => {
      const studentRecords = allRecords.filter(r => {
        if (!r) return false;
        if (r.santriId && s.id && r.santriId === s.id) return true;
        if (r.namaSantri && s.nama && r.namaSantri.trim().toLowerCase() === s.nama.trim().toLowerCase()) return true;
        return false;
      });

      const totalStars = studentRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
      const latest = studentRecords.length > 0 ? studentRecords[0] : null;

      if (reportType === "tamhid") {
        const jilid = latest && latest.tamhidJilid ? latest.tamhidJilid : (s.statusBelajar === "Tartil Qur'an" ? "Lulus ke Tartil" : "Jilid 1");
        const hal = latest && latest.tamhidHalaman ? latest.tamhidHalaman : "-";
        const status = latest && latest.bacaanStatus ? latest.bacaanStatus : "Lanjut";
        const catatan = latest && latest.bacaanCatatan ? latest.bacaanCatatan : "Makhraj & fashahah baik";
        return `
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <td style="text-align: center; font-weight: bold; padding: 7px 5px;">${idx + 1}</td>
            <td style="font-weight: 700; color: #0f172a; padding: 7px 5px;">${s.nama}</td>
            <td style="padding: 7px 5px;">${s.halaqah}</td>
            <td style="text-align: center; font-weight: 700; color: #0284c7; padding: 7px 5px;">${jilid}</td>
            <td style="text-align: center; padding: 7px 5px;">${hal}</td>
            <td style="text-align: center; font-weight: 600; padding: 7px 5px;">${status}</td>
            <td style="font-size: 0.8rem; color: #475569; padding: 7px 5px;">${catatan}</td>
          </tr>
        `;
      } else if (reportType === "tartil") {
        const juz = latest && latest.tartilJuz ? `Juz ${latest.tartilJuz}` : (s.statusBelajar === "Tartil Qur'an" ? "Juz 30" : "Belum Tartil");
        const hal = latest && latest.tartilHalaman ? latest.tartilHalaman : "-";
        const status = latest && latest.bacaanStatus ? latest.bacaanStatus : "-";
        const tajwid = latest && latest.bintangTajwid ? `⭐ ${latest.bintangTajwid}/5` : "-";
        const kelancaran = latest && latest.bintangKelancaran ? `⭐ ${latest.bintangKelancaran}/5` : "-";
        return `
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <td style="text-align: center; font-weight: bold; padding: 7px 5px;">${idx + 1}</td>
            <td style="font-weight: 700; color: #0f172a; padding: 7px 5px;">${s.nama}</td>
            <td style="padding: 7px 5px;">${s.halaqah}</td>
            <td style="text-align: center; font-weight: 700; color: #0284c7; padding: 7px 5px;">${juz}</td>
            <td style="text-align: center; padding: 7px 5px;">${hal}</td>
            <td style="text-align: center; padding: 7px 5px;">${status}</td>
            <td style="text-align: center; padding: 7px 5px;">${tajwid}</td>
            <td style="text-align: center; padding: 7px 5px;">${kelancaran}</td>
          </tr>
        `;
      } else if (reportType === "hafalan") {
        let ziyadah = "-";
        let murojaah = "-";
        if (latest) {
          if (latest.ziyadahSurah) {
            ziyadah = `${latest.ziyadahSurah} (${latest.ziyadahAyatAwal || 1}-${latest.ziyadahAyatAkhir || 1})`;
          } else if (latest.surahAwal) {
            ziyadah = `${latest.surahAwal} (${latest.ayatAwal}-${latest.ayatAkhir})`;
          }
          if (latest.murojaahSurah) {
            murojaah = `${latest.murojaahSurah} (${latest.murojaahAyatAwal || 1}-${latest.murojaahAyatAkhir || 1})`;
          }
        }
        const predikat = totalStars >= 20 ? "Mumtaz (Istimewa)" : (totalStars >= 12 ? "Jayyid Jiddan" : "Jayyid");
        return `
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <td style="text-align: center; font-weight: bold; padding: 7px 5px;">${idx + 1}</td>
            <td style="font-weight: 700; color: #0f172a; padding: 7px 5px;">${s.nama}</td>
            <td style="padding: 7px 5px;">${s.halaqah}</td>
            <td style="font-weight: 600; color: #0284c7; padding: 7px 5px;">${ziyadah}</td>
            <td style="font-weight: 600; color: #059669; padding: 7px 5px;">${murojaah}</td>
            <td style="text-align: center; padding: 7px 5px;">${predikat}</td>
            <td style="text-align: center; font-weight: 700; color: #b45309; padding: 7px 5px;">⭐ ${totalStars}</td>
          </tr>
        `;
      } else {
        let tilawah = "-";
        if (latest) {
          tilawah = latest.bacaanTipe === "Tartil" 
            ? `Tartil: Juz ${latest.tartilJuz || "30"} (${latest.tartilHalaman || "-"})`
            : `${latest.tamhidJilid || "Tamhid"} (${latest.tamhidHalaman || "-"})`;
        }
        let hafalan = "-";
        if (latest) {
          if (latest.ziyadahSurah && latest.murojaahSurah) {
            hafalan = `Ziy: ${latest.ziyadahSurah} (${latest.ziyadahAyatAwal || 1}-${latest.ziyadahAyatAkhir || 1}) | Mur: ${latest.murojaahSurah} (${latest.murojaahAyatAwal || 1}-${latest.murojaahAyatAkhir || 1})`;
          } else if (latest.ziyadahSurah) {
            hafalan = `Ziy: ${latest.ziyadahSurah} (${latest.ziyadahAyatAwal || 1}-${latest.ziyadahAyatAkhir || 1})`;
          } else if (latest.surahAwal) {
            hafalan = `${latest.surahAwal} (${latest.ayatAwal}-${latest.ayatAkhir})`;
          }
        }
        return `
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <td style="text-align: center; font-weight: bold; padding: 7px 5px;">${idx + 1}</td>
            <td style="font-weight: 700; color: #0f172a; padding: 7px 5px;">${s.nama}</td>
            <td style="padding: 7px 5px;">${s.halaqah}</td>
            <td style="padding: 7px 5px;">${tilawah}</td>
            <td style="font-size: 0.8rem; padding: 7px 5px;">${hafalan}</td>
            <td style="text-align: center; font-weight: 700; color: #b45309; padding: 7px 5px;">⭐ ${totalStars}</td>
            <td style="text-align: center; padding: 7px 5px;">${studentRecords.length}x</td>
          </tr>
        `;
      }
    }).join("");

    let tableHeaderHtml = "";
    if (reportType === "tamhid") {
      tableHeaderHtml = `
        <tr style="background: #0284c7; color: #ffffff;">
          <th style="width: 35px; padding: 8px 5px;">No</th>
          <th style="padding: 8px 5px; text-align: left;">Nama Santri</th>
          <th style="padding: 8px 5px; text-align: left;">Kelas Bimbingan</th>
          <th style="padding: 8px 5px; text-align: center;">Jilid</th>
          <th style="padding: 8px 5px; text-align: center;">Halaman</th>
          <th style="padding: 8px 5px; text-align: center;">Status</th>
          <th style="padding: 8px 5px; text-align: left;">Catatan Fashahah</th>
        </tr>
      `;
    } else if (reportType === "tartil") {
      tableHeaderHtml = `
        <tr style="background: #0284c7; color: #ffffff;">
          <th style="width: 35px; padding: 8px 5px;">No</th>
          <th style="padding: 8px 5px; text-align: left;">Nama Santri</th>
          <th style="padding: 8px 5px; text-align: left;">Kelas Bimbingan</th>
          <th style="padding: 8px 5px; text-align: center;">Mushaf</th>
          <th style="padding: 8px 5px; text-align: center;">Halaman</th>
          <th style="padding: 8px 5px; text-align: center;">Status</th>
          <th style="padding: 8px 5px; text-align: center;">Tajwid</th>
          <th style="padding: 8px 5px; text-align: center;">Kelancaran</th>
        </tr>
      `;
    } else if (reportType === "hafalan") {
      tableHeaderHtml = `
        <tr style="background: #0284c7; color: #ffffff;">
          <th style="width: 35px; padding: 8px 5px;">No</th>
          <th style="padding: 8px 5px; text-align: left;">Nama Santri</th>
          <th style="padding: 8px 5px; text-align: left;">Kelas Bimbingan</th>
          <th style="padding: 8px 5px; text-align: left;">Batas Ziyadah Terakhir</th>
          <th style="padding: 8px 5px; text-align: left;">Batas Muroja'ah Terakhir</th>
          <th style="padding: 8px 5px; text-align: center;">Predikat</th>
          <th style="padding: 8px 5px; text-align: center;">Total Bintang</th>
        </tr>
      `;
    } else {
      tableHeaderHtml = `
        <tr style="background: #0284c7; color: #ffffff;">
          <th style="width: 35px; padding: 8px 5px;">No</th>
          <th style="padding: 8px 5px; text-align: left;">Nama Santri</th>
          <th style="padding: 8px 5px; text-align: left;">Kelas Bimbingan</th>
          <th style="padding: 8px 5px; text-align: left;">Capaian Tilawah</th>
          <th style="padding: 8px 5px; text-align: left;">Batas Hafalan</th>
          <th style="padding: 8px 5px; text-align: center;">Bintang</th>
          <th style="padding: 8px 5px; text-align: center;">Setoran</th>
        </tr>
      `;
    }

    const printHtml = `
      <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 900px; margin: 0 auto; line-height: 1.4;">
        <!-- Kop Surat Resmi RQ Ummul Qasim -->
        <div style="display: flex; align-items: center; justify-content: center; border-bottom: 3px double #0284c7; padding-bottom: 14px; margin-bottom: 18px; text-align: center; gap: 16px;">
          <div style="font-size: 2.8rem;">🕌</div>
          <div>
            <h1 style="margin: 0; font-size: 1.5rem; color: #0284c7; font-weight: 800; letter-spacing: 0.5px;">RUMAH QUR'AN UMMUL QASIM</h1>
            <p style="margin: 3px 0 0 0; font-size: 0.85rem; color: #475569; font-weight: 600;">Pusat Bimbingan Tilawah, Tartil & Tahfidz Al-Qur'an Anak Usia Dini & SD</p>
            <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #64748b;">Membangun Generasi Qur'ani Berakhlak Mulia dan Mutqin dalam Hafalan</p>
          </div>
        </div>

        <!-- Judul Laporan -->
        <div style="text-align: center; margin-bottom: 18px;">
          <h2 style="margin: 0; font-size: 1.15rem; color: #0f172a; text-transform: uppercase;">${reportTitle}</h2>
          <div style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 3px 12px; border-radius: 99px; font-weight: 700; font-size: 0.8rem; margin-top: 6px;">
            ${reportSubtitle}
          </div>
        </div>

        <!-- Meta Info Laporan -->
        <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 12px; background: #f8fafc; padding: 8px 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <div><strong>Kelas:</strong> ${classTitle}</div>
          <div><strong>Pengajar:</strong> ${ustadzPengampu}</div>
          <div><strong>Tanggal Cetak:</strong> ${currentDate}</div>
        </div>

        <!-- Tabel Laporan -->
        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-bottom: 24px;">
          <thead>
            ${tableHeaderHtml}
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Tanda Tangan -->
        <div style="display: flex; justify-content: space-between; margin-top: 36px; padding: 0 40px; font-size: 0.85rem;">
          <div style="text-align: center;">
            <p style="margin: 0 0 50px 0;">Pengampu Halaqah / Ustadzah,</p>
            <p style="margin: 0; font-weight: 700; text-decoration: underline;">${ustadzPengampu}</p>
            <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #64748b;">Pengajar RQ Ummul Qasim</p>
          </div>
          <div style="text-align: center;">
            <p style="margin: 0 0 50px 0;">Mudir / Pembina Utama,</p>
            <p style="margin: 0; font-weight: 700; text-decoration: underline;">Ustadz M. Fikri Haekal, C.LQ</p>
            <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #64748b;">Mudir RQ Ummul Qasim</p>
          </div>
        </div>
      </div>
    `;

    let printArea = document.getElementById("printableReportArea");
    if (!printArea) {
      printArea = document.createElement("div");
      printArea.id = "printableReportArea";
      document.body.appendChild(printArea);
    }

    printArea.innerHTML = printHtml;
    printArea.style.display = "block";

    const modal = document.getElementById("modalExportReport");
    if (modal) modal.classList.remove("active");

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        printArea.style.display = "none";
      }, 1000);
    }, 200);
  },

  generateExcelCsvReport() {
    const classSelect = document.getElementById("exportClassSelect");
    const chosenClass = classSelect ? classSelect.value : "ALL";
    const reportTypeRadio = document.querySelector('input[name="reportTypeRadio"]:checked');
    const reportType = reportTypeRadio ? reportTypeRadio.value : "tamhid";

    let santriList = SheetsService.getAllSantri();
    if (chosenClass !== "ALL") {
      santriList = santriList.filter(s => s.halaqah === chosenClass);
    }

    const allRecords = SheetsService.getAllRecords();

    let csvContent = "\uFEFF"; // UTF-8 BOM
    
    // Pembersih sel CSV dari Formula Injection
    const cleanCsvCell = (val) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    csvContent += `"LAPORAN PERKEMBANGAN MUTABA'AH RQ UMMUL QASIM"\r\n`;
    csvContent += `"Kelas: ${chosenClass} | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}"\r\n\r\n`;

    if (reportType === "tamhid") {
      csvContent += `"No","Nama Santri","Kelas","Status Belajar","Tamhid Jilid","Halaman Terakhir","Status Bimbingan","Catatan Fashahah"\r\n`;
      santriList.forEach((s, idx) => {
        const studentRecords = allRecords.filter(r => (r.santriId && r.santriId === s.id) || (r.namaSantri && r.namaSantri.toLowerCase() === s.nama.toLowerCase()));
        const latest = studentRecords.length > 0 ? studentRecords[0] : null;
        const jilid = latest && latest.tamhidJilid ? latest.tamhidJilid : (s.statusBelajar === "Tartil Qur'an" ? "Tartil" : "Jilid 1");
        const hal = latest && latest.tamhidHalaman ? latest.tamhidHalaman : "-";
        const status = latest && latest.bacaanStatus ? latest.bacaanStatus : "Lanjut";
        const catatan = latest && latest.bacaanCatatan ? latest.bacaanCatatan : "-";
        csvContent += `${cleanCsvCell(idx + 1)},${cleanCsvCell(s.nama)},${cleanCsvCell(s.halaqah)},${cleanCsvCell(s.statusBelajar)},${cleanCsvCell(jilid)},${cleanCsvCell(hal)},${cleanCsvCell(status)},${cleanCsvCell(catatan)}\r\n`;
      });
    } else if (reportType === "tartil") {
      csvContent += `"No","Nama Santri","Kelas","Mushaf Tartil","Halaman","Status","Bintang Tajwid","Bintang Kelancaran"\r\n`;
      santriList.forEach((s, idx) => {
        const studentRecords = allRecords.filter(r => (r.santriId && r.santriId === s.id) || (r.namaSantri && r.namaSantri.toLowerCase() === s.nama.toLowerCase()));
        const latest = studentRecords.length > 0 ? studentRecords[0] : null;
        const juz = latest && latest.tartilJuz ? `Juz ${latest.tartilJuz}` : "Juz 30";
        const hal = latest && latest.tartilHalaman ? latest.tartilHalaman : "-";
        const status = latest && latest.bacaanStatus ? latest.bacaanStatus : "-";
        const tajwid = latest ? latest.bintangTajwid || 5 : 5;
        const kelancaran = latest ? latest.bintangKelancaran || 5 : 5;
        csvContent += `${cleanCsvCell(idx + 1)},${cleanCsvCell(s.nama)},${cleanCsvCell(s.halaqah)},${cleanCsvCell(juz)},${cleanCsvCell(hal)},${cleanCsvCell(status)},${cleanCsvCell(tajwid)},${cleanCsvCell(kelancaran)}\r\n`;
      });
    } else if (reportType === "hafalan") {
      csvContent += `"No","Nama Santri","Kelas","Batas Ziyadah","Batas Muroja'ah","Total Bintang"\r\n`;
      santriList.forEach((s, idx) => {
        const studentRecords = allRecords.filter(r => (r.santriId && r.santriId === s.id) || (r.namaSantri && r.namaSantri.toLowerCase() === s.nama.toLowerCase()));
        const latest = studentRecords.length > 0 ? studentRecords[0] : null;
        const totalStars = studentRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
        let ziyadah = "-";
        let murojaah = "-";
        if (latest) {
          if (latest.ziyadahSurah) ziyadah = `${latest.ziyadahSurah} (${latest.ziyadahAyatAwal || 1}-${latest.ziyadahAyatAkhir || 1})`;
          else if (latest.surahAwal) ziyadah = `${latest.surahAwal} (${latest.ayatAwal}-${latest.ayatAkhir})`;
          if (latest.murojaahSurah) murojaah = `${latest.murojaahSurah} (${latest.murojaahAyatAwal || 1}-${latest.murojaahAyatAkhir || 1})`;
        }
        csvContent += `${cleanCsvCell(idx + 1)},${cleanCsvCell(s.nama)},${cleanCsvCell(s.halaqah)},${cleanCsvCell(ziyadah)},${cleanCsvCell(murojaah)},${cleanCsvCell(totalStars)}\r\n`;
      });
    } else {
      csvContent += `"No","Nama Santri","Kelas","Capaian Tilawah","Batas Ziyadah","Batas Muroja'ah","Total Bintang","Total Evaluasi"\r\n`;
      santriList.forEach((s, idx) => {
        const studentRecords = allRecords.filter(r => (r.santriId && r.santriId === s.id) || (r.namaSantri && r.namaSantri.toLowerCase() === s.nama.toLowerCase()));
        const latest = studentRecords.length > 0 ? studentRecords[0] : null;
        const totalStars = studentRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
        let tilawah = latest ? (latest.bacaanTipe === "Tartil" ? `Tartil Juz ${latest.tartilJuz || "30"} Hal. ${latest.tartilHalaman || "-"}` : `${latest.tamhidJilid || "Tamhid"} Hal. ${latest.tamhidHalaman || "-"}`) : "-";
        let ziyadah = latest ? (latest.ziyadahSurah ? `${latest.ziyadahSurah} (${latest.ziyadahAyatAwal || 1}-${latest.ziyadahAyatAkhir || 1})` : (latest.surahAwal || "-")) : "-";
        let murojaah = latest ? (latest.murojaahSurah ? `${latest.murojaahSurah} (${latest.murojaahAyatAwal || 1}-${latest.murojaahAyatAkhir || 1})` : "-") : "-";
        csvContent += `${cleanCsvCell(idx + 1)},${cleanCsvCell(s.nama)},${cleanCsvCell(s.halaqah)},${cleanCsvCell(tilawah)},${cleanCsvCell(ziyadah)},${cleanCsvCell(murojaah)},${cleanCsvCell(totalStars)},${cleanCsvCell(studentRecords.length)}\r\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeClassName = chosenClass.replace(/\s+/g, "_");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Mutabaah_RQ_${safeClassName}_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showToast(`Laporan format Excel berhasil diunduh! 📊`, "success");

    const modal = document.getElementById("modalExportReport");
    if (modal) modal.classList.remove("active");
  }
};
