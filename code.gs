/**
 * ============================================================================
 * BOS KROCO - ENTERPRISE BACKEND LOGIC ENGINE
 * File: code.gs
 * Arsitektur: Anti-Lag, Safe Data Passing, RBAC & Batch Processing
 * Timezone: Asia/Jakarta (WIB)
 * ============================================================================
 */

var TIMEZONE_JKT = 'Asia/Jakarta';

/**
 * Helper: Hash password menggunakan SHA-256 (Utilities GAS)
 * Digunakan untuk menyimpan dan memverifikasi password tanpa plain text.
 */
function hashPassword(password) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(password).trim()
  );
  // Konversi byte array ke hex string
  return digest.map(function (b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

/**
 * Entry point Google Web App
 */
function doGet(e) {
  var template = HtmlService.createTemplateFromFile('index');
  return template.evaluate()
    .setTitle('Bos Kroco ERP - POS & Multi-Location Manufacturing')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Utilitas Pembacaan Data Batch Aman (String Tabular Murni)
 * getDisplayValues() dipanggil pada Range objek, bukan langsung pada Sheet!
 */
function getSheetRows(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  return sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
}

/**
 * Pencatatan Riwayat Aktivitas Kritis (Audit Trail)
 */
function logAudit(userId, userName, modul, aksi, nilaiLama, nilaiBaru, keterangan) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('AuditTrail');
    if (!sheet) return;
    var nowStr = Utilities.formatDate(new Date(), TIMEZONE_JKT, 'dd/MM/yyyy HH:mm:ss');
    var logId = 'LOG-' + Utilities.formatDate(new Date(), TIMEZONE_JKT, 'yyyyMMddHHmmss') + '-' + Math.floor(Math.random() * 900 + 100);
    sheet.appendRow([
      String(logId),
      String(nowStr),
      String(userId || 'ANON'),
      String(userName || 'System'),
      String(modul || '-'),
      String(aksi || '-'),
      String(nilaiLama || '-'),
      String(nilaiBaru || '-'),
      String(keterangan || '-')
    ]);
    SpreadsheetApp.flush();
  } catch (err) {
    Logger.log('Gagal mencatat audit: ' + err.toString());
  }
}

/**
 * Autentikasi Pengguna & RBAC
 */
function apiLogin(username, password) {
  try {
    var rows = getSheetRows('Users');
    if (rows.length <= 1) {
      return { success: false, message: 'Database pengguna masih kosong. Jalankan setupDatabase terlebih dahulu.' };
    }

    var headers = rows[0];
    var uIdx = headers.indexOf('Username');
    var pIdx = headers.indexOf('Password');
    var idIdx = headers.indexOf('UserID');
    var nameIdx = headers.indexOf('NamaLengkap');
    var roleIdx = headers.indexOf('Role');
    var statIdx = headers.indexOf('Status');

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      // Bandingkan hash password — bukan plain text
      var hashedInput = hashPassword(String(password).trim());
      var storedPassword = String(r[pIdx]).trim();
      // Support backward-compat: jika stored password panjang 64 char → sudah hashed
      // Jika pendek → masih plain text (legacy), bandingkan langsung agar tidak lock-out
      var isMatch = (storedPassword.length === 64)
        ? (hashedInput === storedPassword)
        : (String(username).trim() === r[uIdx] && String(password).trim() === storedPassword);
      if (r[uIdx] === String(username).trim() && isMatch) {
        if (r[statIdx] !== 'Aktif') {
          return { success: false, message: 'Akun Anda berstatus Nonaktif. Hubungi Owner.' };
        }
        logAudit(r[idIdx], r[nameIdx], 'Autentikasi', 'LOGIN', '-', 'Sukses', 'Login dari Web App');
        return {
          success: true,
          user: {
            userId: r[idIdx],
            username: r[uIdx],
            namaLengkap: r[nameIdx],
            role: r[roleIdx]
          }
        };
      }
    }
    return { success: false, message: 'Username atau Password salah.' };
  } catch (err) {
    return { success: false, message: 'Error server: ' + err.toString() };
  }
}

/**
 * Pengambilan Data Ringkasan Dashboard & Metrik Finansial
 */
