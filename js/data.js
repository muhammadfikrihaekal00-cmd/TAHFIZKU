/**
 * DATASET UTAMA RQ UMMUL QASIM
 * 4 Kelas Resmi & 4 Pengajar Resmi:
 * 1. Kelas Menengah Ikhwan - Ustadz M. Fikri Haekal, C.LQ (Kategori Menengah)
 * 2. Kelas Menengah Akhowat - Ustadzah A. Lulu Aprilia Latifa (Kategori Menengah)
 * 3. Kelas Dasar 1 - Ustadzah Ummu Khadijah (Kategori Dasar)
 * 4. Kelas Dasar 2 - Ustadzah Khirfatul Jannah (Kategori Dasar)
 * 
 * Kategori Reward: HANYA 2 (1 Juara Kelas Menengah & 1 Juara Kelas Dasar)
 */

const DEFAULT_SECURITY_PIN = "1234";

// URL Google Apps Script Web App Bawaan (Dapat diisi di sini agar seluruh perangkat/wali langsung tersambung otomatis)
const DEFAULT_SPREADSHEET_ENDPOINT = "";

const MASTER_CLASSES = [
  {
    name: "Kelas Menengah Ikhwan",
    pengampu: "Ustadz M. Fikri Haekal, C.LQ",
    kategori: "Menengah"
  },
  {
    name: "Kelas Menengah Akhowat",
    pengampu: "Ustadzah A. Lulu Aprilia Latifa",
    kategori: "Menengah"
  },
  {
    name: "Kelas Dasar 1",
    pengampu: "Ustadzah Ummu Khadijah",
    kategori: "Dasar"
  },
  {
    name: "Kelas Dasar 2",
    pengampu: "Ustadzah Khirfatul Jannah",
    kategori: "Dasar"
  }
];

const MASTER_USTADZ = [
  "Ustadz M. Fikri Haekal, C.LQ",
  "Ustadzah A. Lulu Aprilia Latifa",
  "Ustadzah Ummu Khadijah",
  "Ustadzah Khirfatul Jannah"
];

const MASTER_HALAQAH = MASTER_CLASSES.map(c => c.name);

const QURAN_SURAHS = [
  { no: 1, name: "Al-Fatihah", ar: "الفاتحة", verses: 7, juz: 1 },
  { no: 2, name: "Al-Baqarah", ar: "البقرة", verses: 286, juz: 1 },
  { no: 3, name: "Ali 'Imran", ar: "آل عمران", verses: 200, juz: 3 },
  { no: 4, name: "An-Nisa'", ar: "النساء", verses: 176, juz: 4 },
  { no: 5, name: "Al-Ma'idah", ar: "المائدة", verses: 120, juz: 6 },
  { no: 6, name: "Al-An'am", ar: "الأنعام", verses: 165, juz: 7 },
  { no: 7, name: "Al-A'raf", ar: "الأعراف", verses: 206, juz: 8 },
  { no: 8, name: "Al-Anfal", ar: "الأنفال", verses: 75, juz: 9 },
  { no: 9, name: "At-Taubah", ar: "التوبة", verses: 129, juz: 10 },
  { no: 10, name: "Yunus", ar: "يونس", verses: 109, juz: 11 },
  { no: 11, name: "Hud", ar: "هود", verses: 123, juz: 11 },
  { no: 12, name: "Yusuf", ar: "يوسف", verses: 111, juz: 12 },
  { no: 13, name: "Ar-Ra'd", ar: "الرعد", verses: 43, juz: 13 },
  { no: 14, name: "Ibrahim", ar: "إبراهيم", verses: 52, juz: 13 },
  { no: 15, name: "Al-Hijr", ar: "الحجر", verses: 99, juz: 14 },
  { no: 16, name: "An-Nahl", ar: "النحل", verses: 128, juz: 14 },
  { no: 17, name: "Al-Isra'", ar: "الإسراء", verses: 111, juz: 15 },
  { no: 18, name: "Al-Kahf", ar: "الكهف", verses: 110, juz: 15 },
  { no: 19, name: "Maryam", ar: "مريم", verses: 98, juz: 16 },
  { no: 20, name: "Ta-Ha", ar: "طه", verses: 135, juz: 16 },
  { no: 21, name: "Al-Anbiya'", ar: "الأنبياء", verses: 112, juz: 17 },
  { no: 22, name: "Al-Hajj", ar: "الحج", verses: 78, juz: 17 },
  { no: 23, name: "Al-Mu'minun", ar: "المؤمنون", verses: 118, juz: 18 },
  { no: 24, name: "An-Nur", ar: "النور", verses: 64, juz: 18 },
  { no: 25, name: "Al-Furqan", ar: "الفرقان", verses: 77, juz: 18 },
  { no: 26, name: "Asy-Syu'ara'", ar: "الشعراء", verses: 227, juz: 19 },
  { no: 27, name: "An-Naml", ar: "النمل", verses: 93, juz: 19 },
  { no: 28, name: "Al-Qashas", ar: "القصص", verses: 88, juz: 20 },
  { no: 29, name: "Al-'Ankabut", ar: "العنكبوت", verses: 69, juz: 20 },
  { no: 30, name: "Ar-Rum", ar: "الروم", verses: 60, juz: 21 },
  { no: 31, name: "Luqman", ar: "لقمان", verses: 34, juz: 21 },
  { no: 32, name: "As-Sajdah", ar: "السجدة", verses: 30, juz: 21 },
  { no: 33, name: "Al-Ahzab", ar: "الأحزاب", verses: 73, juz: 21 },
  { no: 34, name: "Saba'", ar: "سبأ", verses: 54, juz: 22 },
  { no: 35, name: "Fathir", ar: "فاطر", verses: 45, juz: 22 },
  { no: 36, name: "Ya-Sin", ar: "يس", verses: 83, juz: 22 },
  { no: 37, name: "As-Saffat", ar: "الصافات", verses: 182, juz: 23 },
  { no: 38, name: "Sad", ar: "ص", verses: 88, juz: 23 },
  { no: 39, name: "Az-Zumar", ar: "الزمر", verses: 75, juz: 23 },
  { no: 40, name: "Ghafir", ar: "غافر", verses: 85, juz: 24 },
  { no: 41, name: "Fushshilat", ar: "فصلت", verses: 54, juz: 24 },
  { no: 42, name: "Asy-Syura", ar: "الشورى", verses: 53, juz: 25 },
  { no: 43, name: "Az-Zukhruf", ar: "الزخرف", verses: 89, juz: 25 },
  { no: 44, name: "Ad-Dukhan", ar: "الدخان", verses: 59, juz: 25 },
  { no: 45, name: "Al-Jatsiyah", ar: "الجاثية", verses: 37, juz: 25 },
  { no: 46, name: "Al-Ahqaf", ar: "الأحقاف", verses: 35, juz: 26 },
  { no: 47, name: "Muhammad", ar: "محمد", verses: 38, juz: 26 },
  { no: 48, name: "Al-Fath", ar: "الفتح", verses: 29, juz: 26 },
  { no: 49, name: "Al-Hujurat", ar: "الحجرات", verses: 18, juz: 26 },
  { no: 50, name: "Qaf", ar: "ق", verses: 45, juz: 26 },
  { no: 51, name: "Adz-Dzariyat", ar: "الذاريات", verses: 60, juz: 26 },
  { no: 52, name: "At-Tur", ar: "الطور", verses: 49, juz: 27 },
  { no: 53, name: "An-Najm", ar: "النجم", verses: 62, juz: 27 },
  { no: 54, name: "Al-Qamar", ar: "القمر", verses: 55, juz: 27 },
  { no: 55, name: "Ar-Rahman", ar: "الرحمن", verses: 78, juz: 27 },
  { no: 56, name: "Al-Waqi'ah", ar: "الواقعة", verses: 96, juz: 27 },
  { no: 57, name: "Al-Hadid", ar: "الحديد", verses: 29, juz: 27 },
  { no: 58, name: "Al-Mujadilah", ar: "المجادلة", verses: 22, juz: 28 },
  { no: 59, name: "Al-Hasyr", ar: "الحشر", verses: 24, juz: 28 },
  { no: 60, name: "Al-Mumtahanah", ar: "الممتحنة", verses: 13, juz: 28 },
  { no: 61, name: "As-Saff", ar: "الصف", verses: 14, juz: 28 },
  { no: 62, name: "Al-Jumu'ah", ar: "الجمعة", verses: 11, juz: 28 },
  { no: 63, name: "Al-Munafiqun", ar: "المنافقون", verses: 11, juz: 28 },
  { no: 64, name: "At-Taghabun", ar: "التغابن", verses: 18, juz: 28 },
  { no: 65, name: "At-Talaq", ar: "الطلاق", verses: 12, juz: 28 },
  { no: 66, name: "At-Tahrim", ar: "التحريم", verses: 12, juz: 28 },
  { no: 67, name: "Al-Mulk", ar: "الملك", verses: 30, juz: 29 },
  { no: 68, name: "Al-Qalam", ar: "القلم", verses: 52, juz: 29 },
  { no: 69, name: "Al-Haqqah", ar: "الحاقة", verses: 52, juz: 29 },
  { no: 70, name: "Al-Ma'arij", ar: "المعارج", verses: 44, juz: 29 },
  { no: 71, name: "Nuh", ar: "نوح", verses: 28, juz: 29 },
  { no: 72, name: "Al-Jinn", ar: "الجن", verses: 28, juz: 29 },
  { no: 73, name: "Al-Muzzammil", ar: "المزمل", verses: 20, juz: 29 },
  { no: 74, name: "Al-Muddatstsir", ar: "المدثر", verses: 56, juz: 29 },
  { no: 75, name: "Al-Qiyamah", ar: "القيامة", verses: 40, juz: 29 },
  { no: 76, name: "Al-Insan", ar: "الإنسان", verses: 31, juz: 29 },
  { no: 77, name: "Al-Mursalat", ar: "المرسلات", verses: 50, juz: 29 },
  { no: 78, name: "An-Naba'", ar: "النبأ", verses: 40, juz: 30 },
  { no: 79, name: "An-Nazi'at", ar: "النازعات", verses: 46, juz: 30 },
  { no: 80, name: "'Abasa", ar: "عبس", verses: 42, juz: 30 },
  { no: 81, name: "At-Takwir", ar: "التكوير", verses: 29, juz: 30 },
  { no: 82, name: "Al-Infitar", ar: "الانفطار", verses: 19, juz: 30 },
  { no: 83, name: "Al-Muthaffifin", ar: "المطففين", verses: 36, juz: 30 },
  { no: 84, name: "Al-Insyiqaq", ar: "الانشقاق", verses: 25, juz: 30 },
  { no: 85, name: "Al-Buruj", ar: "البروج", verses: 22, juz: 30 },
  { no: 86, name: "At-Tariq", ar: "الطارق", verses: 17, juz: 30 },
  { no: 87, name: "Al-A'la", ar: "الأعلى", verses: 19, juz: 30 },
  { no: 88, name: "Al-Ghasyiyah", ar: "الغاشية", verses: 26, juz: 30 },
  { no: 89, name: "Al-Fajr", ar: "الفجر", verses: 30, juz: 30 },
  { no: 90, name: "Al-Balad", ar: "البلد", verses: 20, juz: 30 },
  { no: 91, name: "Asy-Syams", ar: "الشمس", verses: 15, juz: 30 },
  { no: 92, name: "Al-Lail", ar: "الليل", verses: 21, juz: 30 },
  { no: 93, name: "Adh-Dhuha", ar: "الضحى", verses: 11, juz: 30 },
  { no: 94, name: "Asy-Syarh", ar: "الشرح", verses: 8, juz: 30 },
  { no: 95, name: "At-Tin", ar: "التين", verses: 8, juz: 30 },
  { no: 96, name: "Al-'Alaq", ar: "العلق", verses: 19, juz: 30 },
  { no: 97, name: "Al-Qadr", ar: "القدر", verses: 5, juz: 30 },
  { no: 98, name: "Al-Bayyinah", ar: "البينة", verses: 8, juz: 30 },
  { no: 99, name: "Az-Zalzalah", ar: "الزلزلة", verses: 8, juz: 30 },
  { no: 100, name: "Al-'Adiyat", ar: "العاديات", verses: 11, juz: 30 },
  { no: 101, name: "Al-Qari'ah", ar: "القارعة", verses: 11, juz: 30 },
  { no: 102, name: "At-Takatsur", ar: "التكاثر", verses: 8, juz: 30 },
  { no: 103, name: "Al-'Asr", ar: "العصر", verses: 3, juz: 30 },
  { no: 104, name: "Al-Humazah", ar: "الهمزة", verses: 9, juz: 30 },
  { no: 105, name: "Al-Fil", ar: "الفيل", verses: 5, juz: 30 },
  { no: 106, name: "Quraisy", ar: "قريش", verses: 4, juz: 30 },
  { no: 107, name: "Al-Ma'un", ar: "الماعون", verses: 7, juz: 30 },
  { no: 108, name: "Al-Kautsar", ar: "الكوثر", verses: 3, juz: 30 },
  { no: 109, name: "Al-Kafirun", ar: "الكافرون", verses: 6, juz: 30 },
  { no: 110, name: "An-Nashr", ar: "النصر", verses: 3, juz: 30 },
  { no: 111, name: "Al-Lahab", ar: "اللهب", verses: 5, juz: 30 },
  { no: 112, name: "Al-Ikhlas", ar: "الإخلاص", verses: 4, juz: 30 },
  { no: 113, name: "Al-Falaq", ar: "الفلق", verses: 5, juz: 30 },
  { no: 114, name: "An-Nas", ar: "الناس", verses: 6, juz: 30 }
];

