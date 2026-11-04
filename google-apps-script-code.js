/**
 * =======================================================================
 * GOOGLE APPS SCRIPT - RQ UMMUL QASIM (TAMHID, TARTIL & HAFALAN) - FINAL v5.2
 * =======================================================================
 * Fitur:
 * - Read (Membaca seluruh setoran dengan cerdas & otomatis menyesuaikan header)
 * - Save (Menyimpan setoran baru secara instan)
 * - Edit / Update (Memperbarui data setoran santri yang keliru)
 * - Delete (Menghapus catatan setoran keliru secara permanen)
 * - Dukungan CORS & Fallback GET/POST
 * =======================================================================
 */

const SHEET_NAME_SETORAN = "Data_Setoran";

const MASTER_HEADERS = [
  "ID Setoran",          // 0
  "Waktu Pencatatan",    // 1
  "Tanggal Setoran",     // 2
  "ID Santri",           // 3
  "Nama Santri",         // 4
  "Kelas / Halaqah",     // 5
  "Kategori",            // 6
  "Ustadz Pengampu",     // 7
  "Jenis Tilawah",       // 8
  "Tamhid Jilid",        // 9
  "Tamhid Halaman",      // 10
  "Tartil Juz",          // 11
  "Tartil Halaman",      // 12
  "Status Tilawah",      // 13
  "Catatan Tilawah",     // 14
  "Jenis Hafalan",       // 15
  "Surah Awal",          // 16
  "Ayat Awal",           // 17
  "Surah Akhir",         // 18
  "Ayat Akhir",          // 19
  "Bintang Tajwid",      // 20
  "Bintang Kelancaran",  // 21
  "Bintang Makhraj",     // 22
  "Total Bintang",       // 23
  "Status Hafalan",      // 24
  "Catatan Evaluasi",    // 25
  "Ziyadah Surah",       // 26
  "Ziyadah Ayat Awal",   // 27
  "Ziyadah Ayat Akhir",  // 28
  "Murojaah Surah",      // 29
  "Murojaah Ayat Awal",  // 30
  "Murojaah Ayat Akhir"  // 31
];

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, SHEET_NAME_SETORAN);
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "read";

    if (action === "test") {
      return createJsonResponse({ status: "success", message: "Koneksi Google Spreadsheet RQ Ummul Qasim Berhasil!" });
    }

    if (action === "delete") {
      const deleteId = e.parameter.id;
      const nama = e.parameter.namaSantri;
      const tgl = e.parameter.tanggal;
      return handleDelete(sheet, deleteId, nama, tgl);
    }

    if (action === "edit" || action === "update") {
      let payload = {};
      if (e.parameter.data) {
        try { payload = JSON.parse(e.parameter.data); } catch (err) { payload = e.parameter; }
      } else {
        payload = e.parameter;
      }
      return handleEdit(sheet, payload);
    }

    if (action === "save") {
      let payload = {};
      if (e.parameter.data) {
        try { payload = JSON.parse(e.parameter.data); } catch (err) { payload = e.parameter; }
      } else {
        payload = e.parameter;
      }
      return handleSave(sheet, payload);
    }

    if (action === "read") {
      return handleRead(sheet);
    }

    return createJsonResponse({ status: "success", message: "RQ Ummul Qasim API v5.2 Siap Digunakan." });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, SHEET_NAME_SETORAN);
    
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || "save";

    if (action === "delete") {
      return handleDelete(sheet, payload.id, payload.namaSantri, payload.tanggal);
    }

    if (action === "edit" || action === "update") {
      return handleEdit(sheet, payload);
    }

    return handleSave(sheet, payload);
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

// -------------------------------------------------------------
// LOGIKA PEMROSESAN (READ, SAVE, EDIT, DELETE)
// -------------------------------------------------------------