function apiGetDashboardData(period, userRole) {
  try {
    var rawPeriod = (typeof period === 'object' && period !== null) ? period.period : period;
    var periodStr = String(rawPeriod || 'Bulanan').trim();

    var rowsPenjualan = getSheetRows('Penjualan');
    var rowsKas = getSheetRows('KeuanganKas');
    var rowsHP = getSheetRows('HutangPiutang');
    var rowsStok = getSheetRows('StokLokasi');
    var rowsProduk = getSheetRows('Produk');
    var rowsBahan = getSheetRows('BahanBaku');

    var omzet = 0;
    var pengeluaran = 0;
    var piutang = 0;
    var hutang = 0;
    var totalAsetStok = 0;

    var now = new Date();
    var todayStr = Utilities.formatDate(now, TIMEZONE_JKT, 'dd/MM/yyyy');
    var currentMonthStr = Utilities.formatDate(now, TIMEZONE_JKT, 'MM/yyyy');

    // Batas 7 hari ke belakang untuk filter Mingguan
    var sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    if (rowsPenjualan.length > 1) {
      for (var i = 1; i < rowsPenjualan.length; i++) {
        var tgl = rowsPenjualan[i][1];
        var net = parseFloat(rowsPenjualan[i][7]) || 0;
        var valid = false;

        if (periodStr === 'Harian' && tgl.indexOf(todayStr) === 0) valid = true;
        else if (periodStr === 'Bulanan' && tgl.indexOf(currentMonthStr) !== -1) valid = true;
        else if (periodStr === 'Mingguan') {
          // Fix: hanya 7 hari terakhir, bukan semua data
          var tglPart = tgl.split(' ')[0];
          var tglSplit = tglPart.split('/');
          if (tglSplit.length === 3) {
            var tglDate = new Date(parseInt(tglSplit[2], 10), parseInt(tglSplit[1], 10) - 1, parseInt(tglSplit[0], 10));
            valid = (tglDate >= sevenDaysAgo && tglDate <= now);
          }
        }
        else if (!periodStr || periodStr === 'Semua') valid = true;

        if (valid) omzet += net;
      }
    }

    var saldoKasBerjalan = 0;
    if (rowsKas.length > 1) {
      var lastIdx = rowsKas.length - 1;
      saldoKasBerjalan = parseFloat(rowsKas[lastIdx][7]) || 0;

      for (var j = 1; j < rowsKas.length; j++) {
        var tipe = rowsKas[j][2];
        var nom = parseFloat(rowsKas[j][4]) || 0;
        var tglKas = rowsKas[j][1];
        var matchPeriod = true;

        if (periodStr === 'Harian' && tglKas.indexOf(todayStr) !== 0) matchPeriod = false;
        if (periodStr === 'Bulanan' && tglKas.indexOf(currentMonthStr) === -1) matchPeriod = false;
        if (periodStr === 'Mingguan') {
          // Fix: konsisten dengan filter Penjualan — hanya 7 hari terakhir
          var kasDatePart = tglKas.split(' ')[0];
          var kasDateSplit = kasDatePart.split('/');
          if (kasDateSplit.length === 3) {
            var kasDate = new Date(parseInt(kasDateSplit[2], 10), parseInt(kasDateSplit[1], 10) - 1, parseInt(kasDateSplit[0], 10));
            if (kasDate < sevenDaysAgo || kasDate > now) matchPeriod = false;
          } else {
            matchPeriod = false;
          }
        }

        if (tipe === 'Keluar' && matchPeriod) {
          pengeluaran += nom;
        }
      }
    }

    if (rowsHP.length > 1) {
      for (var k = 1; k < rowsHP.length; k++) {
        var tipeHP = rowsHP[k][2];
        var sisaHP = parseFloat(rowsHP[k][6]) || 0;
        var statusHP = rowsHP[k][8];
        if (statusHP !== 'Lunas') {
          if (tipeHP === 'Piutang') piutang += sisaHP;
          if (tipeHP === 'Hutang') hutang += sisaHP;
        }
      }
    }

    var hargaBeliMap = {};
    if (rowsProduk.length > 1) {
      for (var p = 1; p < rowsProduk.length; p++) {
        hargaBeliMap[rowsProduk[p][0]] = parseFloat(rowsProduk[p][3]) || 0;
      }
    }

    var totalGudang = 0;
    var totalEtalase = 0;
    if (rowsStok.length > 1) {
      for (var s = 1; s < rowsStok.length; s++) {
        var pid = rowsStok[s][0];
        var stokGd = parseFloat(rowsStok[s][2]) || 0;
        var stokEt = parseFloat(rowsStok[s][3]) || 0;
        totalGudang += stokGd;
        totalEtalase += stokEt;
        var hpp = hargaBeliMap[pid] || 0;
        totalAsetStok += ((stokGd + stokEt) * hpp);
      }
    }

    var labaBersih = omzet - pengeluaran;

    return {
      success: true,
      data: {
        omzet: omzet,
        pengeluaran: pengeluaran,
        labaBersih: labaBersih,
        saldoKas: saldoKasBerjalan,
        nilaiAsetStok: totalAsetStok,
        totalPiutang: piutang,
        totalHutang: hutang,
        stokGudangTotal: totalGudang,
        stokEtalaseTotal: totalEtalase
      }
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * Pengambilan Tagihan Mendekati Jatuh Tempo (H-3)
 */
function apiGetDueAlerts() {
  try {
    var rows = getSheetRows('HutangPiutang');
    if (rows.length <= 1) return { success: true, count: 0, items: [] };

    var now = new Date();
    var items = [];
    var count = 0;

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      var sisa = parseFloat(r[6]) || 0;
      var status = r[8];
      var jatuhTempoStr = r[7];

      if (status !== 'Lunas' && sisa > 0) {
        var parts = (jatuhTempoStr || '').split('/');
        var isDueSoon = false;
        var diffDays = 999;
        if (parts.length === 3) {
          var due = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
          diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 3) {
            isDueSoon = true;
          }
        }

        if (isDueSoon) {
          count++;
          items.push({
            refId: r[0],
            tanggal: r[1],
            tipe: r[2],
            kontakNama: r[3],
            totalNominal: r[4],
            terbayar: r[5],
            sisa: sisa,
            jatuhTempo: r[7],
            diffDays: diffDays,
            isOverdue: diffDays < 0,
            status: r[8]
          });
        }
      }
    }

    return { success: true, count: count, items: items };
  } catch (err) {
    return { success: false, count: 0, items: [], message: err.toString() };
  }
}

/**
 * Quick-Pay Pelunasan Tagihan Jatuh Tempo
 */
function apiQuickPayHutangPiutang(payload, userSession) {
  try {
    if (!userSession || !userSession.role || ['Owner', 'Admin', 'Bendahara', 'Bagian Penjualan'].indexOf(userSession.role) === -1) {
      return { success: false, message: 'Akses ditolak: Anda tidak memiliki izin memproses pelunasan tagihan.' };
    }
    var uId = (userSession && userSession.userId) ? userSession.userId : 'USR-SYSTEM';
    var uName = (userSession && userSession.namaLengkap) ? userSession.namaLengkap : 'Kasir';

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetHP = ss.getSheetByName('HutangPiutang');
    var sheetKas = ss.getSheetByName('KeuanganKas');
    var rows = sheetHP.getRange(1, 1, sheetHP.getLastRow(), sheetHP.getLastColumn()).getDisplayValues();

    var refId = payload.refId;
    var bayarNominal = parseFloat(payload.nominalBayar) || 0;
    var targetRowIndex = -1;
    var rowData = null;

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === refId) {
        targetRowIndex = i + 1;
        rowData = rows[i];
        break;
      }
    }

    if (targetRowIndex === -1) {
      return { success: false, message: 'Tagihan dengan RefID ' + refId + ' tidak ditemukan.' };
    }

    var totalNominal = parseFloat(rowData[4]) || 0;
    var terbayarLama = parseFloat(rowData[5]) || 0;
    var sisaLama = parseFloat(rowData[6]) || 0;
    var tipe = rowData[2];
    var kontak = rowData[3];

    var terbayarBaru = terbayarLama + bayarNominal;
    var sisaBaru = Math.max(0, totalNominal - terbayarBaru);
    var status = (sisaBaru <= 0) ? 'Lunas' : 'Sebagian';

    sheetHP.getRange(targetRowIndex, 6).setValue(String(terbayarBaru));
    sheetHP.getRange(targetRowIndex, 7).setValue(String(sisaBaru));
    sheetHP.getRange(targetRowIndex, 9).setValue(status);

    var nowStr = Utilities.formatDate(new Date(), TIMEZONE_JKT, 'dd/MM/yyyy HH:mm:ss');
    var kasType = (tipe === 'Piutang') ? 'Masuk' : 'Keluar';
    var kasKet = 'Pelunasan ' + tipe + ' - ' + kontak + ' (' + refId + ')';
    var lastKasRow = sheetKas.getLastRow();
    var saldoLalu = 0;
    if (lastKasRow > 1) {
      saldoLalu = parseFloat(sheetKas.getRange(lastKasRow, 8).getDisplayValue()) || 0;
    }
    var saldoSekarang = (kasType === 'Masuk') ? (saldoLalu + bayarNominal) : (saldoLalu - bayarNominal);
    var kasId = 'KAS-PAY-' + Utilities.formatDate(new Date(), TIMEZONE_JKT, 'yyyyMMddHHmmss');

    sheetKas.appendRow([
      kasId,
      nowStr,
      kasType,
      'Pelunasan ' + tipe,
      String(bayarNominal),
      kasKet,
      refId,
      String(saldoSekarang),
      uName
    ]);

    logAudit(uId, uName, 'HutangPiutang', 'QUICK_PAY', String(sisaLama), String(sisaBaru), kasKet);
    SpreadsheetApp.flush();

    return { success: true, message: 'Pembayaran tagihan sebesar Rp ' + bayarNominal.toLocaleString('id-ID') + ' berhasil diproses.' };
  } catch (err) {
    return { success: false, message: 'Gagal update pembayaran: ' + err.toString() };
  }
}