const TAMHID_JILID_OPTIONS = [
  "Tamhid Jilid 1 (Makharij & Harakat)",
  "Tamhid Jilid 2 (Mad & Tanwin)",
  "Tamhid Jilid 3 (Sukun, Tasydid & Idgham)",
  "Tamhid Jilid 4 (Ghunnah, Ikhfa & Waqaf)"
];

// Data santri awal (menggunakan nomor urut, tanpa kode NIS)
const MASTER_SANTRI = [
  // 1. KELAS MENENGAH IKHWAN (Pengampu: Ustadz M. Fikri Haekal, C.LQ)
  {
    id: "S01",
    nama: "Ahmad Rayyan Al-Fatih",
    halaqah: "Kelas Menengah Ikhwan",
    kategori: "Menengah",
    avatar: "👦🏻",
    foto: "",
    statusBelajar: "Tartil Qur'an"
  },
  {
    id: "S02",
    nama: "Fathir Daniswara Putra",
    halaqah: "Kelas Menengah Ikhwan",
    kategori: "Menengah",
    avatar: "👦🏼",
    foto: "",
    statusBelajar: "Tamhid"
  },
  {
    id: "S03",
    nama: "Yusuf Al-Qarni",
    halaqah: "Kelas Menengah Ikhwan",
    kategori: "Menengah",
    avatar: "👦🏽",
    foto: "",
    statusBelajar: "Tamhid"
  },
  {
    id: "S04",
    nama: "Khalid Basalamah",
    halaqah: "Kelas Menengah Ikhwan",
    kategori: "Menengah",
    avatar: "👦🏻",
    foto: "",
    statusBelajar: "Tamhid"
  },

  // 2. KELAS MENENGAH AKHOWAT (Pengampu: Ustadzah A. Lulu Aprilia Latifa)
  {
    id: "S05",
    nama: "Fatima Azzahra",
    halaqah: "Kelas Menengah Akhowat",
    kategori: "Menengah",
    avatar: "👧🏻",
    foto: "",
    statusBelajar: "Tartil Qur'an"
  },
  {
    id: "S06",
    nama: "Maryam Humaira",
    halaqah: "Kelas Menengah Akhowat",
    kategori: "Menengah",
    avatar: "🧕🏻",
    foto: "",
    statusBelajar: "Tartil Qur'an"
  },
  {
    id: "S07",
    nama: "Zahra Salsabila",
    halaqah: "Kelas Menengah Akhowat",
    kategori: "Menengah",
    avatar: "🧕🏼",
    foto: "",
    statusBelajar: "Tamhid"
  },

  // 3. KELAS DASAR 1 (Pengampu: Ustadzah Ummu Khadijah)
  {
    id: "S08",
    nama: "Muhammad Ziyad Rabbani",
    halaqah: "Kelas Dasar 1",
    kategori: "Dasar",
    avatar: "🧒🏻",
    foto: "",
    statusBelajar: "Tamhid"
  },
  {
    id: "S09",
    nama: "Bilal Habasyi Ramadhan",
    halaqah: "Kelas Dasar 1",
    kategori: "Dasar",
    avatar: "👦🏽",
    foto: "",
    statusBelajar: "Tamhid"
  },
  {
    id: "S10",
    nama: "Ibrahim Khalilullah",
    halaqah: "Kelas Dasar 1",
    kategori: "Dasar",
    avatar: "👦🏻",
    foto: "",
    statusBelajar: "Tamhid"
  },
  {
    id: "S11",
    nama: "Aisyah Nuha Qanita",
    halaqah: "Kelas Dasar 1",
    kategori: "Dasar",
    avatar: "👧🏻",
    foto: "",
    statusBelajar: "Tamhid"
  },

  // 4. KELAS DASAR 2 (Pengampu: Ustadzah Khirfatul Jannah)
  {
    id: "S12",
    nama: "Hafizh Al-Bukhari",
    halaqah: "Kelas Dasar 2",
    kategori: "Dasar",
    avatar: "🧒🏼",
    foto: "",
    statusBelajar: "Tamhid"
  },
  {
    id: "S13",
    nama: "Syifa Naura Al-Madina",
    halaqah: "Kelas Dasar 2",
    kategori: "Dasar",
    avatar: "👧🏼",
    foto: "",
    statusBelajar: "Tamhid"
  },
  {
    id: "S14",
    nama: "Kenzo Ar-Rasyid",
    halaqah: "Kelas Dasar 2",
    kategori: "Dasar",
    avatar: "👦🏻",
    foto: "",
    statusBelajar: "Tamhid"
  },
  {
    id: "S15",
    nama: "Dzaki Al-Mubarak",
    halaqah: "Kelas Dasar 2",
    kategori: "Dasar",
    avatar: "🧒🏻",
    foto: "",
    statusBelajar: "Tamhid"
  },
  {
    id: "S16",
    nama: "Naila Husna Syafiqah",
    halaqah: "Kelas Dasar 2",
    kategori: "Dasar",
    avatar: "👧🏼",
    foto: "",
    statusBelajar: "Tamhid"
  }
];