function handleRead(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return createJsonResponse({ status: "success", total: 0, data: [] });
  }

  const headerRow = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });

  function col(names, fallbackIdx) {
    for (var i = 0; i < names.length; i++) {
      var idx = headerRow.indexOf(names[i].toLowerCase());
      if (idx !== -1) return idx;
    }
    return fallbackIdx;
  }

  const idIdx = col(["ID Setoran", "ID", "id_setoran"], 0);
  const tsIdx = col(["Waktu Pencatatan", "Timestamp", "Waktu"], 1);
  const tglIdx = col(["Tanggal Setoran", "Tanggal", "Tgl"], 2);
  const santriIdIdx = col(["ID Santri", "Santri ID", "SantriId"], 3);
  const namaIdx = col(["Nama Santri", "Nama", "Santri"], 4);
  const halaqahIdx = col(["Kelas / Halaqah", "Kelas", "Halaqah"], 5);
  const katIdx = col(["Kategori"], 6);
  const ustadzIdx = col(["Ustadz Pengampu", "Ustadz", "Pengampu"], 7);
  const bacaanTipeIdx = col(["Jenis Tilawah", "Tipe Tilawah", "Bacaan Tipe"], 8);
  const tamhidJilidIdx = col(["Tamhid Jilid"], 9);
  const tamhidHlmIdx = col(["Tamhid Halaman"], 10);
  const tartilJuzIdx = col(["Tartil Juz"], 11);
  const tartilHlmIdx = col(["Tartil Halaman"], 12);
  const bacaanStatusIdx = col(["Status Tilawah"], 13);
  const bacaanCatatanIdx = col(["Catatan Tilawah"], 14);
  const hafalanJenisIdx = col(["Jenis Hafalan"], 15);
  const surahAwalIdx = col(["Surah Awal"], 16);
  const ayatAwalIdx = col(["Ayat Awal"], 17);
  const surahAkhirIdx = col(["Surah Akhir"], 18);
  const ayatAkhirIdx = col(["Ayat Akhir"], 19);
  const starTajwidIdx = col(["Bintang Tajwid"], 20);
  const starKelancaranIdx = col(["Bintang Kelancaran"], 21);
  const starMakhrajIdx = col(["Bintang Makhraj"], 22);
  const starTotalIdx = col(["Total Bintang"], 23);
  const hafalanStatusIdx = col(["Status Hafalan"], 24);
  const hafalanCatatanIdx = col(["Catatan Evaluasi", "Catatan Hafalan"], 25);
  const ziyadahSurahIdx = col(["Ziyadah Surah"], 26);
  const ziyadahAyatAwalIdx = col(["Ziyadah Ayat Awal"], 27);
  const ziyadahAyatAkhirIdx = col(["Ziyadah Ayat Akhir"], 28);
  const murojaahSurahIdx = col(["Murojaah Surah"], 29);
  const murojaahAyatAwalIdx = col(["Murojaah Ayat Awal"], 30);
  const murojaahAyatAkhirIdx = col(["Murojaah Ayat Akhir"], 31);

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const d = data[i];
    if (!d[idIdx] && !d[namaIdx] && !d[santriIdIdx]) continue;

    let tglStr = d[tglIdx];
    if (tglStr instanceof Date) {
      tglStr = Utilities.formatDate(tglStr, "GMT+7", "yyyy-MM-dd");
    } else if (tglStr) {
      tglStr = String(tglStr).split("T")[0].trim();
      const dmyMatch = tglStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (dmyMatch) {
        const day = dmyMatch[1].padStart(2, "0");
        const month = dmyMatch[2].padStart(2, "0");
        const year = dmyMatch[3];
        tglStr = `${year}-${month}-${day}`;
      }
    }

    if (!tglStr || tglStr === "" || tglStr === "-") {
      if (d[tsIdx]) {
        if (d[tsIdx] instanceof Date) {
          tglStr = Utilities.formatDate(d[tsIdx], "GMT+7", "yyyy-MM-dd");
        } else {
          tglStr = String(d[tsIdx]).split("T")[0].trim();
        }
      }
      if (!tglStr && d[idIdx]) {
        const matchId = String(d[idIdx]).match(/REC-(\d+)/);
        if (matchId) {
          const dFromId = new Date(Number(matchId[1]));
          if (!isNaN(dFromId.getTime())) {
            tglStr = Utilities.formatDate(dFromId, "GMT+7", "yyyy-MM-dd");
          }
        }
      }
    }

    const recId = String(d[idIdx] || "").replace(/^'+/, "").trim() || ("REC-" + i);
    const surAwal = String(d[surahAwalIdx] || "-");
    const ayAwal = Number(d[ayatAwalIdx] || 1);
    const surAkhir = String(d[surahAkhirIdx] || surAwal);
    const ayAkhir = Number(d[ayatAkhirIdx] || 1);

    const ziySurah = (ziyadahSurahIdx < d.length && d[ziyadahSurahIdx] && d[ziyadahSurahIdx] !== "-")
      ? String(d[ziyadahSurahIdx])
      : (surAwal !== "-" ? surAwal : "");
    const ziyAyAwal = (ziyadahAyatAwalIdx < d.length && d[ziyadahAyatAwalIdx]) ? Number(d[ziyadahAyatAwalIdx]) : ayAwal;
    const ziyAyAkhir = (ziyadahAyatAkhirIdx < d.length && d[ziyadahAyatAkhirIdx]) ? Number(d[ziyadahAyatAkhirIdx]) : ayAkhir;

    const murSurah = (murojaahSurahIdx < d.length && d[murojaahSurahIdx] && d[murojaahSurahIdx] !== "-") ? String(d[murojaahSurahIdx]) : "";
    const murAyAwal = (murojaahAyatAwalIdx < d.length && d[murojaahAyatAwalIdx]) ? Number(d[murojaahAyatAwalIdx]) : 0;
    const murAyAkhir = (murojaahAyatAkhirIdx < d.length && d[murojaahAyatAkhirIdx]) ? Number(d[murojaahAyatAkhirIdx]) : 0;

    rows.push({
      id: recId,
      timestamp: d[tsIdx] || "",
      tanggal: tglStr || "",
      santriId: String(d[santriIdIdx] || ""),
      namaSantri: String(d[namaIdx] || ""),
      halaqah: String(d[halaqahIdx] || ""),
      kategori: String(d[katIdx] || ""),
      ustadz: String(d[ustadzIdx] || ""),
      // Tilawah
      bacaanTipe: String(d[bacaanTipeIdx] || "Tamhid"),
      tamhidJilid: String(d[tamhidJilidIdx] || "-"),
      tamhidHalaman: String(d[tamhidHlmIdx] || "-"),
      tartilJuz: String(d[tartilJuzIdx] || "-"),
      tartilHalaman: String(d[tartilHlmIdx] || "-"),
      bacaanStatus: String(d[bacaanStatusIdx] || "Lanjut"),
      bacaanCatatan: String(d[bacaanCatatanIdx] || "-"),
      // Hafalan
      hafalanJenis: String(d[hafalanJenisIdx] || "Ziyadah"),
      surahAwal: surAwal,
      ayatAwal: ayAwal,
      surahAkhir: surAkhir,
      ayatAkhir: ayAkhir,
      bintangTajwid: Number(d[starTajwidIdx] || 0),
      bintangKelancaran: Number(d[starKelancaranIdx] || 0),
      bintangMakhraj: Number(d[starMakhrajIdx] || 0),
      totalBintang: Number(d[starTotalIdx] || 0),
      hafalanStatus: String(d[hafalanStatusIdx] || "Lulus"),
      hafalanCatatan: String(d[hafalanCatatanIdx] || "-"),
      // Ziyadah & Murojaah Terpisah
      ziyadahSurah: ziySurah,
      ziyadahAyatAwal: ziyAyAwal,
      ziyadahSurahAkhir: ziySurah,
      ziyadahAyatAkhir: ziyAyAkhir,
      murojaahSurah: murSurah,
      murojaahAyatAwal: murAyAwal,
      murojaahSurahAkhir: murSurah,
      murojaahAyatAkhir: murAyAkhir
    });
  }

  // Urutkan data terbaru di paling atas
  rows.reverse();

  return createJsonResponse({
    status: "success",
    total: rows.length,
    data: rows
  });
}