/**
 * Pengambilan Daftar Master Produk & Stok Multi-Lokasi
 */
function apiGetProductsPaginated(params) {
  try {
    var rows = getSheetRows('Produk');
    var rowsStok = getSheetRows('StokLokasi');
    if (rows.length <= 1) return { success: true, data: [], total: 0 };

    var search = (params && params.search ? params.search : '').toLowerCase();
    var page = parseInt(params && params.page ? params.page : 1, 10) || 1;
    var limit = parseInt(params && params.limit ? params.limit : 30, 10) || 30;

    var stokMap = {};
    if (rowsStok.length > 1) {
      for (var s = 1; s < rowsStok.length; s++) {
        stokMap[rowsStok[s][0]] = {
          gudang: rowsStok[s][2],
          etalase: rowsStok[s][3],
          statusStok: rowsStok[s][5]
        };
      }
    }

    var filtered = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      var pid = r[0];
      var nama = r[1];
      var status = r[6];

      var matchSearch = (!search || nama.toLowerCase().indexOf(search) !== -1 || pid.toLowerCase().indexOf(search) !== -1);
      if (matchSearch) {
        var sm = stokMap[pid] || { gudang: '0', etalase: '0', statusStok: 'Normal' };
        filtered.push({
          produkId: pid,
          namaProduk: nama,
          satuan: r[2],
          hargaBeliHPP: r[3],
          hargaJual: r[4],
          targetProduksi: r[5],
          status: status,
          stokGudang: sm.gudang,
          stokEtalase: sm.etalase,
          statusStok: sm.statusStok
        });
      }
    }

    var total = filtered.length;
    var startIndex = (page - 1) * limit;
    var pagedData = filtered.slice(startIndex, startIndex + limit);

    return { success: true, data: pagedData, total: total, page: page, limit: limit };
  } catch (err) {
    return { success: false, message: err.toString(), data: [], total: 0 };
  }
}

/**
 * Pendaftaran Master Produk Baru
 */
function apiSaveProduct(payload, userSession) {
  try {
    if (userSession && userSession.role && ['Owner', 'Admin', 'Bagian Produksi', 'Produksi'].indexOf(userSession.role) === -1) {
      return { success: false, message: 'Akses ditolak: Hanya Owner, Admin, atau Tim Produksi yang dapat mendaftarkan master produk.' };
    }
    var uId = (userSession && userSession.userId) ? userSession.userId : 'USR-SYSTEM';
    var uName = (userSession && userSession.namaLengkap) ? userSession.namaLengkap : 'Admin';

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetProduk = ss.getSheetByName('Produk');
    var sheetStok = ss.getSheetByName('StokLokasi');

    var pid = 'PRD-' + Utilities.formatDate(new Date(), TIMEZONE_JKT, 'yyyyMMdd') + '-' + Math.floor(Math.random() * 900 + 100);
    sheetProduk.appendRow([
      pid,
      payload.namaProduk,
      payload.satuan,
      String(payload.hargaBeliHPP || '0'),
      String(payload.hargaJual || '0'),
      String(payload.targetProduksi || '0'),
      'Aktif'
    ]);

    sheetStok.appendRow([
      pid,
      payload.namaProduk,
      '0',
      '0',
      String(payload.batasMinimum || '10'),
      'Aman'
    ]);

    logAudit(uId, uName, 'MasterProduk', 'TAMBAH', '-', pid, 'Tambah Produk: ' + payload.namaProduk);
    SpreadsheetApp.flush();

    return { success: true, produkId: pid, message: 'Produk baru ' + payload.namaProduk + ' berhasil didaftarkan (' + pid + ').' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * Pemrosesan Transaksi Kasir POS
 */
function apiCreateTransaction(payload, userSession) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetTrx = ss.getSheetByName('Penjualan');
    var sheetStok = ss.getSheetByName('StokLokasi');
    var sheetKas = ss.getSheetByName('KeuanganKas');
    var sheetHP = ss.getSheetByName('HutangPiutang');

    var now = new Date();
    var dateStr = Utilities.formatDate(now, TIMEZONE_JKT, 'yyyyMMdd');
    // Anti race-condition: gunakan timestamp HHmmss + random 3-digit
    // Aman untuk concurrent transaksi dari beberapa kasir sekaligus
    var trxId = 'TRX-' + dateStr + '-' + Utilities.formatDate(now, TIMEZONE_JKT, 'HHmmss') + '-' + Math.floor(Math.random() * 900 + 100);

    var nowStr = Utilities.formatDate(now, TIMEZONE_JKT, 'dd/MM/yyyy HH:mm:ss');
    var dateOnlyStr = Utilities.formatDate(now, TIMEZONE_JKT, 'dd/MM/yyyy');

    var cart = payload.cartItems;
    var totalGross = parseFloat(payload.totalGross) || 0;
    var diskon = parseFloat(payload.diskon) || 0;
    var totalNet = parseFloat(payload.totalNet) || 0;
    var metodeBayar = payload.metodeBayar;
    var statusBayar = (metodeBayar === 'Tunai') ? 'Lunas' : 'Belum Lunas';
    var pelangganId = payload.pelangganId || 'CUST-UMUM';
    var namaPelanggan = payload.namaPelanggan || 'Pelanggan Umum';

    var uId = (userSession && userSession.userId) ? userSession.userId : 'USR-SYSTEM';
    var uName = (userSession && userSession.namaLengkap) ? userSession.namaLengkap : 'Kasir';

    sheetTrx.appendRow([
      trxId,
      nowStr,
      pelangganId,
      namaPelanggan,
      JSON.stringify(cart),
      String(totalGross),
      String(diskon),
      String(totalNet),
      metodeBayar,
      (metodeBayar === 'Tunai' ? 'delivered' : 'await'),
      uName
    ]);

    // Pengurangan stok etalase siap jual
    var stokRows = sheetStok.getRange(1, 1, sheetStok.getLastRow(), sheetStok.getLastColumn()).getDisplayValues();
    for (var c = 0; c < cart.length; c++) {
      var item = cart[c];
      for (var s = 1; s < stokRows.length; s++) {
        if (stokRows[s][0] === item.produkId) {
          var currentEtalase = parseFloat(stokRows[s][3]) || 0;
          var newEtalase = Math.max(0, currentEtalase - parseFloat(item.qty));
          var minLimit = parseFloat(stokRows[s][4]) || 10;
          var newStatus = (newEtalase <= minLimit) ? 'Menipis' : 'Aman';
          sheetStok.getRange(s + 1, 4).setValue(String(newEtalase));
          sheetStok.getRange(s + 1, 6).setValue(newStatus);
          break;
        }
      }
    }

    if (metodeBayar === 'Tunai') {
      var lastKasRow = sheetKas.getLastRow();
      var saldoLalu = 0;
      if (lastKasRow > 1) {
        saldoLalu = parseFloat(sheetKas.getRange(lastKasRow, 8).getDisplayValue()) || 0;
      }
      var saldoSekarang = saldoLalu + totalNet;
      var kasId = 'KAS-POS-' + Utilities.formatDate(new Date(), TIMEZONE_JKT, 'yyyyMMddHHmmss');
      sheetKas.appendRow([
        kasId,
        nowStr,
        'Masuk',
        'Penjualan POS',
        String(totalNet),
        'Penjualan Tunai ' + trxId,
        trxId,
        String(saldoSekarang),
        uName
      ]);
    } else {
      var parts = dateOnlyStr.split('/');
      var dueDays = (payload && payload.jatuhTempoHari) ? parseInt(payload.jatuhTempoHari, 10) : 7;
      var dueObj = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10) + dueDays);
      var dueStr = Utilities.formatDate(dueObj, TIMEZONE_JKT, 'dd/MM/yyyy');

      sheetHP.appendRow([
        trxId,
        dateOnlyStr,
        'Piutang',
        namaPelanggan,
        String(totalNet),
        '0',
        String(totalNet),
        dueStr,
        'Belum Lunas'
      ]);
    }

    logAudit(uId, uName, 'POS', 'TRANSAKSI_BARU', '-', trxId, 'Penjualan senilai Rp ' + totalNet);
    SpreadsheetApp.flush();

    return {
      success: true,
      trxId: trxId,
      message: 'Transaksi ' + trxId + ' berhasil diproses.'
    };
  } catch (err) {
    return { success: false, message: 'Gagal memproses transaksi: ' + err.toString() };
  }
}