// Seed awal data mutaba'ah
const INITIAL_SETORAN_RECORDS = [
  {
    id: "REC-001",
    tanggal: "2026-10-16",
    santriId: "S01",
    namaSantri: "Ahmad Rayyan Al-Fatih",
    halaqah: "Kelas Menengah Ikhwan",
    kategori: "Menengah",
    ustadz: "Ustadz M. Fikri Haekal, C.LQ",
    bacaanTipe: "Tartil",
    tartilJuz: 30,
    tartilHalaman: "Halaman 582",
    bacaanStatus: "Lanjut",
    bacaanCatatan: "Tartil sangat fasih.",
    hafalanJenis: "Ziyadah",
    surahAwal: "An-Naba'",
    ayatAwal: 1,
    surahAkhir: "An-Naba'",
    ayatAkhir: 20,
    bintangTajwid: 5,
    bintangKelancaran: 5,
    bintangMakhraj: 5,
    totalBintang: 15,
    hafalanStatus: "Lulus",
    hafalanCatatan: "Mumtaz! Hafalan mantap."
  },
  {
    id: "REC-002",
    tanggal: "2026-10-15",
    santriId: "S01",
    namaSantri: "Ahmad Rayyan Al-Fatih",
    halaqah: "Kelas Menengah Ikhwan",
    kategori: "Menengah",
    ustadz: "Ustadz M. Fikri Haekal, C.LQ",
    bacaanTipe: "Tartil",
    tartilJuz: 30,
    tartilHalaman: "Halaman 580",
    bacaanStatus: "Lanjut",
    bacaanCatatan: "Lancar.",
    hafalanJenis: "Muroja'ah",
    surahAwal: "An-Nazi'at",
    ayatAwal: 1,
    surahAkhir: "An-Nazi'at",
    ayatAkhir: 25,
    bintangTajwid: 5,
    bintangKelancaran: 5,
    bintangMakhraj: 4,
    totalBintang: 14,
    hafalanStatus: "Lulus",
    hafalanCatatan: "Kelancaran bagus."
  },
  {
    id: "REC-003",
    tanggal: "2026-10-16",
    santriId: "S05",
    namaSantri: "Fatima Azzahra",
    halaqah: "Kelas Menengah Akhowat",
    kategori: "Menengah",
    ustadz: "Ustadzah A. Lulu Aprilia Latifa",
    bacaanTipe: "Tartil",
    tartilJuz: 29,
    tartilHalaman: "Halaman 562",
    bacaanStatus: "Lanjut",
    bacaanCatatan: "Tartil tartila.",
    hafalanJenis: "Ziyadah",
    surahAwal: "Al-Mulk",
    ayatAwal: 1,
    surahAkhir: "Al-Mulk",
    ayatAkhir: 15,
    bintangTajwid: 5,
    bintangKelancaran: 5,
    bintangMakhraj: 4,
    totalBintang: 14,
    hafalanStatus: "Lulus",
    hafalanCatatan: "Masya Allah mutqin."
  },
  {
    id: "REC-004",
    tanggal: "2026-10-16",
    santriId: "S08",
    namaSantri: "Muhammad Ziyad Rabbani",
    halaqah: "Kelas Dasar 1",
    kategori: "Dasar",
    ustadz: "Ustadzah Ummu Khadijah",
    bacaanTipe: "Tamhid",
    tamhidJilid: "Tamhid Jilid 2 (Mad & Tanwin)",
    tamhidHalaman: "Halaman 15",
    bacaanStatus: "Lanjut",
    bacaanCatatan: "Bagus sekali di usianya.",
    hafalanJenis: "Ziyadah",
    surahAwal: "Al-A'la",
    ayatAwal: 1,
    surahAkhir: "Al-A'la",
    ayatAkhir: 19,
    bintangTajwid: 5,
    bintangKelancaran: 5,
    bintangMakhraj: 4,
    totalBintang: 14,
    hafalanStatus: "Lulus",
    hafalanCatatan: "Mumtaz! Sangat lancar."
  },
  {
    id: "REC-005",
    tanggal: "2026-10-14",
    santriId: "S08",
    namaSantri: "Muhammad Ziyad Rabbani",
    halaqah: "Kelas Dasar 1",
    kategori: "Dasar",
    ustadz: "Ustadzah Ummu Khadijah",
    bacaanTipe: "Tamhid",
    tamhidJilid: "Tamhid Jilid 2 (Mad & Tanwin)",
    tamhidHalaman: "Halaman 12",
    bacaanStatus: "Lanjut",
    bacaanCatatan: "Lancar.",
    hafalanJenis: "Muroja'ah",
    surahAwal: "At-Tariq",
    ayatAwal: 1,
    surahAkhir: "At-Tariq",
    ayatAkhir: 17,
    bintangTajwid: 4,
    bintangKelancaran: 4,
    bintangMakhraj: 4,
    totalBintang: 12,
    hafalanStatus: "Lulus",
    hafalanCatatan: "Bagus."
  },
  {
    id: "REC-006",
    tanggal: "2026-10-15",
    santriId: "S12",
    namaSantri: "Hafizh Al-Bukhari",
    halaqah: "Kelas Dasar 2",
    kategori: "Dasar",
    ustadz: "Ustadzah Khirfatul Jannah",
    bacaanTipe: "Tamhid",
    tamhidJilid: "Tamhid Jilid 1 (Makharij & Harakat)",
    tamhidHalaman: "Halaman 20",
    bacaanStatus: "Lanjut",
    bacaanCatatan: "Harakat sudah jelas.",
    hafalanJenis: "Ziyadah",
    surahAwal: "Adh-Dhuha",
    ayatAwal: 1,
    surahAkhir: "Adh-Dhuha",
    ayatAkhir: 11,
    bintangTajwid: 4,
    bintangKelancaran: 4,
    bintangMakhraj: 3,
    totalBintang: 11,
    hafalanStatus: "Lulus",
    hafalanCatatan: "Alhamdulillah sudah hafal surat Adh-Dhuha."
  }
];

/**
 * =======================================================================
 * FOLDER HADITS PENDEK PILIHAN (KHUSUS ANAK SD - SHOHIH)
 * Teks Lengkap: Arab Berharakat, Latin Transliterasi, Terjemahan & Takhrij
 * Memudahkan keseragaman pengajaran antara Ustadz/ah dan Wali Santri
 * =======================================================================
 */