function handleSave(sheet, payload) {
  const timestamp = new Date();
  const rowArray = buildRowArray(payload, null, timestamp);
  sheet.appendRow(rowArray);

  return createJsonResponse({
    status: "success",
    message: "Data setoran berhasil dicatat ke Google Sheets secara realtime!",
    data: payload
  });
}

function handleEdit(sheet, payload) {
  const rowIdx = findRowIndex(sheet, payload.id, payload.namaSantri, payload.tanggal, payload.timestamp);
  if (rowIdx === -1) {
    // Jika tidak ditemukan untuk diedit, simpan sebagai baris baru
    return handleSave(sheet, payload);
  }

  const existingValues = sheet.getRange(rowIdx, 1, 1, Math.max(sheet.getLastColumn(), MASTER_HEADERS.length)).getValues()[0];
  const rowArray = buildRowArray(payload, existingValues, new Date());
  sheet.getRange(rowIdx, 1, 1, rowArray.length).setValues([rowArray]);

  return createJsonResponse({
    status: "success",
    message: "Data setoran berhasil diperbarui di Google Sheets secara realtime!",
    data: payload
  });
}

function handleDelete(sheet, deleteId, namaSantri, tanggal) {
  const rowIdx = findRowIndex(sheet, deleteId, namaSantri, tanggal, null);
  if (rowIdx !== -1) {
    sheet.deleteRow(rowIdx);
    return createJsonResponse({
      status: "success",
      message: "Setoran berhasil dihapus permanen dari Google Spreadsheet!",
      deletedId: deleteId
    });
  }
  return createJsonResponse({
    status: "not_found",
    message: "ID setoran tidak ditemukan di Spreadsheet (mungkin sudah terhapus sebelumnya)."
  });
}