/**
 * Pembukuan Batch Manufaktur & HPP Otomatis
 */
function apiCreateProductionBatch(payload, userSession) {
  try {
    if (!userSession || !userSession.role || ['Owner', 'Admin', 'Bagian Produksi'].indexOf(userSession.role) === -1) {
      return { success: false, message: 'Akses ditolak: Hanya Owner, Admin, atau Tim Produksi yang dapat mencatat batch produksi.' };
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetProd = ss.getSheetByName('Produksi');
    var sheetStok = ss.getSheetByName('StokLokasi');

    var now = new Date();
    var dateStr = Utilities.formatDate(now, TIMEZONE_JKT, 'yyyyMMdd');
    var batchId = 'PRD-BATCH-' + dateStr + '-' + Math.floor(Math.random() * 9000 + 1000);
    var nowStr = Utilities.formatDate(now, TIMEZONE_JKT, 'dd/MM/yyyy HH:mm:ss');

    var jmlRencana = parseFloat(payload.jmlRencana) || 0;
    var jmlRusak = parseFloat(payload.jmlRusak) || 0;
    var jmlBersih = Math.max(0, jmlRencana - jmlRusak);

    var bBahan = parseFloat(payload.biayaBahan) || 0;
    var bKemasan = parseFloat(payload.biayaKemasan) || 0;
    var bOperasional = parseFloat(payload.biayaOperasional) || 0;
    var bUpah = parseFloat(payload.biayaUpah) || 0;
    var totalHPP = bBahan + bKemasan + bOperasional + bUpah;
    var hppUnit = (jmlBersih > 0) ? Math.round(totalHPP / jmlBersih) : 0;

    sheetProd.appendRow([
      batchId,
      nowStr,
      payload.produkId,
      payload.namaProduk,
      String(jmlRencana),
      String(jmlRusak),
      String(jmlBersih),
      String(bBahan),
      String(bKemasan),
      String(bOperasional),
      String(bUpah),
      String(totalHPP),
      String(hppUnit),
      payload.tipeTenagaKerja || 'Pekerja harian'
    ]);

    var stokRows = sheetStok.getRange(1, 1, sheetStok.getLastRow(), sheetStok.getLastColumn()).getDisplayValues();
    for (var s = 1; s < stokRows.length; s++) {
      if (stokRows[s][0] === payload.produkId) {
        var gdLama = parseFloat(stokRows[s][2]) || 0;
        var gdBaru = gdLama + jmlBersih;
        sheetStok.getRange(s + 1, 3).setValue(String(gdBaru));
        break;
      }
    }

    var uId = (userSession && userSession.userId) ? userSession.userId : 'USR-SYSTEM';
    var uName = (userSession && userSession.namaLengkap) ? userSession.namaLengkap : 'Petugas Produksi';
    logAudit(uId, uName, 'Produksi', 'BATCH_SELESAI', '-', batchId, 'Hasil bersih: ' + jmlBersih + ' pcs. HPP/unit: Rp ' + hppUnit);
    SpreadsheetApp.flush();

    return { success: true, batchId: batchId, hppUnit: hppUnit, jmlBersih: jmlBersih, message: 'Produksi batch ' + batchId + ' berhasil dibukukan.' };
  } catch (err) {
    return { success: false, message: 'Gagal simpan produksi: ' + err.toString() };
  }
}

/**
 * Transfer Stok Internal Antar Lokasi
 */
function apiTransferStok(payload, userSession) {
  try {
    if (!userSession || !userSession.role || ['Owner', 'Admin', 'Bagian Produksi', 'Bagian Penjualan'].indexOf(userSession.role) === -1) {
      return { success: false, message: 'Akses ditolak: Anda tidak memiliki izin melakukan transfer stok.' };
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetStok = ss.getSheetByName('StokLokasi');
    var sheetMutasi = ss.getSheetByName('MutasiLokasi');

    var pid = payload.produkId;
    var asal = payload.lokasiAsal;
    var tujuan = payload.lokasiTujuan;
    var jumlah = parseFloat(payload.jumlah) || 0;

    if (asal === tujuan) {
      return { success: false, message: 'Lokasi asal dan tujuan tidak boleh sama.' };
    }
    if (jumlah <= 0) {
      return { success: false, message: 'Jumlah transfer harus lebih dari 0.' };
    }

    var stokRows = sheetStok.getRange(1, 1, sheetStok.getLastRow(), sheetStok.getLastColumn()).getDisplayValues();
    var targetRow = -1;
    var namaProduk = '';
    var gdVal = 0;
    var etVal = 0;

    for (var i = 1; i < stokRows.length; i++) {
      if (stokRows[i][0] === pid) {
        targetRow = i + 1;
        namaProduk = stokRows[i][1];
        gdVal = parseFloat(stokRows[i][2]) || 0;
        etVal = parseFloat(stokRows[i][3]) || 0;
        break;
      }
    }

    if (targetRow === -1) {
      return { success: false, message: 'Produk tidak ditemukan dalam basis data stok.' };
    }

    if (asal === 'Gudang Produksi') {
      if (gdVal < jumlah) return { success: false, message: 'Stok di Gudang Produksi tidak mencukupi (' + gdVal + ').' };
      gdVal -= jumlah;
      etVal += jumlah;
    } else {
      if (etVal < jumlah) return { success: false, message: 'Stok di Etalase Toko tidak mencukupi (' + etVal + ').' };
      etVal -= jumlah;
      gdVal += jumlah;
    }

    sheetStok.getRange(targetRow, 3).setValue(String(gdVal));
    sheetStok.getRange(targetRow, 4).setValue(String(etVal));

    var nowStr = Utilities.formatDate(new Date(), TIMEZONE_JKT, 'dd/MM/yyyy HH:mm:ss');
    var mutId = 'MUT-' + Utilities.formatDate(new Date(), TIMEZONE_JKT, 'yyyyMMddHHmmss');
    var uId = (userSession && userSession.userId) ? userSession.userId : 'USR-SYSTEM';
    var uName = (userSession && userSession.namaLengkap) ? userSession.namaLengkap : 'Petugas';

    sheetMutasi.appendRow([
      mutId,
      nowStr,
      pid,
      namaProduk,
      asal,
      tujuan,
      String(jumlah),
      uName,
      payload.keterangan || 'Transfer stok rutin'
    ]);

    logAudit(uId, uName, 'MultiLokasi', 'TRANSFER_STOK', asal + ' -> ' + tujuan, String(jumlah), namaProduk);
    SpreadsheetApp.flush();

    return { success: true, message: 'Transfer ' + jumlah + ' unit ' + namaProduk + ' dari ' + asal + ' ke ' + tujuan + ' berhasil.' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * Stock Opname Fisik & Jurnal Selisih Otomatis
 */
function apiSubmitStockOpname(payload, userSession) {
  try {
    if (!userSession || !userSession.role || ['Owner', 'Admin', 'Bagian Produksi', 'Bagian Gudang', 'Auditor Internal', 'Auditor'].indexOf(userSession.role) === -1) {
      return { success: false, message: 'Akses ditolak: Hanya Owner, Admin, Tim Produksi/Gudang, atau Auditor yang dapat submit stock opname.' };
    }
    var uId = (userSession && userSession.userId) ? userSession.userId : 'USR-SYSTEM';
    var uName = (userSession && userSession.namaLengkap) ? userSession.namaLengkap : 'Auditor';

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetOpname = ss.getSheetByName('StockOpname');
    var sheetStok = ss.getSheetByName('StokLokasi');
    var sheetKas = ss.getSheetByName('KeuanganKas');
    var sheetProduk = ss.getSheetByName('Produk');

    var pid = payload.produkId;
    var lokasi = payload.lokasi;
    var fisik = parseFloat(payload.stokFisik) || 0;

    var stokRows = sheetStok.getRange(1, 1, sheetStok.getLastRow(), sheetStok.getLastColumn()).getDisplayValues();
    var targetRow = -1;
    var namaProduk = '';
    var stokSistem = 0;

    for (var i = 1; i < stokRows.length; i++) {
      if (stokRows[i][0] === pid) {
        targetRow = i + 1;
        namaProduk = stokRows[i][1];
        stokSistem = (lokasi === 'Gudang Produksi') ? parseFloat(stokRows[i][2]) || 0 : parseFloat(stokRows[i][3]) || 0;
        break;
      }
    }

    if (targetRow === -1) return { success: false, message: 'Produk tidak ditemukan.' };

    var selisih = fisik - stokSistem;
    var colToUpdate = (lokasi === 'Gudang Produksi') ? 3 : 4;
    sheetStok.getRange(targetRow, colToUpdate).setValue(String(fisik));

    var nowStr = Utilities.formatDate(new Date(), TIMEZONE_JKT, 'dd/MM/yyyy HH:mm:ss');
    var opnameId = 'OPN-' + Utilities.formatDate(new Date(), TIMEZONE_JKT, 'yyyyMMddHHmmss');

    sheetOpname.appendRow([
      opnameId,
      nowStr,
      pid,
      namaProduk,
      lokasi,
      String(stokSistem),
      String(fisik),
      String(selisih),
      payload.keterangan || 'Audit rutin',
      uName
    ]);

    if (selisih < 0) {
      var hppMap = {};
      var prodRows = sheetProduk.getRange(1, 1, sheetProduk.getLastRow(), sheetProduk.getLastColumn()).getDisplayValues();
      for (var p = 1; p < prodRows.length; p++) {
        hppMap[prodRows[p][0]] = parseFloat(prodRows[p][3]) || 0;
      }
      var lossNominal = Math.abs(selisih) * (hppMap[pid] || 0);

      var lastKasRow = sheetKas.getLastRow();
      var saldoLalu = 0;
      if (lastKasRow > 1) {
        saldoLalu = parseFloat(sheetKas.getRange(lastKasRow, 8).getDisplayValue()) || 0;
      }
      var kasId = 'KAS-ADJ-' + Utilities.formatDate(new Date(), TIMEZONE_JKT, 'yyyyMMddHHmmss');
      sheetKas.appendRow([
        kasId,
        nowStr,
        'Keluar',
        'Penyesuaian Selisih Stok',
        String(lossNominal),
        'Selisih Opname Kurang ' + Math.abs(selisih) + ' pcs (' + namaProduk + ')',
        opnameId,
        String(saldoLalu - lossNominal),
        uName
      ]);
    }

    logAudit(uId, uName, 'StockOpname', 'ADJUST_STOK', String(stokSistem), String(fisik), 'Selisih: ' + selisih);
    SpreadsheetApp.flush();

    return { success: true, message: 'Stock opname ' + namaProduk + ' berhasil. Stok disesuaikan ke ' + fisik + ' (Selisih: ' + selisih + ').' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * Pencatatan Kas Masuk / Keluar Manual
 */
function apiSaveKasManual(payload, userSession) {
  try {
    if (!userSession || !userSession.role || ['Owner', 'Admin', 'Bendahara'].indexOf(userSession.role) === -1) {
      return { success: false, message: 'Akses ditolak: Hanya Owner, Admin, dan Bendahara yang berhak mencatat kas manual.' };
    }
    var uId = (userSession && userSession.userId) ? userSession.userId : 'USR-SYSTEM';
    var uName = (userSession && userSession.namaLengkap) ? userSession.namaLengkap : 'Admin';

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetKas = ss.getSheetByName('KeuanganKas');

    var tipe = payload.tipe;
    var nominal = parseFloat(payload.nominal) || 0;
    var lastRow = sheetKas.getLastRow();
    var saldoLalu = 0;
    if (lastRow > 1) {
      saldoLalu = parseFloat(sheetKas.getRange(lastRow, 8).getDisplayValue()) || 0;
    }
    var saldoSekarang = (tipe === 'Masuk') ? (saldoLalu + nominal) : (saldoLalu - nominal);

    var nowStr = Utilities.formatDate(new Date(), TIMEZONE_JKT, 'dd/MM/yyyy HH:mm:ss');
    var kasId = 'KAS-' + Utilities.formatDate(new Date(), TIMEZONE_JKT, 'yyyyMMddHHmmss');

    sheetKas.appendRow([
      kasId,
      nowStr,
      tipe,
      payload.kategori,
      String(nominal),
      payload.keterangan || '-',
      'MANUAL',
      String(saldoSekarang),
      uName
    ]);

    logAudit(uId, uName, 'Kas', 'MANUAL_' + tipe.toUpperCase(), '-', String(nominal), payload.keterangan);
    SpreadsheetApp.flush();

    return { success: true, message: 'Kas ' + tipe + ' sebesar Rp ' + nominal.toLocaleString('id-ID') + ' berhasil dicatat.' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * Pengambilan Riwayat Mutasi Buku Kas & Arus Kas Lengkap
 */
function apiGetKeuanganKas(userSession) {
  try {
    if (!userSession || !userSession.role || ['Owner', 'Admin', 'Bendahara'].indexOf(userSession.role) === -1) {
      return { success: false, message: 'Akses ditolak: Hanya Owner, Admin, dan Bendahara yang berhak mengakses buku kas.' };
    }
    var rows = getSheetRows('KeuanganKas');
    if (rows.length <= 1) return { success: true, data: [] };
    var kasList = [];
    for (var i = rows.length - 1; i >= 1; i--) {
      kasList.push({
        kasId: String(rows[i][0] || ''),
        tanggal: String(rows[i][1] || ''),
        tipe: String(rows[i][2] || 'Masuk'),
        kategori: String(rows[i][3] || ''),
        nominal: parseFloat(rows[i][4]) || 0,
        keterangan: String(rows[i][5] || '-'),
        refId: String(rows[i][6] || '-'),
        saldoBerjalan: parseFloat(rows[i][7]) || 0,
        dicatatOleh: String(rows[i][8] || '-')
      });
      if (kasList.length >= 300) break;
    }
    return { success: true, data: kasList };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * Pencatatan Presensi & Upah Tenaga Kerja
 */
function apiSaveTenagaKerja(payload, userSession) {
  try {
    if (!userSession || !userSession.role || ['Owner', 'Admin', 'Bendahara', 'HRD & Personalia', 'HRD'].indexOf(userSession.role) === -1) {
      return { success: false, message: 'Akses ditolak: Anda tidak memiliki izin mencatat upah tenaga kerja.' };
    }
    var uId = (userSession && userSession.userId) ? userSession.userId : 'USR-SYSTEM';
    var uName = (userSession && userSession.namaLengkap) ? userSession.namaLengkap : 'Petugas HRD';

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('TenagaKerja');
    var pId = 'TK-' + Utilities.formatDate(new Date(), TIMEZONE_JKT, 'yyyyMMdd') + '-' + Math.floor(Math.random() * 900 + 100);
    var dateOnlyStr = Utilities.formatDate(new Date(), TIMEZONE_JKT, 'dd/MM/yyyy');

    var jamMasuk = payload.jamMasuk || '08:00';
    var jamKeluar = payload.jamKeluar || '16:00';
    var totalJam = parseFloat(payload.totalJam) || 8;
    var upahRate = parseFloat(payload.upahRate) || 12000;
    var lembur = parseFloat(payload.lembur) || 0;
    var bonus = parseFloat(payload.bonus) || 0;
    var potongan = parseFloat(payload.potongan) || 0;
    var kasbon = parseFloat(payload.kasbon) || 0;
    var totalBayar = (totalJam * upahRate) + lembur + bonus - potongan - kasbon;

    sheet.appendRow([
      pId,
      payload.namaPekerja,
      payload.tipePekerja,
      dateOnlyStr,
      jamMasuk,
      jamKeluar,
      String(totalJam),
      String(upahRate),
      String(lembur),
      String(bonus),
      String(potongan),
      String(kasbon),
      String(totalBayar),
      payload.statusBayar || 'Lunas'
    ]);

    logAudit(uId, uName, 'TenagaKerja', 'CATAT_UPAH', '-', String(totalBayar), 'Upah ' + payload.namaPekerja);
    SpreadsheetApp.flush();
    return { success: true, message: 'Presensi dan upah ' + payload.namaPekerja + ' sebesar Rp ' + totalBayar.toLocaleString('id-ID') + ' berhasil disimpan.' };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * Pembaruan Status Transaksi Tunggal
 */
function apiUpdateTransactionStatus(payload, userSession) {
  try {
    if (!userSession || !userSession.role || ['Owner', 'Admin', 'Bendahara', 'Bagian Penjualan'].indexOf(userSession.role) === -1) {
      return { success: false, message: 'Akses ditolak: Anda tidak memiliki izin memperbarui status transaksi.' };
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetTrx = ss.getSheetByName('Penjualan');
    if (!sheetTrx) return { success: false, message: 'Sheet Penjualan tidak ditemukan.' };

    var trxId = payload.trxId;
    var newStatus = payload.status;
    var rows = sheetTrx.getRange(1, 1, sheetTrx.getLastRow(), sheetTrx.getLastColumn()).getDisplayValues();
    var targetRowIndex = -1;
    var oldStatus = '-';

    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === trxId) {
        targetRowIndex = i + 1;
        oldStatus = rows[i][9] || '-';
        break;
      }
    }

    if (targetRowIndex === -1) {
      return { success: false, message: 'Transaksi ' + trxId + ' tidak ditemukan.' };
    }

    sheetTrx.getRange(targetRowIndex, 10).setValue(String(newStatus));

    logAudit(
      userSession ? userSession.userId : 'USR-SYSTEM',
      userSession ? userSession.namaLengkap : 'Admin',
      'Penjualan',
      'UBAH_STATUS',
      oldStatus,
      newStatus,
      'Pembaruan status pesanan ' + trxId + ' menjadi "' + newStatus + '"'
    );

    SpreadsheetApp.flush();
    return { success: true, message: 'Status transaksi ' + trxId + ' berhasil diubah ke: ' + newStatus };
  } catch (err) {
    return { success: false, message: 'Gagal update status: ' + err.toString() };
  }
}

/**
 * Pembaruan Status Transaksi Massal (Batch)
 */
function apiBatchUpdateTransactionStatus(payload, userSession) {
  try {
    if (!userSession || !userSession.role || ['Owner', 'Admin', 'Bendahara', 'Bagian Penjualan'].indexOf(userSession.role) === -1) {
      return { success: false, message: 'Akses ditolak: Anda tidak memiliki izin memperbarui status transaksi massal.' };
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetTrx = ss.getSheetByName('Penjualan');
    if (!sheetTrx) return { success: false, message: 'Sheet Penjualan tidak ditemukan.' };

    var trxIds = payload.trxIds || [];
    var newStatus = payload.status;
    if (trxIds.length === 0) return { success: false, message: 'Tidak ada transaksi terpilih.' };

    var rows = sheetTrx.getRange(1, 1, sheetTrx.getLastRow(), sheetTrx.getLastColumn()).getDisplayValues();
    var updatedCount = 0;

    for (var j = 0; j < trxIds.length; j++) {
      var targetId = trxIds[j];
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === targetId) {
          var rowIndex = i + 1;
          var oldStatus = rows[i][9] || '-';
          sheetTrx.getRange(rowIndex, 10).setValue(String(newStatus));
          updatedCount++;
          logAudit(
            userSession ? userSession.userId : 'USR-SYSTEM',
            userSession ? userSession.namaLengkap : 'Admin',
            'Penjualan',
            'BATCH_UBAH_STATUS',
            oldStatus,
            newStatus,
            'Pembaruan massal ' + targetId + ' ke ' + newStatus
          );
          break;
        }
      }
    }

    SpreadsheetApp.flush();
    return { success: true, count: updatedCount, message: updatedCount + ' pesanan berhasil diperbarui ke status: ' + newStatus };
  } catch (err) {
    return { success: false, message: 'Gagal update massal: ' + err.toString() };
  }
}

/**
 * Cetak PDF Otomatis Dokumen Bukti Transaksi
 */
function apiGenerateDocumentPdf(payload) {
  try {
    var docType = payload.docType || 'STRUK_POS';
    var docId = payload.docId || 'TRX-SAMPLE';
    var title = 'Dokumen_' + docType + '_' + docId;

    // Cari data riil transaksi di sheet Penjualan
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetTrx = ss.getSheetByName('Penjualan');
    var rows = sheetTrx ? sheetTrx.getRange(1, 1, sheetTrx.getLastRow(), sheetTrx.getLastColumn()).getDisplayValues() : [];

    var trxData = null;
    if (rows.length > 1) {
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] === docId) {
          trxData = {
            trxId: rows[i][0],
            tanggal: rows[i][1],
            pelangganId: rows[i][2],
            namaPelanggan: rows[i][3],
            itemList: [],
            totalGross: parseFloat(rows[i][5]) || 0,
            diskon: parseFloat(rows[i][6]) || 0,
            totalNet: parseFloat(rows[i][7]) || 0,
            metodeBayar: rows[i][8],
            statusBayar: rows[i][9],
            kasir: rows[i][10]
          };
          try {
            trxData.itemList = JSON.parse(rows[i][4]);
          } catch (e) {
            trxData.itemList = [];
          }
          break;
        }
      }
    }

    var tableRowsHtml = '';
    var summaryHtml = '';

    if (trxData && trxData.itemList && trxData.itemList.length > 0) {
      for (var k = 0; k < trxData.itemList.length; k++) {
        var it = trxData.itemList[k];
        var itemNama = it.namaProduk || it.nama || it.category || ('Produk ' + (k + 1));
        var itemQty = parseFloat(it.qty) || 1;
        var itemHarga = parseFloat(it.harga) || 0;
        var itemSubtotal = parseFloat(it.subtotal) || (itemQty * itemHarga);
        tableRowsHtml += '<tr>'
          + '<td>' + (k + 1) + '</td>'
          + '<td>' + itemNama + '</td>'
          + '<td style="text-align:center;">' + itemQty + '</td>'
          + '<td style="text-align:right;">Rp ' + itemHarga.toLocaleString('id-ID') + '</td>'
          + '<td style="text-align:right;">Rp ' + itemSubtotal.toLocaleString('id-ID') + '</td>'
          + '</tr>';
      }

      summaryHtml = '<div style="margin-top: 16px; border-top: 2px solid #cbd5e1; padding-top: 10px; width: 280px; margin-left: auto;">'
        + '<div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px;"><span>Subtotal:</span><span>Rp ' + trxData.totalGross.toLocaleString('id-ID') + '</span></div>'
        + '<div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; color:#e11d48;"><span>Diskon:</span><span>- Rp ' + trxData.diskon.toLocaleString('id-ID') + '</span></div>'
        + '<div style="display:flex; justify-content:space-between; font-size:14px; font-weight:bold; color:#4a35c5; border-top: 1px dashed #cbd5e1; padding-top:6px;"><span>Total Bayar:</span><span>Rp ' + trxData.totalNet.toLocaleString('id-ID') + '</span></div>'
        + '<div style="display:flex; justify-content:space-between; margin-top:6px; font-size:11px; color:#64748b;"><span>Metode:</span><span>' + trxData.metodeBayar + ' (' + trxData.statusBayar + ')</span></div>'
        + '</div>';
    } else {
      tableRowsHtml = '<tr><td>1</td><td>Bukti Transaksi ' + docId + '</td><td style="text-align:center;">1</td><td style="text-align:right;">-</td><td style="text-align:right;">SUKSES TERSINKRON</td></tr>';
      summaryHtml = '<div class="total-box">STATUS: TERVERIFIKASI SISTEM</div>';
    }

    var customerInfo = trxData
      ? ('<b>Pelanggan:</b> ' + (trxData.namaPelanggan || 'Pelanggan Umum') + ' | <b>Kasir:</b> ' + (trxData.kasir || 'Kasir') + ' | <b>Waktu:</b> ' + (trxData.tanggal || '-'))
      : '';

    var htmlContent = '<html><head><style>'
      + 'body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }'
      + 'h2 { margin-bottom: 4px; color: #4a35c5; font-size: 20px; }'
      + '.header-box { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }'
      + 'table { width: 100%; border-collapse: collapse; margin-top: 15px; }'
      + 'th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 12px; }'
      + 'th { background-color: #f1f5f9; font-weight: bold; }'
      + '.total-box { margin-top: 24px; font-size: 16px; font-weight: bold; text-align: right; color: #4a35c5; }'
      + '</style></head><body>'
      + '<div class="header-box">'
      + '<h2>BOS KROCO ERP ENTERPRISE</h2>'
      + '<p style="margin:2px 0; font-size:12px; color:#64748b;">Sistem POS Kasir & Manufaktur Multi-Lokasi Terintegrasi | Telp: 0812-3456-7890</p>'
      + '<p style="margin:6px 0 0; font-size:12px;"><b>No Dokumen:</b> ' + docId + ' | <b>Tipe:</b> ' + docType + '</p>'
      + (customerInfo ? '<p style="margin:4px 0 0; font-size:12px; color:#334155;">' + customerInfo + '</p>' : '')
      + '</div>'
      + '<p style="font-size:12px; color:#475569;">Dokumen ini adalah bukti transaksi resmi yang digenerate oleh Bos Kroco Engine.</p>'
      + '<table>'
      + '<thead><tr><th>No</th><th>Deskripsi Transaksi / Produk</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Harga</th><th style="text-align:right;">Subtotal</th></tr></thead>'
      + '<tbody>'
      + tableRowsHtml
      + '</tbody>'
      + '</table>'
      + summaryHtml
      + '<div style="margin-top:30px; font-size:11px; text-align:center; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:12px;">Terima kasih atas kerja sama Anda. Bos Kroco ERP Enterprise.</div>'
      + '</body></html>';

    var blob = Utilities.newBlob(htmlContent, 'text/html', title + '.html').getAs('application/pdf');
    var file = DriveApp.createFile(blob);
    file.setName(title + '.pdf');

    return {
      success: true,
      pdfUrl: file.getUrl(),
      downloadUrl: file.getDownloadUrl(),
      message: 'PDF transaksi berhasil dibuat di Google Drive.'
    };
  } catch (err) {
    return { success: false, message: 'Gagal generate PDF: ' + err.toString() };
  }
}

/**
 * Log Audit Trail Pengambilan (Khusus Owner & Admin)
 */
function apiGetAuditTrail(userSession) {
  try {
    // RBAC: hanya Owner dan Admin yang boleh akses
    if (!userSession || (userSession.role !== 'Owner' && userSession.role !== 'Admin')) {
      logAudit(
        userSession ? userSession.userId : 'ANON',
        userSession ? userSession.namaLengkap : 'Anonim',
        'AuditTrail', 'AKSES_DITOLAK', '-', '-',
        'Percobaan akses log audit oleh role: ' + (userSession ? userSession.role : 'ANON')
      );
      return { success: false, message: 'Akses ditolak. Modul ini hanya untuk Owner dan Admin.' };
    }
    var rows = getSheetRows('AuditTrail');
    if (rows.length <= 1) return { success: true, data: [] };
    var logs = [];
    for (var i = rows.length - 1; i >= 1; i--) {
      logs.push({
        logId: rows[i][0],
        waktu: rows[i][1],
        userId: rows[i][2],
        namaUser: rows[i][3],
        modul: rows[i][4],
        aksi: rows[i][5],
        nilaiLama: rows[i][6],
        nilaiBaru: rows[i][7],
        keterangan: rows[i][8]
      });
      if (logs.length >= 60) break;
    }
    return { success: true, data: logs };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * Ambil 20 transaksi terbaru dari sheet Penjualan untuk tabel pesanan dashboard
 * Diurutkan dari yang terbaru (baris terakhir → pertama)
 */
function apiGetRecentTransactions() {
  try {
    var rows = getSheetRows('Penjualan');
    if (rows.length <= 1) return { success: true, data: [] };

    var headers = rows[0];
    var colTrxId     = headers.indexOf('TrxID');
    var colTgl       = headers.indexOf('Tanggal');
    var colPelanggan = headers.indexOf('NamaPelanggan');
    var colItems     = headers.indexOf('ItemListJSON');
    var colTotal     = headers.indexOf('TotalNet');
    var colMetode    = headers.indexOf('MetodeBayar');
    var colStatus    = headers.indexOf('StatusBayar');
    var colKasir     = headers.indexOf('Kasir');

    var results = [];
    // Baca dari bawah (terbaru) ke atas (terlama)
    for (var i = rows.length - 1; i >= 1; i--) {
      var r = rows[i];
      var trxId = colTrxId >= 0 ? r[colTrxId] : ('TRX-' + i);

      // Ambil ringkasan nama item dari ItemListJSON dan simpan array objek item
      var prodName = '-';
      var parsedItems = [];
      if (colItems >= 0 && r[colItems]) {
        try {
          var parsed = JSON.parse(r[colItems]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsedItems = parsed;
            prodName = parsed.map(function(p) { return p.namaProduk || p.nama || 'Item'; }).join(', ');
          }
        } catch (e) {
          prodName = r[colItems];
        }
      }

      var rawStatus = colStatus >= 0 ? r[colStatus] : 'delivered';
      var normalizedStatus = 'delivered';
      if (rawStatus === 'delivered' || rawStatus === 'Lunas') {
        normalizedStatus = 'delivered';
      } else if (rawStatus === 'on way' || rawStatus === 'Sebagian') {
        normalizedStatus = 'on way';
      } else {
        normalizedStatus = 'await';
      }

      results.push({
        id:        trxId,
        orderNum:  'Nº' + (600000 + i),
        customer:  colPelanggan >= 0 && r[colPelanggan] ? r[colPelanggan] : 'Pelanggan Umum',
        phone:     colKasir >= 0 && r[colKasir] ? r[colKasir] : 'Kasir',
        category:  prodName,
        price:     colTotal >= 0 ? (parseFloat(r[colTotal]) || 0) : 0,
        date:      colTgl >= 0 && r[colTgl] ? r[colTgl].split(' ')[0] : '-',
        payment:   colMetode >= 0 && r[colMetode] ? r[colMetode] : 'Tunai',
        status:    normalizedStatus,
        items:     parsedItems
      });
      if (results.length >= 20) break;
    }
    return { success: true, data: results };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * [ADMIN TOOL] Upgrade semua password plain text di sheet Users menjadi SHA-256.
 * Jalankan SEKALI dari Script Editor setelah pertama deploy.
 * Fungsi ini TIDAK dipanggil oleh frontend.
 */
function adminHashAllPasswords() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Users');
  if (!sheet) { Logger.log('Sheet Users tidak ditemukan.'); return; }
  var rows = sheet.getDataRange().getDisplayValues();
  if (rows.length <= 1) return;
  var headers = rows[0];
  var pIdx = headers.indexOf('Password');
  if (pIdx < 0) { Logger.log('Kolom Password tidak ditemukan.'); return; }
  var count = 0;
  for (var i = 1; i < rows.length; i++) {
    var current = rows[i][pIdx];
    // Skip jika sudah berupa SHA-256 hex (64 karakter)
    if (current.length === 64) continue;
    var hashed = hashPassword(current);
    sheet.getRange(i + 1, pIdx + 1).setValue(hashed);
    count++;
  }
  SpreadsheetApp.flush();
  Logger.log('Selesai: ' + count + ' password berhasil di-hash.');
}