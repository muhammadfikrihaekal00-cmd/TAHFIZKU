/**
 * =======================================================================
 * GOOGLE APPS SCRIPT - RQ UMMUL QASIM (TAMHID, TARTIL & HAFALAN) - FINAL
 * =======================================================================
 * Panduan Pasang di Google Spreadsheet:
 * 1. Buka https://sheets.google.com, buat spreadsheet baru bernama "RQ Ummul Qasim - Mutaba'ah"
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script"
 * 3. Hapus semua kode default di Apps Script, ganti dengan seluruh isi file ini
 * 4. Klik tombol Simpan (ikon disket 💾)
 * 5. Klik tombol "Terapkan" (Deploy) di kanan atas > pilih "Penerapan Baru" (New Deployment)
 * 6. Pilih jenis: "Aplikasi Web" (Web app)
 *    - Deskripsi: RQ Ummul Qasim API
 *    - Jalankan sebagai: "Saya" (Me)
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone) -> SANGAT PENTING!
 * 7. Klik "Terapkan" (Deploy), berikan izin akses akun Google Anda
 * 8. Salin URL Aplikasi Web (contoh: https://script.google.com/macros/s/.../exec)
 * 9. Tempelkan URL tersebut ke Pengaturan Spreadsheet di aplikasi web!
 * =======================================================================
 */

const SHEET_NAME_SETORAN = "Data_Setoran";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "read";

    if (action === "test") {
      return createJsonResponse({ status: "success", message: "Koneksi Google Spreadsheet RQ Ummul Qasim Berhasil!" });
    }

    if (action === "read") {
      const sheet = getOrCreateSheet(ss, SHEET_NAME_SETORAN);
      const data = sheet.getDataRange().getValues();
      
      if (data.length <= 1) {
        return createJsonResponse({ status: "success", total: 0, data: [] });
      }

      const rows = [];
      // Baris pertama (index 0) adalah header
      for (let i = 1; i < data.length; i++) {
        const d = data[i];
        if (!d[0] && !d[3]) continue; // lewati baris kosong

        // Format tanggal jika objek Date
        let tglStr = d[2];
        if (d[2] instanceof Date) {
          tglStr = Utilities.formatDate(d[2], "GMT+7", "yyyy-MM-dd");
        } else if (d[2]) {
          tglStr = String(d[2]).split("T")[0];
        }

        rows.push({
          id: String(d[0] || ""),
          timestamp: d[1] || "",
          tanggal: tglStr || "",
          santriId: String(d[3] || ""),
          namaSantri: String(d[4] || ""),
          halaqah: String(d[5] || ""),
          kategori: String(d[6] || ""),
          ustadz: String(d[7] || ""),
          // Tilawah
          bacaanTipe: String(d[8] || "Tamhid"),
          tamhidJilid: String(d[9] || "-"),
          tamhidHalaman: String(d[10] || "-"),
          tartilJuz: String(d[11] || "-"),
          tartilHalaman: String(d[12] || "-"),
          bacaanStatus: String(d[13] || "Lanjut"),
          bacaanCatatan: String(d[14] || "-"),
          // Hafalan
          hafalanJenis: String(d[15] || "Ziyadah"),
          surahAwal: String(d[16] || "-"),
          ayatAwal: Number(d[17] || 1),
          surahAkhir: String(d[18] || "-"),
          ayatAkhir: Number(d[19] || 1),
          bintangTajwid: Number(d[20] || 0),
          bintangKelancaran: Number(d[21] || 0),
          bintangMakhraj: Number(d[22] || 0),
          totalBintang: Number(d[23] || 0),
          hafalanStatus: String(d[24] || "Lulus"),
          hafalanCatatan: String(d[25] || "-")
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

    return createJsonResponse({ status: "success", message: "RQ Ummul Qasim API Siap Digunakan." });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, SHEET_NAME_SETORAN);
    
    let payload;
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    const timestamp = new Date();
    const tgl = payload.tanggal || Utilities.formatDate(timestamp, "GMT+7", "yyyy-MM-dd");

    const row = [
      payload.id || ("REC-" + Date.now()),
      Utilities.formatDate(timestamp, "GMT+7", "yyyy-MM-dd HH:mm:ss"),
      tgl,
      payload.santriId || "-",
      payload.namaSantri || "-",
      payload.halaqah || "-",
      payload.kategori || "-",
      payload.ustadz || "-",
      // Tilawah
      payload.bacaanTipe || "Tamhid",
      payload.tamhidJilid || "-",
      payload.tamhidHalaman || "-",
      payload.tartilJuz || "-",
      payload.tartilHalaman || "-",
      payload.bacaanStatus || "Lanjut",
      payload.bacaanCatatan || "-",
      // Hafalan
      payload.hafalanJenis || "Ziyadah",
      payload.surahAwal || "-",
      Number(payload.ayatAwal || 1),
      payload.surahAkhir || "-",
      Number(payload.ayatAkhir || 1),
      Number(payload.bintangTajwid || 0),
      Number(payload.bintangKelancaran || 0),
      Number(payload.bintangMakhraj || 0),
      Number(payload.totalBintang || 0),
      payload.hafalanStatus || "Lulus",
      payload.hafalanCatatan || "-"
    ];

    sheet.appendRow(row);

    return createJsonResponse({
      status: "success",
      message: "Data setoran berhasil dicatat ke Google Sheets secara realtime!",
      data: payload
    });
  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = [
      "ID Setoran",
      "Waktu Pencatatan",
      "Tanggal Setoran",
      "ID Santri",
      "Nama Santri",
      "Kelas / Halaqah",
      "Kategori",
      "Ustadz Pengampu",
      "Jenis Tilawah",
      "Tamhid Jilid",
      "Tamhid Halaman",
      "Tartil Juz",
      "Tartil Halaman",
      "Status Tilawah",
      "Catatan Tilawah",
      "Jenis Hafalan",
      "Surah Awal",
      "Ayat Awal",
      "Surah Akhir",
      "Ayat Akhir",
      "Bintang Tajwid",
      "Bintang Kelancaran",
      "Bintang Makhraj",
      "Total Bintang",
      "Status Hafalan",
      "Catatan Evaluasi"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