function findRowIndex(sheet, id, namaSantri, tanggal, timestamp) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return -1;

  const headerRow = data[0].map(function(h) { return String(h || "").trim().toLowerCase(); });
  function col(names, fallback) {
    for (var i = 0; i < names.length; i++) {
      var idx = headerRow.indexOf(names[i].toLowerCase());
      if (idx !== -1) return idx;
    }
    return fallback;
  }

  const idCol = col(["id setoran", "id", "id_setoran"], 0);
  const namaCol = col(["nama santri", "nama", "santri"], 4);
  const tglCol = col(["tanggal setoran", "tanggal", "tgl"], 2);

  const cleanId = id ? String(id).replace(/^'+/, "").trim() : "";

  // 1. Pencarian utama berdasarkan ID pada kolom ID
  if (cleanId) {
    for (var i = 1; i < data.length; i++) {
      var val = String(data[i][idCol] || "").replace(/^'+/, "").trim();
      if (val && (val === cleanId || val.toLowerCase() === cleanId.toLowerCase())) {
        return i + 1; // 1-based index sheet
      }
    }
    // 2. Pencarian fleksibel: periksa seluruh kolom baris
    for (var i = 1; i < data.length; i++) {
      for (var j = 0; j < data[i].length; j++) {
        var cVal = String(data[i][j] || "").replace(/^'+/, "").trim();
        if (cVal && cVal === cleanId) {
          return i + 1;
        }
      }
    }
  }

  // 3. Fallback: pencarian berdasarkan Nama Santri & Tanggal
  if (namaSantri && tanggal) {
    var targetNama = String(namaSantri).trim().toLowerCase();
    var targetTgl = String(tanggal).split("T")[0].trim();
    for (var i = 1; i < data.length; i++) {
      var rowNama = String(data[i][namaCol] || "").trim().toLowerCase();
      var rowTgl = "";
      if (data[i][tglCol] instanceof Date) {
        rowTgl = Utilities.formatDate(data[i][tglCol], "GMT+7", "yyyy-MM-dd");
      } else {
        rowTgl = String(data[i][tglCol] || "").split("T")[0].trim();
      }
      if (rowNama === targetNama && rowTgl === targetTgl) {
        return i + 1;
      }
    }
  }

  return -1;
}

function buildRowArray(payload, existingRow, defaultDate) {
  const timestamp = defaultDate || new Date();
  let tgl = payload.tanggal ? String(payload.tanggal).trim() : "";
  if (!tgl || tgl === "-") {
    tgl = Utilities.formatDate(timestamp, "GMT+7", "yyyy-MM-dd");
  }

  function sanitize(val) {
    if (val === null || val === undefined) return "-";
    var str = String(val).trim();
    if (/^[=+\-@\t\r]/.test(str)) {
      return "'" + str;
    }
    return str;
  }

  const idVal = payload.id || (existingRow && existingRow[0] ? existingRow[0] : ("REC-" + Date.now()));
  const tsVal = existingRow && existingRow[1] ? existingRow[1] : Utilities.formatDate(timestamp, "GMT+7", "yyyy-MM-dd HH:mm:ss");

  const surAwal = sanitize(payload.ziyadahSurah || payload.surahAwal);
  const ayAwal = Number(payload.ziyadahAyatAwal || payload.ayatAwal || 1);
  const surAkhir = sanitize(payload.ziyadahSurahAkhir || payload.surahAkhir || surAwal);
  const ayAkhir = Number(payload.ziyadahAyatAkhir || payload.ayatAkhir || 1);

  return [
    idVal,
    tsVal,
    tgl,
    sanitize(payload.santriId),
    sanitize(payload.namaSantri),
    sanitize(payload.halaqah),
    sanitize(payload.kategori),
    sanitize(payload.ustadz),
    // Tilawah
    sanitize(payload.bacaanTipe || "Tamhid"),
    sanitize(payload.tamhidJilid),
    sanitize(payload.tamhidHalaman),
    sanitize(payload.tartilJuz),
    sanitize(payload.tartilHalaman),
    sanitize(payload.bacaanStatus || "Lanjut"),
    sanitize(payload.bacaanCatatan),
    // Hafalan
    sanitize(payload.hafalanJenis || "Ziyadah"),
    surAwal,
    ayAwal,
    surAkhir,
    ayAkhir,
    Number(payload.bintangTajwid || 0),
    Number(payload.bintangKelancaran || 0),
    Number(payload.bintangMakhraj || 0),
    Number(payload.totalBintang || 0),
    sanitize(payload.hafalanStatus || "Lulus"),
    sanitize(payload.hafalanCatatan),
    // Extended fields Ziyadah & Murojaah
    sanitize(payload.ziyadahSurah),
    Number(payload.ziyadahAyatAwal || 0),
    Number(payload.ziyadahAyatAkhir || 0),
    sanitize(payload.murojaahSurah),
    Number(payload.murojaahAyatAwal || 0),
    Number(payload.murojaahAyatAkhir || 0)
  ];
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(MASTER_HEADERS);
    sheet.getRange(1, 1, 1, MASTER_HEADERS.length).setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  } else {
    // Pastikan header lengkap sampai MASTER_HEADERS
    const currentCols = sheet.getLastColumn();
    if (currentCols < MASTER_HEADERS.length) {
      const missingHeaders = MASTER_HEADERS.slice(currentCols);
      sheet.getRange(1, currentCols + 1, 1, missingHeaders.length).setValues([missingHeaders]).setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff");
    }
  }
  return sheet;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