const MASTER_HADITS = [
  {
    id: "H01",
    nomor: 1,
    judul: "Keutamaan Belajar Al-Qur'an",
    kategori: "Al-Qur'an",
    arab: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    latin: "Khairukum man ta'allamal Qur'aana wa 'allamah.",
    arti: "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya.",
    riwayat: "HR. Bukhari (No. 5027)",
    penjelasan: "Mendorong ananda untuk tekun membaca, menghafal, dan mengajarkan Al-Qur'an."
  },
  {
    id: "H02",
    nomor: 2,
    judul: "Senyum adalah Sedekah",
    kategori: "Adab & Akhlak",
    arab: "تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ",
    latin: "Tabassumuka fii wajhi akhiika laka shadaqah.",
    arti: "Senyummu di hadapan saudaramu adalah (bernilai) sedekah bagimu.",
    riwayat: "HR. At-Tirmidzi (No. 1956) - Shahih",
    penjelasan: "Mengajarkan keramahan dan wajah ceria kepada sesama teman dan keluarga."
  },
  {
    id: "H03",
    nomor: 3,
    judul: "Menahan Marah",
    kategori: "Adab & Akhlak",
    arab: "لَا تَغْضَبْ وَلَكَ الْجَنَّةُ",
    latin: "Laa taghdhab wa lakal jannah.",
    arti: "Janganlah kamu marah, maka bagimu surga.",
    riwayat: "HR. At-Thabrani, Shahih At-Targhib (No. 2749)",
    penjelasan: "Melatih anak untuk sabar, menahan emosi, dan memaafkan teman."
  },
  {
    id: "H04",
    nomor: 4,
    judul: "Menuntut Ilmu Itu Wajib",
    kategori: "Menuntut Ilmu",
    arab: "طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ",
    latin: "Tholabul 'ilmi fariidhotun 'alaa kulli muslim.",
    arti: "Menuntut ilmu itu wajib atas setiap muslim.",
    riwayat: "HR. Ibnu Majah (No. 224) - Shahih",
    penjelasan: "Menumbuhkan semangat belajar agama dan ilmu yang bermanfaat sejak usia dini."
  },
  {
    id: "H05",
    nomor: 5,
    judul: "Kebersihan Sebagian dari Iman",
    kategori: "Kebersihan",
    arab: "الطُّهُورُ شَطْرُ الْإِيمَانِ",
    latin: "Ath-thuhuuru syathrul iimaan.",
    arti: "Kesucian (kebersihan) itu adalah sebagian dari iman.",
    riwayat: "HR. Muslim (No. 223)",
    penjelasan: "Membiasakan hidup bersih, rajin berwudhu, dan menjaga kerapian diri."
  },
  {
    id: "H06",
    nomor: 6,
    judul: "Adab Makan Tangan Kanan",
    kategori: "Adab Makan",
    arab: "سَمِّ اللّٰهَ، وَكُلْ بِيَمِينِكَ، وَكُلْ مِمَّا يَلِيكَ",
    latin: "Sammillaah, wa kul biyamiinika, wa kul mimmaa yaliik.",
    arti: "Bacalah bismillah, makanlah dengan tangan kananmu, dan makanlah makanan yang berada di dekatmu.",
    riwayat: "HR. Bukhari (No. 5376) & Muslim (No. 2022)",
    penjelasan: "Adab Islami saat makan: berdoa, tangan kanan, dan tidak serakah."
  },
  {
    id: "H07",
    nomor: 7,
    judul: "Menjaga Lisan (Berkata Baik atau Diam)",
    kategori: "Adab & Akhlak",
    arab: "مَنْ كَانَ يُؤْمِنُ بِاللّٰهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",
    latin: "Man kaana yu'minu billaahi wal yaumil aakhiri fal-yaqul khairan au liyashmut.",
    arti: "Barangsiapa beriman kepada Allah dan hari akhir, hendaklah berkata yang baik atau diam.",
    riwayat: "HR. Bukhari (No. 6018) & Muslim (No. 47)",
    penjelasan: "Menjaga lisan dari kata-kata kotor, mengejek, atau berbohong."
  },
  {
    id: "H08",
    nomor: 8,
    judul: "Sifat Kasih Sayang",
    kategori: "Kasih Sayang",
    arab: "مَنْ لَا يَرْحَمْ لَا يُرْحَمْ",
    latin: "Man laa yarham laa yurham.",
    arti: "Barangsiapa tidak menyayangi, maka tidak akan disayangi.",
    riwayat: "HR. Bukhari (No. 5997) & Muslim (No. 2318)",
    penjelasan: "Menyayangi sesama muslim, adik, hewan peliharaan, dan tumbuhan."
  },
  {
    id: "H09",
    nomor: 9,
    judul: "Niat Dalam Beramal",
    kategori: "Ibadah",
    arab: "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
    latin: "Innamal a'maalu bin-niyyaat.",
    arti: "Sesungguhnya setiap amal perbuatan tergantung pada niatnya.",
    riwayat: "HR. Bukhari (No. 1) & Muslim (No. 1907)",
    penjelasan: "Mengikhlaskan niat semata-mata mencari ridho Allah dalam setiap aktivitas."
  },
  {
    id: "H10",
    nomor: 10,
    judul: "Malu Adalah Bagian Iman",
    kategori: "Adab & Akhlak",
    arab: "الْحَيَاءُ مِنَ الْإِيمَانِ",
    latin: "Al-hayaa-u minal iimaan.",
    arti: "Malu (berbuat maksiat) itu adalah sebagian dari iman.",
    riwayat: "HR. Bukhari (No. 24) & Muslim (No. 36)",
    penjelasan: "Menanamkan rasa malu kepada Allah saat hendak berbuat kesalahan."
  },
  {
    id: "H11",
    nomor: 11,
    judul: "Menebarkan Salam",
    kategori: "Adab & Akhlak",
    arab: "أَفْشُوا السَّلَامَ بَيْنَكُمْ",
    latin: "Afsyus-salaama bainakum.",
    arti: "Sebarkanlah salam di antara kalian.",
    riwayat: "HR. Muslim (No. 54)",
    penjelasan: "Membiasakan mengucapkan salam 'Assalamu'alaikum' saat bertemu teman dan guru."
  },
  {
    id: "H12",
    nomor: 12,
    judul: "Shalat Adalah Tiang Agama",
    kategori: "Shalat",
    arab: "الصَّلَاةُ عِمَادُ الدِّينِ",
    latin: "Ash-shalaatu 'imaadud-diin.",
    arti: "Shalat itu adalah tiang agama.",
    riwayat: "HR. Al-Baihaqi (Shahih)",
    penjelasan: "Memperkuat motivasi anak untuk tidak meninggalkan shalat lima waktu."
  },
  {
    id: "H13",
    nomor: 13,
    judul: "Kejujuran Membimbing Kebaikan",
    kategori: "Adab & Akhlak",
    arab: "عَلَيْكُمْ بِالصِّدْقِ فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ",
    latin: "'Alaikum bish-shidqi fa-innash-shidqa yahdii ilal birr.",
    arti: "Hendaklah kalian berlaku jujur, karena sesungguhnya kejujuran itu menuntun kepada kebaikan.",
    riwayat: "HR. Bukhari (No. 6094) & Muslim (No. 2607)",
    penjelasan: "Selalu berkata jujur dalam ucapan dan perbuatan di mana pun berada."
  },
  {
    id: "H14",
    nomor: 14,
    judul: "Ridho Allah Bersama Ridho Orang Tua",
    kategori: "Berbakti Orang Tua",
    arab: "رِضَا الرَّبِّ فِي رِضَا الْوَالِدِ، وَسَخَطُ الرَّبِّ فِي سَخَطِ الْوَالِدِ",
    latin: "Ridhar-Rabbi fii ridhal waalid, wa sakhatur-Rabbi fii sakhatil waalid.",
    arti: "Ridha Allah bergantung pada ridha kedua orang tua, dan murka Allah bergantung pada murka kedua orang tua.",
    riwayat: "HR. At-Tirmidzi (No. 1899) - Shahih",
    penjelasan: "Mendidik santri untuk senantiasa patuh, berbakti, dan membahagiakan ayah dan ibu."
  },
  {
    id: "H15",
    nomor: 15,
    judul: "Suka Menolong Sesama Muslim",
    kategori: "Kasih Sayang",
    arab: "وَاللّٰهُ فِي عَوْنِ الْعَبْدِ مَا كَانَ الْعَبْدُ فِي عَوْنِ أَخِيهِ",
    latin: "Wallaahu fii 'aunil 'abdi maa kaanal 'abdu fii 'auni akhiih.",
    arti: "Allah senantiasa menolong seorang hamba selama hamba itu suka menolong saudaranya.",
    riwayat: "HR. Muslim (No. 2699)",
    penjelasan: "Membiasakan empati dan suka menolong teman yang sedang kesulitan."
  },
  {
    id: "H16",
    nomor: 16,
    judul: "Larangan Mengadu Domba",
    kategori: "Adab & Akhlak",
    arab: "لَا يَدْخُلُ الْجَنَّةَ نَمَّامٌ",
    latin: "Laa yadkhulul jannata nammaam.",
    arti: "Tidak akan masuk surga orang yang suka mengadu domba.",
    riwayat: "HR. Bukhari (No. 6056) & Muslim (No. 105)",
    penjelasan: "Menjaga persaudaraan santri dari fitnah dan mengadu domba antarteman."
  },
  {
    id: "H17",
    nomor: 17,
    judul: "Tangan di Atas Lebih Baik",
    kategori: "Sedekah",
    arab: "الْيَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى",
    latin: "Al-yadul 'ulyaa khairum minal yadissuf-laa.",
    arti: "Tangan yang di atas (memberi) lebih baik daripada tangan yang di bawah (meminta-minta).",
    riwayat: "HR. Bukhari (No. 1429) & Muslim (No. 1033)",
    penjelasan: "Mendidik anak agar berjiwa dermawan, suka memberi, dan tidak mudah meminta-minta."
  },
  {
    id: "H18",
    nomor: 18,
    judul: "Jauhi Berburuk Sangka",
    kategori: "Adab & Akhlak",
    arab: "إِيَّاكُمْ وَالظَّنَّ فَإِنَّ الظَّنَّ أَكْذَبُ الْحَدِيثِ",
    latin: "Iyyaakum wazh-zhanna fa-innazh-zhanna akdzabul hadiits.",
    arti: "Jauhilah prasangka buruk, karena prasangka buruk itu adalah sedusta-dusta perkataan.",
    riwayat: "HR. Bukhari (No. 5143) & Muslim (No. 2563)",
    penjelasan: "Mengajarkan husnudzan (berbaik sangka) kepada teman dan orang lain."
  },
  {
    id: "H19",
    nomor: 19,
    judul: "Mencintai Saudara Seiman",
    kategori: "Kasih Sayang",
    arab: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",
    latin: "Laa yu'minu ahadukum hattaa yuhibba li-akhiihi maa yuhibbu linafsih.",
    arti: "Tidak sempurna iman salah seorang di antara kalian sampai ia mencintai saudaranya seperti mencintai dirinya sendiri.",
    riwayat: "HR. Bukhari (No. 13) & Muslim (No. 45)",
    penjelasan: "Menghindari rasa iri dengki dan ikut berbahagia saat teman mendapat prestasi."
  },
  {
    id: "H20",
    nomor: 20,
    judul: "Setiap Kebaikan Adalah Sedekah",
    kategori: "Sedekah",
    arab: "كُلُّ مَعْرُوفٍ صَدَقَةٌ",
    latin: "Kullu ma'ruufin shadaqah.",
    arti: "Setiap perbuatan baik adalah sedekah.",
    riwayat: "HR. Bukhari (No. 6021) & Muslim (No. 1005)",
    penjelasan: "Menyingkirkan duri, membuang sampah pada tempatnya, dan membantu teman adalah sedekah."
  },
  {
    id: "H21",
    nomor: 21,
    judul: "Memuliakan Tetangga",
    kategori: "Adab & Akhlak",
    arab: "مَنْ كَانَ يُؤْمِنُ بِاللّٰهِ وَالْيَوْمِ الْآخِرِ فَلْيُكْرِمْ جَارَهُ",
    latin: "Man kaana yu'minu billaahi wal yaumil aakhiri falyukrim jaarah.",
    arti: "Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia memuliakan tetangganya.",
    riwayat: "HR. Bukhari (No. 6019) & Muslim (No. 48)",
    penjelasan: "Menjaga hubungan baik dengan tetangga sekitar rumah, tidak berisik, dan saling berbagi makanan."
  },
  {
    id: "H22",
    nomor: 22,
    judul: "Menuntut Ilmu Jalan ke Surga",
    kategori: "Menuntut Ilmu",
    arab: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللّٰهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",
    latin: "Man salaka thariiqan yaltamisu fiihi 'ilman sahhallallaahu lahu bihii thariiqan ilal jannah.",
    arti: "Barangsiapa menempuh suatu jalan untuk mencari ilmu, maka Allah akan memudahkan baginya jalan menuju surga.",
    riwayat: "HR. Muslim (No. 2699)",
    penjelasan: "Setiap langkah ananda pergi ke madrasah / Rumah Qur'an bernilai pahala dan mendekatkan ke surga."
  },
  {
    id: "H23",
    nomor: 23,
    judul: "Satu Huruf Al-Qur'an Sepuluh Kebaikan",
    kategori: "Al-Qur'an",
    arab: "مَنْ قَرَأَ حَرْفًا مِنْ كِتَابِ اللّٰهِ فَلَهُ بِهِ حَسَنَةٌ، وَالْحَسَنَةُ بِعَشْرِ أَمْثَالِهَا",
    latin: "Man qara-a harfan min kitaabillaahi falahuu bihii hasanah, wal hasanatu bi'asyri amtsaalihaa.",
    arti: "Barangsiapa membaca satu huruf dari Kitab Allah (Al-Qur'an), maka baginya satu kebaikan, dan satu kebaikan dilipatgandakan sepuluh kali.",
    riwayat: "HR. At-Tirmidzi (No. 2910) - Shahih",
    penjelasan: "Memotivasi anak untuk rajin tadarus dan mengulang hafalan setiap hari walau beberapa ayat."
  },
  {
    id: "H24",
    nomor: 24,
    judul: "Sayangi yang Muda & Hormati yang Tua",
    kategori: "Kasih Sayang",
    arab: "لَيْسَ مِنَّا مَنْ لَمْ يَرْحَمْ صَغِيرَنَا وَيَعْرِفْ شَرَفَ كَبِيرِنَا",
    latin: "Laisa minnaa man lam yarham shaghiiranaa wa ya'rif syarafa kabiirinaa.",
    arti: "Bukan termasuk golongan kami orang yang tidak menyayangi yang lebih muda di antara kami dan tidak menghormati yang lebih tua.",
    riwayat: "HR. At-Tirmidzi (No. 1919) - Shahih",
    penjelasan: "Mengajarkan santri kelas menengah menyayangi santri kelas dasar, dan adik-adik menghormati kakak kelas."
  },
  {
    id: "H25",
    nomor: 25,
    judul: "Larangan Mencela & Berkata Kotor",
    kategori: "Adab & Akhlak",
    arab: "سِبَابُ الْمُسْلِمِ فُسُوقٌ، وَقِتَالُهُ كُفْرٌ",
    latin: "Sibaabul muslimi fusuuqun, wa qitaaluhuu kufr.",
    arti: "Mencaci seorang muslim adalah perbuatan fasik, dan membunuhnya adalah kekufuran.",
    riwayat: "HR. Bukhari (No. 48) & Muslim (No. 64)",
    penjelasan: "Menjaga perkataan dari memanggil teman dengan julukan buruk atau mencela."
  },
  {
    id: "H26",
    nomor: 26,
    judul: "Menunjukkan Kebaikan Mendapat Pahala",
    kategori: "Sedekah",
    arab: "الدَّالُّ عَلَى الْخَيْرِ كَفَاعِلِهِ",
    latin: "Ad-daallu 'alal khairi kafaa'ilih.",
    arti: "Orang yang menunjukkan kepada kebaikan mendapatkan pahala sama seperti orang yang melakukannya.",
    riwayat: "HR. At-Tirmidzi (No. 2670) - Shahih",
    penjelasan: "Mengajak teman sholat berjamaah atau mengaji Al-Qur'an mendatangkan aliran pahala kebaikan."
  },
  {
    id: "H27",
    nomor: 27,
    judul: "Larangan Meniup Makanan & Minuman",
    kategori: "Adab Makan",
    arab: "نَهَى رَسُولُ اللّٰهِ ﷺ أَنْ يُتَنَفَّسَ فِي الْإِنَاءِ أَوْ يُنْفَخَ فِيهِ",
    latin: "Nahaa Rasuulullaahi ﷺ an yutanaffasa fil inaa-i au yunfakha fiih.",
    arti: "Rasulullah ﷺ melarang bernafas di dalam bejana air atau meniup makanan/minuman di dalamnya.",
    riwayat: "HR. Abu Dawud (No. 3728) & At-Tirmidzi (No. 1888) - Shahih",
    penjelasan: "Adab makan sehat Islami: bersabar menunggu makanan panas menjadi hangat secara alami."
  },
  {
    id: "H28",
    nomor: 28,
    judul: "Memuliakan Tamu yang Berkunjung",
    kategori: "Adab & Akhlak",
    arab: "مَنْ كَانَ يُؤْمِنُ بِاللّٰهِ وَالْيَوْمِ الْآخِرِ فَلْيُكْرِمْ ضَيْفَهُ",
    latin: "Man kaana yu'minu billaahi wal yaumil aakhiri falyukrim dhaifah.",
    arti: "Barangsiapa beriman kepada Allah dan hari akhir, hendaklah ia memuliakan tamunya.",
    riwayat: "HR. Bukhari (No. 6018) & Muslim (No. 48)",
    penjelasan: "Membiasakan menyambut tamu di rumah dengan senyum, ucapan sopan, dan menyajikan hidangan."
  },
  {
    id: "H29",
    nomor: 29,
    judul: "Shalat Tepat Pada Waktunya",
    kategori: "Shalat",
    arab: "سُئِلَ النَّبِيُّ ﷺ: أَيُّ الْعَمَلِ أَحَبُّ إِلَى اللّٰهِ؟ قَالَ: الصَّلَاةُ عَلَى وَقْتِهَا",
    latin: "Su-ilan-Nabiyyu ﷺ: Ayyul 'amali ahabbu ilallaah? Qaala: Ash-shalaatu 'alaa waqtihaa.",
    arti: "Nabi ﷺ ditanya: Amalan apakah yang paling dicintai Allah? Beliau menjawab: Shalat pada waktunya.",
    riwayat: "HR. Bukhari (No. 527) & Muslim (No. 85)",
    penjelasan: "Segera mengambil wudhu saat adzan berkumandang tanpa menunda-nunda waktu shalat."
  },
  {
    id: "H30",
    nomor: 30,
    judul: "Do'a Adalah Inti Ibadah",
    kategori: "Ibadah",
    arab: "الدُّعَاءُ هُوَ الْعِبَادَةُ",
    latin: "Ad-du'aa-u huwal 'ibaadah.",
    arti: "Do'a itu adalah ibadah (intisari dari penghambaan).",
    riwayat: "HR. Abu Dawud (No. 1479) & At-Tirmidzi (No. 2969) - Shahih",
    penjelasan: "Membiasakan anak untuk selalu meminta pertolongan dan kelancaran belajar hanya kepada Allah."
  },
  {
    id: "H31",
    nomor: 31,
    judul: "Larangan Memutus Tali Persaudaraan",
    kategori: "Kasih Sayang",
    arab: "لَا يَدْخُلُ الْجَنَّةَ قَاطِعٌ",
    latin: "Laa yadkhulul jannata qaathi'.",
    arti: "Tidak akan masuk surga orang yang memutus hubungan silaturrahim (kekeluargaan).",
    riwayat: "HR. Bukhari (No. 5984) & Muslim (No. 2556)",
    penjelasan: "Mengajarkan anak untuk cepat berbaikan setelah berselisih paham dan menyambung silaturrahim."
  },
  {
    id: "H32",
    nomor: 32,
    judul: "Rendah Hati Diangkat Derajatnya",
    kategori: "Adab & Akhlak",
    arab: "وَمَا تَوَاضَعَ أَحَدٌ لِلّٰهِ إِلَّا رَفَعَهُ اللّٰهُ",
    latin: "Wa maa tawaadha'a ahadun lillaahi illaa rafa'ahullaah.",
    arti: "Tidaklah seseorang merendahkan hati karena Allah melainkan Allah akan meninggikan derajatnya.",
    riwayat: "HR. Muslim (No. 2588)",
    penjelasan: "Tidak boleh sombong dengan kepintaran atau banyaknya hafalan surah yang dimiliki."
  },
  {
    id: "H33",
    nomor: 33,
    judul: "Katakan Kebenaran Walau Pahit",
    kategori: "Adab & Akhlak",
    arab: "قُلِ الْحَقَّ وَلَوْ كَانَ مُرًّا",
    latin: "Qulil haqqa walau kaana murraa.",
    arti: "Katakanlah kebenaran itu walaupun terasa pahit.",
    riwayat: "HR. Ahmad (No. 21415), Ibnu Hibban - Shahih",
    penjelasan: "Melatih kejujuran dan keberanian mengakui kesalahan saat melakukan kekhilafan."
  },
  {
    id: "H34",
    nomor: 34,
    judul: "Adab Menjaga Perasaan Teman",
    kategori: "Adab & Akhlak",
    arab: "إِذَا كُنْتُمْ ثَلَاثَةً فَلَا يَتَنَاجَى اثْنَانِ دُونَ صَاحِبِهِمَا",
    latin: "Idzaa kuntum tsalaatsatan falaa yatanaajats-naani duuna shaahibihimaa.",
    arti: "Jika kalian bertiga, janganlah dua orang berbisik-bisik tanpa menyertakan orang ketiga.",
    riwayat: "HR. Bukhari (No. 6290) & Muslim (No. 2184)",
    penjelasan: "Menghindari berbisik-bisik di depan teman lain agar teman tersebut tidak merasa sedih atau terasingkan."
  },
  {
    id: "H35",
    nomor: 35,
    judul: "Menjaga Wudhu Tanda Keimanan",
    kategori: "Kebersihan",
    arab: "وَلَا يُحَافِظُ عَلَى الْوُضُوءِ إِلَّا مُؤْمِنٌ",
    latin: "Wa laa yuhaafizhu 'alal wudhuu-i illaa mu'min.",
    arti: "Dan tidak ada yang senantiasa menjaga wudhu melainkan orang yang beriman.",
    riwayat: "HR. Ibnu Majah (No. 277) & Ahmad - Shahih",
    penjelasan: "Membiasakan dalam keadaan suci (dawamul wudhu) saat menghafal dan menyimak Al-Qur'an."
  },
  {
    id: "H36",
    nomor: 36,
    judul: "Berterima Kasih Kepada Manusia",
    kategori: "Adab & Akhlak",
    arab: "مَنْ لَمْ يَشْكُرِ النَّاسَ لَمْ يَشْكُرِ اللّٰهَ",
    latin: "Man lam yasykurin-naasa lam yasykurillaah.",
    arti: "Barangsiapa tidak bersyukur (berterima kasih) kepada manusia, maka ia tidak bersyukur kepada Allah.",
    riwayat: "HR. Abu Dawud (No. 4811) & At-Tirmidzi (No. 1954) - Shahih",
    penjelasan: "Membiasakan mengucapkan terima kasih / 'Jazakallahu khairan' atas bantuan orang lain."
  },
  {
    id: "H37",
    nomor: 37,
    judul: "Surga di Bawah Telapak Kaki Ibu",
    kategori: "Berbakti Orang Tua",
    arab: "الْجَنَّةُ تَحْتَ أَقْدَامِ الْأُمَّهَاتِ",
    latin: "Al-jannatu tahta aqdaamil ummahaat.",
    arti: "Surga itu berada di bawah telapak kaki ibu (patuh dan berbakti kepada ibu).",
    riwayat: "HR. An-Nasa'i (No. 3104), Ahmad - Hasan Shahih",
    penjelasan: "Mendengarkan nasihat ibu, mencium tangan ibu, dan mendoakannya setiap waktu."
  },
  {
    id: "H38",
    nomor: 38,
    judul: "Kelembutan Memperindah Segala Sesuatu",
    kategori: "Adab & Akhlak",
    arab: "إِنَّ الرِّفْقَ لَا يَكُونُ فِي شَيْءٍ إِلَّا زَانَهُ",
    latin: "Innar-rifqa laa yakuunu fii syai-in illaa zaanah.",
    arti: "Sesungguhnya kelemahlembutan tidaklah berada pada sesuatu melainkan ia akan memperindahnya.",
    riwayat: "HR. Muslim (No. 2594)",
    penjelasan: "Berbicara dengan suara santun, tidak kasar, dan bersikap lemah lembut dalam bergaul."
  },
  {
    id: "H39",
    nomor: 39,
    judul: "Saling Memberi Hadiah Menumbuhkan Cinta",
    kategori: "Kasih Sayang",
    arab: "تَهَادَوْا تَحَابُّوا",
    latin: "Tahaadau tahaabbuu.",
    arti: "Saling memberilah hadiah, niscaya kalian akan saling mencintai.",
    riwayat: "HR. Bukhari dalam Al-Adab Al-Mufrad (No. 594) - Hasan",
    penjelasan: "Menumbuhkan kerukunan antarsantri lewat kebiasaan berbagi bingkisan kecil atau makanan."
  },
  {
    id: "H40",
    nomor: 40,
    judul: "Menjaga Kebersihan Hati",
    kategori: "Ibadah",
    arab: "أَلَا وَإِنَّ فِي الْجَسَدِ مُضْغَةً، إِذَا صَلَحَتْ صَلَحَ الْجَسَدُ كُلُّهُ: أَلَا وَهِيَ الْقَلْبُ",
    latin: "Alaa wa inna fil jasadi mudhghatan, idzaa shalahat shalahal jasadu kulluh: Alaa wahiyal qalb.",
    arti: "Ketahuilah bahwa di dalam tubuh ada segumpal daging. Jika ia baik, maka baiklah seluruh tubuh: ketahuilah ia adalah hati.",
    riwayat: "HR. Bukhari (No. 52) & Muslim (No. 1599)",
    penjelasan: "Menjauhkan hati dari sifat dengki, dendam, dan iri terhadap kelebihan teman."
  }
];


