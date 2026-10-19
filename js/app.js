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

const App = {
  currentCategoryFilter: "Menengah", // Default ke Menengah atau Dasar
  currentPeriodFilter: "pekanan", // Default ke Capaian Bintang Pekanan (Simpel)
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
    this.setupPhotoUpload();
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
          if (confirm("Kunci kembali akses Pengajar dan kembali ke Panel Depan?")) {
            SheetsService.logoutUstadz();
            this.setAuthState(false);
            this.showToast("Akses pengajar telah dikunci 🔒", "success");
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

        if (SheetsService.loginUstadz(ustadzName, pin)) {
          this.setAuthState(true, ustadzName);
          if (loginPortal) loginPortal.classList.remove("active");
          this.showToast(`Ahlan wa Sahlan, ${ustadzName}! Akses pengajar terbuka 👳‍♂️`, "success");
          
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
          this.showToast("Kata sandi pengajar salah! Silakan coba lagi.", "error");
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

    if (isUstadz) {
      document.body.classList.add("is-ustadz");
      if (authIcon) authIcon.textContent = "🔓";
      if (authLabel) authLabel.textContent = "Keluar Ustadz";
      if (btnAuth) btnAuth.classList.add("logged-in");
      if (headerTeacherText) headerTeacherText.textContent = `${ustadzName || "Pengampu RQ"} (Aktif)`;
      ustadzFeatures.forEach(el => el.style.display = "inline-flex");
    } else {
      document.body.classList.remove("is-ustadz");
      if (authIcon) authIcon.textContent = "🔒";
      if (authLabel) authLabel.textContent = "Masuk Ustadz/ah";
      if (btnAuth) btnAuth.classList.remove("logged-in");
      if (headerTeacherText) headerTeacherText.textContent = "Portal Mutaba'ah & Kontrol Hafalan";
      ustadzFeatures.forEach(el => el.style.display = "none");
    }
  },

  switchTab(targetId) {
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

    // Sinkronkan ke elemen dropdown select
    if (selAwal && elAwal) selAwal.value = elAwal.value;
    if (selAkhir && elAkhir) selAkhir.value = elAkhir.value;
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

    // Tamhid Jilid
    const selectTamhid = document.getElementById("selectTamhidJilid");
    if (selectTamhid) {
      TAMHID_JILID_OPTIONS.forEach(j => {
        selectTamhid.add(new Option(j, j));
      });
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

    // Surah Hafalan (Clean Minimalist Select)
    const selectSurahAwal = document.getElementById("selectSurahAwal");
    const selectSurahAkhir = document.getElementById("selectSurahAkhir");
    const selectAyatAwal = document.getElementById("selectAyatAwal");
    const selectAyatAkhir = document.getElementById("selectAyatAkhir");
    const inputAwal = document.getElementById("inputAyatAwal");
    const inputAkhir = document.getElementById("inputAyatAkhir");

    if (selectSurahAwal) selectSurahAwal.innerHTML = "";
    if (selectSurahAkhir) selectSurahAkhir.innerHTML = "";

    QURAN_SURAHS.forEach(s => {
      const text = `${s.no}. ${s.name} (${s.verses} ayat)`;
      if (selectSurahAwal) selectSurahAwal.add(new Option(text, s.name));
      if (selectSurahAkhir) selectSurahAkhir.add(new Option(text, s.name));
    });

    if (selectSurahAwal) selectSurahAwal.value = "An-Naba'";
    if (selectSurahAkhir) selectSurahAkhir.value = "An-Naba'";

    const defaultSurah = QURAN_SURAHS.find(s => s.name === "An-Naba'") || QURAN_SURAHS[0];
    if (selectAyatAwal && defaultSurah) {
      this.populateAyatDropdown(selectAyatAwal, defaultSurah.verses, 1);
    }
    if (selectAyatAkhir && defaultSurah) {
      this.populateAyatDropdown(selectAyatAkhir, defaultSurah.verses, Math.min(10, defaultSurah.verses));
    }

    if (selectAyatAwal && inputAwal) {
      selectAyatAwal.addEventListener("change", (e) => {
        const val = parseInt(e.target.value, 10) || 1;
        inputAwal.value = val;
        if (selectSurahAwal && selectSurahAkhir && selectSurahAwal.value === selectSurahAkhir.value) {
          const vAkhir = parseInt(inputAkhir.value, 10) || 1;
          if (val > vAkhir) {
            inputAkhir.value = val;
            if (selectAyatAkhir) selectAyatAkhir.value = val;
          }
        }
      });
    }

    if (selectAyatAkhir && inputAkhir) {
      selectAyatAkhir.addEventListener("change", (e) => {
        const val = parseInt(e.target.value, 10) || 1;
        inputAkhir.value = val;
        if (selectSurahAwal && selectSurahAkhir && selectSurahAwal.value === selectSurahAkhir.value) {
          const vAwal = parseInt(inputAwal.value, 10) || 1;
          if (val < vAwal) {
            inputAwal.value = val;
            if (selectAyatAwal) selectAyatAwal.value = val;
          }
        }
      });
    }

    this.refreshSantriDropdowns();

    if (selectSurahAwal) {
      selectSurahAwal.addEventListener("change", (e) => {
        const found = QURAN_SURAHS.find(s => s.name === e.target.value);
        if (found) {
          if (selectSurahAkhir) selectSurahAkhir.value = found.name;
          if (inputAwal) inputAwal.value = 1;
          if (inputAkhir) inputAkhir.value = Math.min(10, found.verses);
          this.populateAyatDropdown(selectAyatAwal, found.verses, 1);
          this.populateAyatDropdown(selectAyatAkhir, found.verses, Math.min(10, found.verses));
        }
      });
    }

    if (selectSurahAkhir) {
      selectSurahAkhir.addEventListener("change", (e) => {
        const found = QURAN_SURAHS.find(s => s.name === e.target.value);
        if (found) {
          if (inputAkhir) inputAkhir.value = Math.min(10, found.verses);
          this.populateAyatDropdown(selectAyatAkhir, found.verses, Math.min(10, found.verses));
        }
      });
    }

    // Quick Add Santri Button inside input panel
    const btnQuickAddSantri = document.getElementById("btnQuickAddSantri");
    if (btnQuickAddSantri) {
      btnQuickAddSantri.addEventListener("click", () => {
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
        selectSantri.add(new Option(`No. ${idx + 1} - ${s.avatar} ${s.nama}`, s.id));
      });
      if (currentVal) selectSantri.value = currentVal;
    }

    if (selectParentSantri) {
      const currentParent = selectParentSantri.value;
      selectParentSantri.innerHTML = `<option value="">-- Pilih Nama Ananda --</option>`;
      allSantri.forEach((s, idx) => {
        selectParentSantri.add(new Option(`No. ${idx + 1} - ${s.avatar} ${s.nama} (${s.halaqah})`, s.id));
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

      const record = {
        id: "REC-" + Date.now(),
        tanggal: document.getElementById("inputTanggal").value,
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

        // Hafalan Al-Qur'an
        hafalanJenis: document.getElementById("inputHafalanJenis").value,
        surahAwal: document.getElementById("selectSurahAwal").value,
        ayatAwal: parseInt(document.getElementById("inputAyatAwal").value, 10) || 1,
        surahAkhir: document.getElementById("selectSurahAkhir").value,
        ayatAkhir: parseInt(document.getElementById("inputAyatAkhir").value, 10) || 1,
        bintangTajwid: parseInt(document.getElementById("inputStarTajwid").value, 10),
        bintangKelancaran: parseInt(document.getElementById("inputStarKelancaran").value, 10),
        bintangMakhraj: parseInt(document.getElementById("inputStarMakhraj").value, 10),
        totalBintang: parseInt(document.getElementById("inputStarTotal").value, 10),
        hafalanStatus: document.getElementById("inputHafalanStatus").value,
        hafalanCatatan: document.getElementById("inputHafalanCatatan").value.trim() || "-"
      };

      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>⏳ Menyimpan ke Google Spreadsheet...</span>`;

      try {
        await SheetsService.submitSetoran(record);

        this.showToast(`Setoran ${namaSantri} berhasil disimpan! ⭐ +${record.totalBintang} Bintang`, "success");
        
        document.getElementById("inputTamhidHalaman").value = "";
        document.getElementById("inputTartilHalaman").value = "";
        document.getElementById("inputBacaanCatatan").value = "";
        document.getElementById("inputHafalanCatatan").value = "";
        document.getElementById("selectSantri").value = "";

        this.ratings = { tajwid: 5, kelancaran: 5, makhraj: 5 };
        this.setupStarRatings();

        this.renderLeaderboard();
        this.refreshParentPortalIfActive(santriId);

      } catch (err) {
        console.error(err);
        this.showToast("Terjadi kendala saat menyimpan data: " + err.message, "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  },

  // 6. Helper Tanggal Pekanan & Bulanan
  isDateInCurrentWeek(dateStr) {
    if (!dateStr) return false;
    const parts = dateStr.split("-");
    if (parts.length < 3) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const targetDate = new Date(year, month, day);

    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = (currentDayOfWeek === 0 ? -6 : 1) - currentDayOfWeek;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

    return targetDate >= monday && targetDate <= sunday;
  },

  isDateInCurrentMonth(dateStr) {
    if (!dateStr) return false;
    const parts = dateStr.split("-");
    if (parts.length < 2) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth();
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
      const allSantriRecords = allRecords.filter(r => r.santriId === s.id || r.namaSantri === s.nama);
      const totalStars = allSantriRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
      const totalSetoran = allSantriRecords.length;

      // Filter Pekanan (Senin - Ahad pekan ini)
      const weekRecords = allSantriRecords.filter(r => this.isDateInCurrentWeek(r.tanggal));
      const weekStars = weekRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
      const weekSetoran = weekRecords.length;

      // Filter Bulanan (Bulan ini)
      const monthRecords = allSantriRecords.filter(r => this.isDateInCurrentMonth(r.tanggal));
      const monthStars = monthRecords.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
      const monthSetoran = monthRecords.length;

      const latestRecord = allSantriRecords.length > 0 ? allSantriRecords[0] : null;

      let latestBacaanBadge = "";
      if (latestRecord) {
        if (latestRecord.bacaanTipe === "Tartil") {
          latestBacaanBadge = `<span class="meta-badge meta-badge-tartil">📜 Tartil: Juz ${latestRecord.tartilJuz} (${latestRecord.tartilHalaman})</span>`;
        } else {
          latestBacaanBadge = `<span class="meta-badge meta-badge-tamhid">📖 ${latestRecord.tamhidJilid?.split(" ")[0]} ${latestRecord.tamhidJilid?.split(" ")[1] || "Tamhid"} (${latestRecord.tamhidHalaman})</span>`;
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
        latestHafalan: latestRecord ? `${latestRecord.surahAwal} (${latestRecord.ayatAwal}-${latestRecord.ayatAkhir})` : "Belum ada",
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

  // 8. Fitur Upload Foto Santri
  setupPhotoUpload() {
    const fileInput = document.getElementById("globalPhotoInput");
    if (!fileInput) return;

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file || !this.targetPhotoSantriId) return;

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

  // 9. Portal Pantauan Anak
  setupParentPortal() {
    const selectParent = document.getElementById("selectParentSantri");
    if (!selectParent) return;

    selectParent.addEventListener("change", (e) => {
      const santriId = e.target.value;
      this.renderParentStudentDetail(santriId);
    });

    const btnShareWA = document.getElementById("btnShareWhatsApp");
    if (btnShareWA) {
      btnShareWA.addEventListener("click", () => {
        const santriId = document.getElementById("selectParentSantri").value;
        this.shareStudentProgressWhatsApp(santriId);
      });
    }
  },

  openParentDetailDirectly(santriId) {
    this.switchTab("tab-wali");
    const selectParent = document.getElementById("selectParentSantri");
    if (selectParent) {
      selectParent.value = santriId;
      this.renderParentStudentDetail(santriId);
    }
  },

  renderParentStudentDetail(santriId) {
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

    const records = allRecords.filter(r => r.santriId === santri.id || r.namaSantri === santri.nama);
    const totalStars = records.reduce((sum, r) => sum + (Number(r.totalBintang) || 0), 0);
    const latest = records.length > 0 ? records[0] : null;

    // Hitung Ranking di kategorinya
    const categorySantri = allSantri.filter(s => s.kategori === santri.kategori);
    const categoryRanks = categorySantri.map(s => {
      const recs = allRecords.filter(r => r.santriId === s.id || r.namaSantri === s.nama);
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

    // Hitung Bintang Pekan Ini, Bulan Ini, dan Total
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
          statBacaan.textContent = latest.tamhidJilid?.split(" ")[0] + " " + (latest.tamhidJilid?.split(" ")[1] || "Tamhid");
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
          const dateStr = new Date(r.tanggal).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
          });

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
                  Juz ${r.tartilJuz}
                </div>
                <div style="font-size:0.78rem; color:#be123c; margin-top:2px;">Posisi: ${r.tartilHalaman || "-"}</div>
                ${r.bacaanCatatan && r.bacaanCatatan !== "-" ? `<div style="font-size:0.75rem; color:#881337; margin-top:4px; font-style:italic;">Catatan: "${r.bacaanCatatan}"</div>` : ""}
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
                <div style="font-weight:800; font-size:0.88rem; color:#0c4a6e;">${r.tamhidJilid}</div>
                <div style="font-size:0.78rem; color:#0284c7; margin-top:2px;">Posisi: ${r.tamhidHalaman}</div>
                ${r.bacaanCatatan && r.bacaanCatatan !== "-" ? `<div style="font-size:0.75rem; color:#0369a1; margin-top:4px; font-style:italic;">Catatan: "${r.bacaanCatatan}"</div>` : ""}
              </div>
            `;
          }

          const hafalanBadge = r.hafalanStatus === "Lulus"
            ? `<span class="meta-badge" style="background:#dcfce7; color:#166534; border:1px solid #bbf7d0;">✅ Lulus</span>`
            : `<span class="meta-badge" style="background:#fee2e2; color:#991b1b; border:1px solid #fecaca;">🔄 Perbaiki</span>`;

          return `
            <div class="timeline-card">
              <div class="timeline-header">
                <span class="timeline-date">📅 ${dateStr}</span>
                <span class="timeline-ustadz">👳‍♂️ ${r.ustadz || "Pengampu RQ"}</span>
              </div>

              <div class="timeline-body-grid">
                ${tilawahBoxHtml}

                <div class="timeline-subbox timeline-subbox-quran">
                  <div class="timeline-box-title" style="color:#92400e; display:flex; justify-content:space-between;">
                    <span>✨ ${r.hafalanJenis || "Ziyadah"} Al-Qur'an</span>
                    ${hafalanBadge}
                  </div>
                  <div style="font-weight:800; font-size:0.88rem; color:#78350f;">
                    Surah ${r.surahAwal} (Ayat ${r.ayatAwal} - ${r.ayatAkhir})
                  </div>
                  <div class="timeline-stars-row">
                    <span>Tajwid: ★${r.bintangTajwid}</span> • 
                    <span>Lancar: ★${r.bintangKelancaran}</span> • 
                    <span>Makhraj: ★${r.bintangMakhraj}</span>
                  </div>
                  <div style="font-weight:900; font-size:0.86rem; color:#b45309; margin-top:4px;">
                    ⭐ +${r.totalBintang} Bintang Diperoleh
                  </div>
                </div>
              </div>

              ${r.hafalanCatatan && r.hafalanCatatan !== "-" ? `
                <div class="timeline-notes">
                  <strong>Pesan Evaluasi Ustadz:</strong> "${r.hafalanCatatan}"
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
    const inputNewPin = document.getElementById("inputNewPin");
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
      const settings = SheetsService.getSettings();
      if (inputUrl) inputUrl.value = settings.endpointUrl || "";
      if (inputNewPin) inputNewPin.value = SheetsService.getSecurityPin();
      modal.classList.add("active");
    };

    if (btnOpen) btnOpen.addEventListener("click", openModal);
    if (statusPill) statusPill.addEventListener("click", openModal);

    closeBtns.forEach(btn => {
      btn.addEventListener("click", () => modal.classList.remove("active"));
    });

    if (btnSaveNewPin) {
      btnSaveNewPin.addEventListener("click", () => {
        const newPin = inputNewPin.value.trim();
        if (!newPin) {
          this.showToast("Sandi tidak boleh kosong!", "error");
          return;
        }
        SheetsService.setSecurityPin(newPin);
        this.showToast(`Sandi pengaman berhasil diperbarui menjadi: "${newPin}"`, "success");
      });
    }

    if (btnSave) {
      btnSave.addEventListener("click", () => {
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

  // 11. Modal Tambah Santri Baru (DIPERBAIKI 100% AMAN & NOMOR URUT SAJA)
  setupAddSantriModal() {
    const modal = document.getElementById("modalAddSantri");
    const btnOpen = document.getElementById("btnAddSantriModal");
    const closeBtns = document.querySelectorAll('[data-close="modalAddSantri"]');

    if (btnOpen) {
      btnOpen.addEventListener("click", () => modal.classList.add("active"));
    }

    closeBtns.forEach(btn => {
      btn.addEventListener("click", () => modal.classList.remove("active"));
    });
  },

  // Fungsi Tambah Santri Langsung (Bisa dipanggil dari form submit maupun tombol klik)
  submitNewSantriManual(event) {
    if (event) event.preventDefault();

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
  }
};