/**
 * =======================================================================
 * FOLDER DO'A-DO'A HARIAN (KHUSUS ANAK SD - SHOHIH)
 * Teks Lengkap: Arab Berharakat, Latin Transliterasi, Terjemahan & Takhrij
 * Seragam untuk diajarkan Ustadz/ah di Madrasah dan Orang Tua di Rumah
 * =======================================================================
 */
const MASTER_DOA = [
  {
    id: "D01",
    nomor: 1,
    judul: "Do'a Sebelum Tidur",
    kategori: "Tidur & Bangun",
    arab: "بِاسْمِكَ اللّٰهُمَّ أَحْيَا وَأَمُوتُ",
    latin: "Bismika Allaahumma ahyaa wa amuutu.",
    arti: "Dengan nama-Mu ya Allah, aku hidup dan aku mati.",
    riwayat: "HR. Bukhari (No. 6324) & Muslim (No. 2711)",
    keutamaan: "Memohon perlindungan Allah selama tidur malam agar dijauhkan dari mimpi buruk."
  },
  {
    id: "D02",
    nomor: 2,
    judul: "Do'a Bangun Tidur",
    kategori: "Tidur & Bangun",
    arab: "الْحَمْدُ لِلّٰهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
    latin: "Alhamdulillaahil-ladzii ahyaanaa ba'da maa amaatanaa wa ilaihin-nusyuur.",
    arti: "Segala puji bagi Allah yang telah menghidupkan kami setelah mematikan kami, dan hanya kepada-Nya lah kami kembali.",
    riwayat: "HR. Bukhari (No. 6312) & Muslim (No. 2711)",
    keutamaan: "Bentuk syukur kepada Allah atas nikmat hidup dan kesehatan saat membuka mata di pagi hari."
  },
  {
    id: "D03",
    nomor: 3,
    judul: "Do'a Sebelum Makan",
    kategori: "Makan & Minum",
    arab: "بِسْمِ اللّٰهِ",
    latin: "Bismillaah.",
    arti: "Dengan menyebut nama Allah.",
    riwayat: "HR. Bukhari (No. 5376) & Muslim (No. 2022)",
    keutamaan: "Membentengi makanan dari keikutsertaan setan dan mendatangkan keberkahan rezeki."
  },
  {
    id: "D04",
    nomor: 4,
    judul: "Do'a Selesai Makan (Shohih)",
    kategori: "Makan & Minum",
    arab: "الْحَمْدُ لِلّٰهِ الَّذِي أَطْعَمَنِي هٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    latin: "Alhamdulillaahil-ladzii ath'amanii haadzaa wa razaqaniihi min ghairi haulin minnii wa laa quwwah.",
    arti: "Segala puji bagi Allah yang telah memberiku makanan ini dan menjadikannya rezeki bagiku tanpa daya dan kekuatan dariku.",
    riwayat: "HR. Abu Dawud (No. 4023), At-Tirmidzi (No. 3458) - Hasan Shahih",
    keutamaan: "Diampuni dosa-dosa kecil yang telah lalu bagi yang membacanya dengan penuh syukur."
  },
  {
    id: "D05",
    nomor: 5,
    judul: "Do'a Masuk Kamar Mandi (WC/Toilet)",
    kategori: "Kamar Mandi",
    arab: "اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ",
    latin: "Allaahumma innii a'uudzu bika minal khubutsi wal khabaa-its.",
    arti: "Ya Allah, sesungguhnya aku berlindung kepada-Mu dari godaan setan laki-laki dan setan perempuan.",
    riwayat: "HR. Bukhari (No. 142) & Muslim (No. 375)",
    keutamaan: "Perlindungan diri dari gangguan jin/setan di tempat-tempat kotor."
  },
  {
    id: "D06",
    nomor: 6,
    judul: "Do'a Keluar Kamar Mandi (WC/Toilet)",
    kategori: "Kamar Mandi",
    arab: "غُفْرَانَكَ",
    latin: "Ghufronaak.",
    arti: "Aku memohon ampunan-Mu, ya Allah.",
    riwayat: "HR. Abu Dawud (No. 30), At-Tirmidzi (No. 7) - Shahih",
    keutamaan: "Memohon ampunan atas kelalaian tidak berdzikir saat berada di dalam kamar mandi."
  },
  {
    id: "D07",
    nomor: 7,
    judul: "Do'a Untuk Kedua Orang Tua",
    kategori: "Orang Tua",
    arab: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    latin: "Rabbighfir lii wa liwaalidayya warhamhumaa kamaa rabbayaanii shaghiiraa.",
    arti: "Wahai Tuhanku! Ampunilah aku dan kedua orang tuaku, dan sayangilah keduanya sebagaimana mereka mendidikku di waktu kecil.",
    riwayat: "QS. Al-Isra': 24",
    keutamaan: "Bakti utama anak shalih yang pahalanya terus mengalir kepada ayah dan ibu tercinta."
  },
  {
    id: "D08",
    nomor: 8,
    judul: "Do'a Kebaikan Dunia & Akhirat (Sapu Jagad)",
    kategori: "Harian & Utama",
    arab: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    latin: "Rabbanaa aatinaa fid-dunyaa hasanah wa fil aakhirati hasanah wa qinaa 'adzaaban-naar.",
    arti: "Wahai Tuhan kami, berikanlah kepada kami kebaikan di dunia dan kebaikan di akhirat, dan lindungilah kami dari siksa api neraka.",
    riwayat: "QS. Al-Baqarah: 201 & HR. Bukhari (No. 4522)",
    keutamaan: "Doa yang paling sering dibaca oleh Rasulullah ﷺ mencakup seluruh kebaikan hidup."
  },
  {
    id: "D09",
    nomor: 9,
    judul: "Do'a Sebelum Belajar (Menambah Ilmu)",
    kategori: "Belajar & Ilmu",
    arab: "رَبِّ زِدْنِي عِلْمًا وَارْزُقْنِي فَهْمًا",
    latin: "Rabbi zidnii 'ilman warzuqnii fahmaa.",
    arti: "Wahai Tuhanku, tambahkanlah kepadaku ilmu pengetahuan dan anugerahkanlah kepadaku pemahaman yang baik.",
    riwayat: "QS. Ta-Ha: 114",
    keutamaan: "Membuka pintu kecerdasan, kemudahan menghafal Qur'an, dan mempermudah pemahaman."
  },
  {
    id: "D10",
    nomor: 10,
    judul: "Do'a Keluar Rumah",
    kategori: "Rumah & Bepergian",
    arab: "بِسْمِ اللّٰهِ تَوَكَّلْتُ عَلَى اللّٰهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ",
    latin: "Bismillaahi tawakkaltu 'alallaah, laa haula wa laa quwwata illaa billaah.",
    arti: "Dengan nama Allah, aku bertawakal kepada Allah, tidak ada daya dan kekuatan kecuali dengan pertolongan Allah.",
    riwayat: "HR. Abu Dawud (No. 5095) & At-Tirmidzi (No. 3426) - Shahih",
    keutamaan: "Malaikat akan menjaganya, setan menyingkir, dan diberikan petunjuk serta perlindungan selama di jalan."
  },
  {
    id: "D11",
    nomor: 11,
    judul: "Do'a Masuk Rumah",
    kategori: "Rumah & Bepergian",
    arab: "بِسْمِ اللّٰهِ وَلَجْنَا، وَبِسْمِ اللّٰهِ خَرَجْنَا، وَعَلَى اللّٰهِ رَبِّنَا تَوَكَّلْنَا",
    latin: "Bismillaahi walajnaa, wa bismillaahi kharajnaa, wa 'alallaahi rabbinaa tawakkalnaa.",
    arti: "Dengan nama Allah kami masuk, dan dengan nama Allah kami keluar, dan kepada Allah Tuhan kami, kami bertawakal.",
    riwayat: "HR. Abu Dawud (No. 5096)",
    keutamaan: "Menghindarkan rumah dari singgahan setan dan membawa ketenteraman keluarga."
  },
  {
    id: "D12",
    nomor: 12,
    judul: "Do'a Masuk Masjid",
    kategori: "Masjid & Shalat",
    arab: "اللّٰهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    latin: "Allaahummaftah lii abwaaba rahmatik.",
    arti: "Ya Allah, bukakanlah untukku pintu-pintu rahmat-Mu.",
    riwayat: "HR. Muslim (No. 713)",
    keutamaan: "Memohon limpahan rahmat Allah saat melangkahkan kaki kanan ke rumah Allah."
  },
  {
    id: "D13",
    nomor: 13,
    judul: "Do'a Keluar Masjid",
    kategori: "Masjid & Shalat",
    arab: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    latin: "Allaahumma innii as-aluka min fadhlik.",
    arti: "Ya Allah, sesungguhnya aku memohon sebagian dari karunia-Mu.",
    riwayat: "HR. Muslim (No. 713)",
    keutamaan: "Memohon rezeki berkah dan karunia saat melangkahkan kaki kiri keluar masjid."
  },
  {
    id: "D14",
    nomor: 14,
    judul: "Do'a Memakai Pakaian",
    kategori: "Harian",
    arab: "الْحَمْدُ لِلّٰهِ الَّذِي كَسَانِي هٰذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
    latin: "Alhamdulillaahil-ladzii kasaanii haadzaa wa razaqaniihi min ghairi haulin minnii wa laa quwwah.",
    arti: "Segala puji bagi Allah yang telah memakaikanku pakaian ini dan mengaruniakannya kepadaku tanpa daya dan kekuatan dariku.",
    riwayat: "HR. Abu Dawud (No. 4023) - Hasan",
    keutamaan: "Diampuni dosa yang telah lalu dan menjaga adab menutup aurat dengan sopan."
  },
  {
    id: "D15",
    nomor: 15,
    judul: "Do'a Naik Kendaraan",
    kategori: "Rumah & Bepergian",
    arab: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنْقَلِبُونَ",
    latin: "Subhaanal-ladzii sakh-khara lanaa haadzaa wa maa kunnaa lahu muqriniin, wa innaa ilaa rabbinaa lamunqalibuun.",
    arti: "Maha Suci Allah yang telah menundukkan kendaraan ini bagi kami, padahal sebelumnya kami tidak mampu menguasainya. Dan sesungguhnya hanya kepada Tuhan kami, kami akan kembali.",
    riwayat: "QS. Az-Zukhruf: 13-14 & HR. Muslim (No. 1342)",
    keutamaan: "Diberi keselamatan dan keberkahan sepanjang perjalanan darat, laut, atau udara."
  },
  {
    id: "D16",
    nomor: 16,
    judul: "Do'a Ketika Bercermin",
    kategori: "Harian",
    arab: "اللّٰهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي",
    latin: "Allaahumma kamaa hassanta khalqii fa hassin khuluqii.",
    arti: "Ya Allah, sebagaimana Engkau telah memperindah fisik penciptaanku, maka perindahlah pula akhlak pekertiku.",
    riwayat: "HR. Ahmad (No. 24392) & Ibnu Hibban - Shahih",
    keutamaan: "Menjaga hati dari rasa ujub (sombong) dan mendambakan keindahan budi pekerti."
  },
  {
    id: "D17",
    nomor: 17,
    judul: "Do'a Ketika Turun Hujan",
    kategori: "Harian",
    arab: "اللّٰهُمَّ صَيِّبًا نَافِعًا",
    latin: "Allaahumma shayyiban naafi'aa.",
    arti: "Ya Allah, jadikanlah hujan ini hujan yang lebat dan membawa manfaat.",
    riwayat: "HR. Bukhari (No. 1032)",
    keutamaan: "Waktu turun hujan adalah salah satu saat mustajab untuk berdoa."
  },
  {
    id: "D18",
    nomor: 18,
    judul: "Do'a Penutup Majlis (Kafaratul Majlis)",
    kategori: "Belajar & Ilmu",
    arab: "سُبْحَانَكَ اللّٰهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ",
    latin: "Subhaanakallaahumma wa bihamdika, asyhadu allaa ilaaha illaa anta, astaghfiruka wa atuubu ilaik.",
    arti: "Maha Suci Engkau ya Allah dan dengan memuji-Mu, aku bersaksi bahwa tiada sesembahan yang berhak disembah selain Engkau, aku memohon ampun dan bertaubat kepada-Mu.",
    riwayat: "HR. At-Tirmidzi (No. 3433) & Abu Dawud (No. 4859) - Shahih",
    keutamaan: "Menghapus segala kekhilafan atau perkataan sia-sia yang terjadi selama majelis/halaqah."
  },
  {
    id: "D19",
    nomor: 19,
    judul: "Do'a Ketika Mendengar Petir",
    kategori: "Harian",
    arab: "سُبْحَانَ الَّذِي يُسَبِّحُ الرَّعْدُ بِحَمْدِهِ وَالْمَلَائِكَةُ مِنْ خِيفَتِهِ",
    latin: "Subhaanal-ladzii yusabbihur-ra'du bihamdihii wal malaaikatu min khiifatih.",
    arti: "Maha Suci Allah yang petir dan para malaikat bertasbih dengan memuji-Nya karena rasa takut kepada-Nya.",
    riwayat: "HR. Malik dalam Al-Muwaththa' (No. 1801) - Shahih",
    keutamaan: "Mengingat keagungan dan kekuasaan Allah saat mendengar suara petir/guntur yang menggelegar."
  },
  {
    id: "D20",
    nomor: 20,
    judul: "Do'a Senandung Rahmat Al-Qur'an",
    kategori: "Al-Qur'an",
    arab: "اللّٰهُمَّ ارْحَمْنَا بِالْقُرْآنِ، وَاجْعَلْهُ لَنَا إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً",
    latin: "Allaahummarhamnaa bil Qur'aan, waj'al-hu lanaa imaaman wa nuuran wa hudan wa rahmah.",
    arti: "Ya Allah, rahmatilah kami dengan Al-Qur'an, dan jadikanlah ia bagi kami sebagai panutan, cahaya petunjuk, dan rahmat.",
    riwayat: "Doa Masyhur Penutup Tilawah & Hafalan Al-Qur'an",
    keutamaan: "Senandung syahdu yang sering dilantunkan santri setelah menyetor hafalan Al-Qur'an."
  },
  {
    id: "D21",
    nomor: 21,
    judul: "Do'a Sebelum Berwudhu",
    kategori: "Wudhu & Shalat",
    arab: "بِسْمِ اللّٰهِ",
    latin: "Bismillaah.",
    arti: "Dengan menyebut nama Allah.",
    riwayat: "HR. Abu Dawud (No. 101) & Ibnu Majah - Shahih",
    keutamaan: "Menyempurnakan keutamaan wudhu sebelum membasuh kedua telapak tangan."
  },
  {
    id: "D22",
    nomor: 22,
    judul: "Do'a Setelah Selesai Berwudhu",
    kategori: "Wudhu & Shalat",
    arab: "أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ. اللّٰهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ",
    latin: "Asyhadu allaa ilaaha illallaahu wahdahu laa syariika lah, wa asyhadu anna Muhammadan 'abduhu wa rasuuluh. Allaahummaj'alnii minat-tawwaabiina waj'alnii minal mutathahhiriin.",
    arti: "Aku bersaksi tiada sesembahan yang berhak disembah selain Allah semata, tiada sekutu bagi-Nya, dan aku bersaksi bahwa Muhammad hamba dan utusan-Nya. Ya Allah jadikanlah aku termasuk orang yang bertaubat dan orang yang menyucikan diri.",
    riwayat: "HR. Muslim (No. 234) & At-Tirmidzi (No. 55) - Shahih",
    keutamaan: "Dibukakan delapan pintu surga dan boleh masuk dari pintu mana saja yang disukai."
  },
  {
    id: "D23",
    nomor: 23,
    judul: "Do'a Ketika Lupa Membaca Bismillah Saat Makan",
    kategori: "Makan & Minum",
    arab: "بِسْمِ اللّٰهِ فِي أَوَّلِهِ وَآخِرِهِ",
    latin: "Bismillaahi fii awwalihii wa aakhirihi.",
    arti: "Dengan nama Allah pada awal dan akhirnya.",
    riwayat: "HR. Abu Dawud (No. 3767) & At-Tirmidzi (No. 1858) - Shahih",
    keutamaan: "Memutus keikutsertaan setan yang telah ikut menyantap makanan saat kita lupa membaca basmalah di awal."
  },
  {
    id: "D24",
    nomor: 24,
    judul: "Do'a Menjawab Orang yang Bersin",
    kategori: "Harian",
    arab: "يَرْحَمُكَ اللّٰهُ (Dijawab: يَهْدِيكُمُ اللّٰهُ وَيُصْلِحُ بَالَكُمْ)",
    latin: "Yarhamukallaah (Dijawab kembali: Yahdiikumullaahu wa yushlihu baalakum).",
    arti: "Semoga Allah merahmatimu. (Dijawab: Semoga Allah memberimu petunjuk dan memperbaiki keadaanmu).",
    riwayat: "HR. Bukhari (No. 6224)",
    keutamaan: "Menjalin persaudaraan dan saling mendoakan keselamatan serta petunjuk antar sesama muslim."
  },
  {
    id: "D25",
    nomor: 25,
    judul: "Do'a Melepas Pakaian",
    kategori: "Harian",
    arab: "بِسْمِ اللّٰهِ",
    latin: "Bismillaah.",
    arti: "Dengan menyebut nama Allah.",
    riwayat: "HR. At-Tirmidzi (No. 606) - Shahih",
    keutamaan: "Menjadi penghalang (tabir) antara pandangan jin dengan aurat bani Adam."
  },
  {
    id: "D26",
    nomor: 26,
    judul: "Do'a Setelah Adzan Selesai Berkumandang",
    kategori: "Masjid & Shalat",
    arab: "اللّٰهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ",
    latin: "Allaahumma rabba haadzihid-da'watit-taammah, wash-shalaatil qaa-imah, aati Muhammadanil wasiilata wal fadhiilah, wab'atshu maqaamam mahmuudanil-ladzii wa'adtah.",
    arti: "Ya Allah, Pemilik seruan yang sempurna ini dan shalat yang akan didirikan, berikanlah kepada Nabi Muhammad wasilah dan keutamaan, serta bangkitkanlah beliau pada kedudukan terpuji yang telah Engkau janjikan.",
    riwayat: "HR. Bukhari (No. 614)",
    keutamaan: "Mendapatkan syafa'at Rasulullah ﷺ pada hari kiamat kelak."
  },
  {
    id: "D27",
    nomor: 27,
    judul: "Do'a Menghilangkan Rasa Marah (Ta'awwudz)",
    kategori: "Harian & Utama",
    arab: "أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
    latin: "A'uudzu billaahi minasy-syaithaanir-rajiim.",
    arti: "Aku berlindung kepada Allah dari godaan setan yang terkutuk.",
    riwayat: "HR. Bukhari (No. 3282) & Muslim (No. 2610)",
    keutamaan: "Meredam api amarah dan bisikan setan yang ingin memicu permusuhan."
  },
  {
    id: "D28",
    nomor: 28,
    judul: "Do'a Setelah Hujan Reda",
    kategori: "Harian",
    arab: "مُطِرْنَا بِفَضْلِ اللّٰهِ وَرَحْمَتِهِ",
    latin: "Muthirnaa bifadhlillaahi wa rahmatih.",
    arti: "Kita diberi hujan karena karunia dan rahmat Allah.",
    riwayat: "HR. Bukhari (No. 846) & Muslim (No. 71)",
    keutamaan: "Menegaskan tauhid bahwa turunnya hujan adalah semata-mata anugerah Allah, bukan karena bintang atau musim."
  },
  {
    id: "D29",
    nomor: 29,
    judul: "Do'a Menjenguk Orang Sakit",
    kategori: "Harian & Utama",
    arab: "لَا بَأْسَ طَهُورٌ إِنْ شَاءَ اللّٰهُ",
    latin: "Laa ba'sa thahuurun in syaa-allaah.",
    arti: "Tidak mengapa, semoga sakitmu ini menjadi pembersih dari dosa-dosa, insya Allah.",
    riwayat: "HR. Bukhari (No. 3616)",
    keutamaan: "Memberikan ketenangan, penghiburan, dan optimisme kesembuhan bagi teman yang sedang terbaring sakit."
  },
  {
    id: "D30",
    nomor: 30,
    judul: "Do'a Melihat Sesuatu yang Menyenangkan",
    kategori: "Harian",
    arab: "الْحَمْدُ لِلّٰهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ",
    latin: "Alhamdulillaahil-ladzii bini'matihii tatimmush-shaalihaat.",
    arti: "Segala puji bagi Allah yang dengan nikmat-Nya sempurnalah segala amal kebaikan.",
    riwayat: "HR. Ibnu Majah (No. 3803) - Shahih",
    keutamaan: "Membiasakan memuji Allah saat melihat prestasi, pemandangan indah, atau keberhasilan teman."
  },
  {
    id: "D31",
    nomor: 31,
    judul: "Do'a Menghadapi Kejadian yang Kurang Menyenangkan",
    kategori: "Harian",
    arab: "الْحَمْدُ لِلّٰهِ عَلَى كُلِّ حَالٍ",
    latin: "Alhamdulillaahi 'alaa kulli haal.",
    arti: "Segala puji bagi Allah atas segala keadaan (baik suka maupun duka).",
    riwayat: "HR. Ibnu Majah (No. 3803) - Shahih",
    keutamaan: "Melatih anak agar senantiasa bersabar, berprasangka baik pada takdir Allah, dan tidak mengeluh."
  },
  {
    id: "D32",
    nomor: 32,
    judul: "Do'a Meminta Surga & Berlindung dari Neraka",
    kategori: "Harian & Utama",
    arab: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ، وَأَعُوذُ بِكَ مِنَ النَّارِ",
    latin: "Allaahumma innii as-alukal jannah, wa a'uudzu bika minan-naar.",
    arti: "Ya Allah, sesungguhnya aku memohon surga kepada-Mu dan berlindung kepada-Mu dari siksa api neraka.",
    riwayat: "HR. Abu Dawud (No. 792), Ibnu Majah - Shahih",
    keutamaan: "Jika dibaca 3 kali, surga dan neraka akan berdoa memohonkan agar pembacanya dimasukkan surga dan dijauhkan dari neraka."
  },
  {
    id: "D33",
    nomor: 33,
    judul: "Do'a Berlindung dari Rasa Malas & Gelisah",
    kategori: "Belajar & Ilmu",
    arab: "اللّٰهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ",
    latin: "Allaahumma innii a'uudzu bika minal hammi wal hazan, wal 'ajzi wal kasal.",
    arti: "Ya Allah, aku berlindung kepada-Mu dari rasa gundah dan sedih, serta dari kelemahan dan rasa malas.",
    riwayat: "HR. Bukhari (No. 2893)",
    keutamaan: "Membakar semangat juang santri agar rajin mengulang hafalan dan dijauhkan dari penyakit malas belajar."
  },
  {
    id: "D34",
    nomor: 34,
    judul: "Do'a di Waktu Pagi Hari",
    kategori: "Tidur & Bangun",
    arab: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ",
    latin: "Ashbahnaa wa ashbahal mulku lillaah, walhamdulillaah.",
    arti: "Kami telah memasuki waktu pagi dan kerajaan hanya milik Allah, dan segala puji hanya bagi Allah.",
    riwayat: "HR. Muslim (No. 2723)",
    keutamaan: "Memulai hari dengan dzikir tauhid agar senantiasa berada dalam naungan berkah Allah."
  },
  {
    id: "D35",
    nomor: 35,
    judul: "Do'a di Waktu Sore Hari",
    kategori: "Tidur & Bangun",
    arab: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلّٰهِ، وَالْحَمْدُ لِلّٰهِ",
    latin: "Amsainaa wa amsal mulku lillaah, walhamdulillaah.",
    arti: "Kami telah memasuki waktu sore dan kerajaan hanya milik Allah, dan segala puji hanya bagi Allah.",
    riwayat: "HR. Muslim (No. 2723)",
    keutamaan: "Menutup aktivitas siang hari dengan pengakuan keagungan Allah menuju istirahat malam."
  },
  {
    id: "D36",
    nomor: 36,
    judul: "Do'a Masuk Tempat Ramai / Pasar",
    kategori: "Rumah & Bepergian",
    arab: "لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    latin: "Laa ilaaha illallaahu wahdahu laa syariika lah, lahul mulku wa lahul hamdu, yuhyii wa yumiitu, wa huwa 'alaa kulli syai-in qadiir.",
    arti: "Tiada sesembahan selain Allah semata, tiada sekutu bagi-Nya, milik-Nya segala kerajaan dan pujian, Dia menghidupkan dan mematikan, dan Dia Maha Kuasa atas segala sesuatu.",
    riwayat: "HR. At-Tirmidzi (No. 3428) - Hasan",
    keutamaan: "Dicatat sejuta kebaikan dan dihapus sejuta keburukan serta diangkat sejuta derajat."
  },
  {
    id: "D37",
    nomor: 37,
    judul: "Do'a Memohon Diberikan Akhlak Mulia",
    kategori: "Harian & Utama",
    arab: "اللّٰهُمَّ اهْدِنِي لِأَحْسَنِ الْأَخْلَاقِ، لَا يَهْدِي لِأَحْسَنِهَا إِلَّا أَنْتَ",
    latin: "Allaahummah-dinii li-ahsanil akhlaaq, laa yahdii li-ahsanihaa illaa anta.",
    arti: "Ya Allah, tunjukilah aku kepada akhlak yang paling mulia, tiada yang dapat menunjukinya melainkan Engkau.",
    riwayat: "HR. Muslim (No. 771)",
    keutamaan: "Membentuk karakter santri yang berakhlak mulia, berbakti kepada guru dan orang tua."
  },
  {
    id: "D38",
    nomor: 38,
    judul: "Do'a Ketika Angin Kencang Bertiup",
    kategori: "Harian",
    arab: "اللّٰهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّهَا",
    latin: "Allaahumma innii as-aluka khairahaa, wa a'uudzu bika min syarrihaa.",
    arti: "Ya Allah, sesungguhnya aku memohon kepada-Mu kebaikan angin ini, dan aku berlindung kepada-Mu dari keburukannya.",
    riwayat: "HR. Abu Dawud (No. 5099) & Ibnu Majah - Shahih",
    keutamaan: "Menghilangkan rasa takut saat cuaca buruk dan memohon keselamatan dari bencana angin kencang."
  },
  {
    id: "D39",
    nomor: 39,
    judul: "Do'a Memohon Kemudahan Menghafal & Belajar",
    kategori: "Belajar & Ilmu",
    arab: "اللّٰهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا",
    latin: "Allaahumma laa sahla illaa maa ja'altahuu sahlaa, wa anta taj'alul hazna idzaa syi'ta sahlaa.",
    arti: "Ya Allah, tidak ada kemudahan kecuali apa yang Engkau jadikan mudah, dan Engkau menjadikan kesulitan jika Engkau kehendaki menjadi mudah.",
    riwayat: "HR. Ibnu Hibban (No. 327) - Shahih",
    keutamaan: "Sangat dianjurkan dibaca saat santri menghadapi ayat hafalan yang sulit atau saat hendak ujian tahfidz."
  },
  {
    id: "D40",
    nomor: 40,
    judul: "Do'a Perlindungan dari Godaan Setan",
    kategori: "Harian & Utama",
    arab: "رَبِّ أَعُوذُ بِكَ مِنْ هَمَزَاتِ الشَّيَاطِينِ، وَأَعُوذُ بِكَ رَبِّ أَنْ يَحْضُرُونِ",
    latin: "Rabbi a'uudzu bika min hamazaatisy-syayaathiin, wa a'uudzu bika rabbi ay-yahdhuruun.",
    arti: "Wahai Tuhanku, aku berlindung kepada-Mu dari bisikan-bisikan setan, dan aku berlindung kepada-Mu wahai Tuhanku agar mereka tidak mendekatiku.",
    riwayat: "QS. Al-Mu'minun: 97-98",
    keutamaan: "Benteng utama penjagaan diri anak sepanjang hari dari godaan dan bisikan jahat setan."
  }
];


