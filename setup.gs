/**
 * ============================================================================
 * ZETTBOT 3.1 - ENTERPRISE DATABASE SETUP & DUMMY SEED ENGINE
 * File: setup.gs
 * Target: Google Apps Script Database Initialization
 * Timezone: Asia/Jakarta (WIB)
 * ============================================================================
 * CATATAN: TIMEZONE_JKT didefinisikan di code.gs (scope global GAS bersama)
 * ============================================================================
 */

/**
 * Definisi Skema Database Resmi Zettbos ERP & POS Enterprise
 */
var SCHEMA_DEFINITIONS = {
  'Users': [
    'UserID', 'Username', 'Password', 'NamaLengkap', 'Role', 'Status'
  ],
  'Produk': [
    'ProdukID', 'NamaProduk', 'Satuan', 'HargaBeliHPP', 'HargaJual', 'TargetProduksi', 'Status'
  ],
  'StokLokasi': [
    'ProdukID', 'NamaProduk', 'GudangProduksi', 'EtalaseToko', 'BatasMinimum', 'Status'
  ],
  'BahanBaku': [
    'BahanID', 'NamaBahan', 'Satuan', 'Stok', 'HargaBeli', 'Supplier', 'TerakhirBeli'
  ],
  'PelangganToko': [
    'PelangganID', 'NamaToko', 'Kontak', 'Alamat', 'TotalBeli', 'TotalPiutang', 'Status'
  ],
  'Penjualan': [
    'TrxID', 'Tanggal', 'PelangganID', 'NamaPelanggan', 'ItemListJSON', 'TotalGross',
    'Diskon', 'TotalNet', 'MetodeBayar', 'StatusBayar', 'Kasir'
  ],
  'Produksi': [
    'ProduksiID', 'Tanggal', 'ProdukID', 'NamaProduk', 'JmlRencana', 'JmlRusak', 'JmlBersih',
    'BiayaBahan', 'BiayaKemasan', 'BiayaOperasional', 'BiayaUpah', 'TotalHPPBatch', 'HPPUnit', 'TipeTenagaKerja'
  ],
  'KeuanganKas': [
    'KasID', 'Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Keterangan', 'RefID', 'SaldoBerjalan', 'DicatatOleh'
  ],
  'TenagaKerja': [
    'PekerjaID', 'NamaPekerja', 'TipePekerja', 'Tanggal', 'JamMasuk', 'JamKeluar',
    'TotalJam', 'UpahRate', 'Lembur', 'Bonus', 'Potongan', 'Kasbon', 'TotalBayar', 'StatusBayar'
  ],
  'HutangPiutang': [
    'RefID', 'Tanggal', 'Tipe', 'KontakNama', 'TotalNominal', 'Terbayar', 'Sisa', 'JatuhTempo', 'Status'
  ],
  'StockOpname': [
    'OpnameID', 'Tanggal', 'ProdukID', 'NamaProduk', 'Lokasi', 'StokSistem', 'StokFisik', 'Selisih', 'Keterangan', 'PetugasAudit'
  ],
  'MutasiLokasi': [
    'MutasiID', 'Tanggal', 'ProdukID', 'NamaProduk', 'LokasiAsal', 'LokasiTujuan', 'Jumlah', 'DicatatOleh', 'Keterangan'
  ],
  'AuditTrail': [
    'LogID', 'Waktu', 'UserID', 'NamaUser', 'Modul', 'Aksi', 'NilaiLama', 'NilaiBaru', 'Keterangan'
  ]
};

/**
 * Menjalankan migrasi database yang aman dan non-destruktif.
 * Jika sheet belum ada, sheet dibuat dan langsung diisi 10 data dummy.
 * Jika sheet sudah ada dan kosong, 10 data dummy disuntikkan secara otomatis.
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = Object.keys(SCHEMA_DEFINITIONS);
  var logMigrasi = [];

  sheetNames.forEach(function(sName) {
    var targetSheet = ss.getSheetByName(sName);
    var expectedHeaders = SCHEMA_DEFINITIONS[sName];

    if (!targetSheet) {
      targetSheet = ss.insertSheet(sName);
      targetSheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      formatHeaderRow(targetSheet, expectedHeaders.length);
      seedTenDummyRecords(targetSheet, sName);
      logMigrasi.push('Sheet baru dibuat & diisi 10 dummy: ' + sName);
    } else {
      var lastCol = targetSheet.getLastColumn();
      var currentHeaders = [];
      if (lastCol > 0) {
        currentHeaders = targetSheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
      }

      var missingHeaders = [];
      expectedHeaders.forEach(function(headerName) {
        if (currentHeaders.indexOf(headerName) === -1) {
          missingHeaders.push(headerName);
        }
      });

      if (missingHeaders.length > 0) {
        var startCol = lastCol + 1;
        targetSheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
        formatHeaderRow(targetSheet, targetSheet.getLastColumn());
        logMigrasi.push('Penambahan kolom baru pada ' + sName + ': +' + missingHeaders.join(', '));
      }

      // Jika sheet sudah ada namun belum memiliki baris data (hanya header)
      if (targetSheet.getLastRow() <= 1) {
        seedTenDummyRecords(targetSheet, sName);
        logMigrasi.push('Sheet kosong ' + sName + ' berhasil diisi 10 data dummy.');
      } else {
        logMigrasi.push('Sheet ' + sName + ' sudah memiliki data aktif (data dipertahankan aman).');
      }
    }
  });

  SpreadsheetApp.flush();
  Logger.log('=== HASIL SETUP DATABASE ===\n' + logMigrasi.join('\n'));
  return 'Setup Database Berhasil! Semua tabel dan 10 data dummy sinkron terpasang.';
}

/**
 * Format baris header visual agar selaras dengan standar estetika Zettbos
 */
function formatHeaderRow(sheet, numCols) {
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setBackground('#0f172a');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Arial');
  headerRange.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

/**
 * Generator 10 Data Dummy Realistis, Terpadu, dan Sinkron dengan Web App
 */
function seedTenDummyRecords(sheet, sheetName) {
  var nowStr = Utilities.formatDate(new Date(), TIMEZONE_JKT, 'dd/MM/yyyy HH:mm:ss');
  var dateOnlyStr = Utilities.formatDate(new Date(), TIMEZONE_JKT, 'dd/MM/yyyy');

  // 1. DATA PENGGUNA & HAK AKSES (Users)
  if (sheetName === 'Users') {
    // Password disimpan sebagai SHA-256 hash (bukan plain text)
    // hashPassword() tersedia di scope global GAS dari code.gs
    var users = [
      ['USR-001', 'owner',     hashPassword('owner123'),   'Bapak Direktur Owner',      'Owner',             'Aktif'],
      ['USR-002', 'bendahara', hashPassword('kas123'),     'Ibu Siti Bendahara',         'Bendahara',         'Aktif'],
      ['USR-003', 'produksi',  hashPassword('prod123'),    'Ahmad Supervisor Produksi',  'Bagian Produksi',   'Aktif'],
      ['USR-004', 'kasir1',    hashPassword('kasir123'),   'Rina Kasir Utama',           'Bagian Penjualan',  'Aktif'],
      ['USR-005', 'kasir2',    hashPassword('kasir456'),   'Dimas Kasir Cabang',         'Bagian Penjualan',  'Aktif'],
      ['USR-006', 'admin',     hashPassword('admin123'),   'Rudi Master Admin',          'Admin',             'Aktif'],
      ['USR-007', 'gudang',    hashPassword('gudang123'),  'Budi Kepala Gudang',         'Bagian Produksi',   'Aktif'],
      ['USR-008', 'sales',     hashPassword('sales123'),   'Fajar Sales Kanvas',         'Bagian Penjualan',  'Aktif'],
      ['USR-009', 'qc',        hashPassword('qc123'),      'Dewi Quality Control',       'Bagian Produksi',   'Aktif'],
      ['USR-010', 'auditor',   hashPassword('audit123'),   'Hendro Internal Auditor',    'Owner',             'Aktif']
    ];
    sheet.getRange(2, 1, users.length, users[0].length).setValues(users);
  }

  // 2. MASTER PRODUK (Produk) - 10 Item
  if (sheetName === 'Produk') {
    var produk = [
      ['PRD-001', 'Kripik Tempe Premium 250g', 'Pcs', '8500', '15000', '100', 'Aktif'],
      ['PRD-002', 'Kue Kacang Gurih 500g', 'Toples', '18000', '30000', '50', 'Aktif'],
      ['PRD-003', 'Sambal Bawang Botol 150g', 'Botol', '9000', '16000', '80', 'Aktif'],
      ['PRD-004', 'Keripik Singkong Pedas 200g', 'Pcs', '6000', '12000', '120', 'Aktif'],
      ['PRD-005', 'Abon Sapi Gurih 100g', 'Pouch', '22000', '35000', '40', 'Aktif'],
      ['PRD-006', 'Basreng Daun Jeruk 150g', 'Pcs', '7500', '14000', '150', 'Aktif'],
      ['PRD-007', 'Keripik Pisang Cokelat 200g', 'Pcs', '9500', '18000', '90', 'Aktif'],
      ['PRD-008', 'Bakpia Basah Isi Kacang Hijau', 'Kotak', '15000', '25000', '60', 'Aktif'],
      ['PRD-009', 'Makaroni Panggang Crispy 150g', 'Pcs', '5500', '11000', '100', 'Aktif'],
      ['PRD-010', 'Rengginang Ketan Hitam 250g', 'Toples', '12000', '22000', '50', 'Aktif']
    ];
    sheet.getRange(2, 1, produk.length, produk[0].length).setValues(produk);
  }

  // 3. MULTI-LOKASI STOK (StokLokasi) - 10 Produk
  if (sheetName === 'StokLokasi') {
    var stokLokasi = [
      ['PRD-001', 'Kripik Tempe Premium 250g', '150', '45', '20', 'Aman'],
      ['PRD-002', 'Kue Kacang Gurih 500g', '80', '15', '10', 'Aman'],
      ['PRD-003', 'Sambal Bawang Botol 150g', '120', '8', '15', 'Menipis'],
      ['PRD-004', 'Keripik Singkong Pedas 200g', '200', '50', '25', 'Aman'],
      ['PRD-005', 'Abon Sapi Gurih 100g', '60', '12', '15', 'Menipis'],
      ['PRD-006', 'Basreng Daun Jeruk 150g', '180', '65', '30', 'Aman'],
      ['PRD-007', 'Keripik Pisang Cokelat 200g', '95', '25', '20', 'Aman'],
      ['PRD-008', 'Bakpia Basah Isi Kacang Hijau', '40', '5', '10', 'Menipis'],
      ['PRD-009', 'Makaroni Panggang Crispy 150g', '140', '40', '20', 'Aman'],
      ['PRD-010', 'Rengginang Ketan Hitam 250g', '70', '18', '15', 'Aman']
    ];
    sheet.getRange(2, 1, stokLokasi.length, stokLokasi[0].length).setValues(stokLokasi);
  }

  // 4. BAHAN BAKU PRODUKSI (BahanBaku) - 10 Bahan
  if (sheetName === 'BahanBaku') {
    var bahan = [
      ['BHN-001', 'Kedelai Super Sortir', 'Kg', '250', '12500', 'CV Sumber Pangan', dateOnlyStr],
      ['BHN-002', 'Minyak Goreng Kelapa', 'Liter', '120', '17000', 'PT Nabati Jaya', dateOnlyStr],
      ['BHN-003', 'Tepung Bumbu Racik', 'Kg', '85', '9500', 'Toko Berkah Tepung', dateOnlyStr],
      ['BHN-004', 'Standing Pouch Sablon', 'Pcs', '800', '850', 'Prima Packaging', dateOnlyStr],
      ['BHN-005', 'Bawang Merah Brebes', 'Kg', '45', '28000', 'Tani Makmur Perkasa', dateOnlyStr],
      ['BHN-006', 'Cabai Rawit Merah', 'Kg', '18', '42000', 'Pasar Induk Sayur', dateOnlyStr],
      ['BHN-007', 'Daging Sapi Gandik Segar', 'Kg', '30', '115000', 'RPA Berkah Daging', dateOnlyStr],
      ['BHN-008', 'Pisang Kepok Kuning', 'Sisir', '50', '14000', 'Petani Pisang Mandiri', dateOnlyStr],
      ['BHN-009', 'Cokelat Bubuk Glaze', 'Kg', '25', '48000', 'CV Cokelat Nusantara', dateOnlyStr],
      ['BHN-010', 'Kacang Tanah Tuban Kupas', 'Kg', '60', '26000', 'Gudang Hasil Bumi', dateOnlyStr]
    ];
    sheet.getRange(2, 1, bahan.length, bahan[0].length).setValues(bahan);
  }

  // 5. MITRA PELANGGAN & TOKO REKANAN (PelangganToko) - 10 Mitra
  if (sheetName === 'PelangganToko') {
    var toko = [
      ['CUST-001', 'Toko Oleh-Oleh Barokah', '081234567890', 'Jl. Malioboro No. 45, Yogyakarta', '4500000', '750000', 'Aktif'],
      ['CUST-002', 'Minimarket Sentosa', '085678901234', 'Jl. Sudirman No. 12, Solo', '8200000', '1200000', 'Aktif'],
      ['CUST-003', 'Pelanggan Umum Kasir', '-', 'Walk-in Retail Customer', '3500000', '0', 'Aktif'],
      ['CUST-004', 'Toko Sentra Kuliner Nusantara', '081987654321', 'Jl. Pandanaran No. 88, Semarang', '6100000', '900000', 'Aktif'],
      ['CUST-005', 'Supermarket Mega Rasa', '082134567891', 'Jl. Slamet Riyadi No. 101, Surakarta', '11500000', '0', 'Aktif'],
      ['CUST-006', 'Agen Snack Bu Siti', '081398761234', 'Pasar Klewer Kios B-14', '5400000', '650000', 'Aktif'],
      ['CUST-007', 'Warung Berkah Abadi', '087812345678', 'Jl. Veteran No. 34, Boyolali', '2900000', '0', 'Aktif'],
      ['CUST-008', 'Koperasi Karyawan Sejahtera', '081567890123', 'Kawasan Industri Rungkut', '4800000', '800000', 'Aktif'],
      ['CUST-009', 'Toko Roti & Snack Kurnia', '082245678901', 'Jl. Pemuda No. 76, Magelang', '3750000', '0', 'Aktif'],
      ['CUST-010', 'Depot Pusat Rasa', '081876543210', 'Jl. Gajah Mada No. 55, Salatiga', '4200000', '450000', 'Aktif']
    ];
    sheet.getRange(2, 1, toko.length, toko[0].length).setValues(toko);
  }

  // 6. TRANSAKSI POS KASIR (Penjualan) - 10 Transaksi
  if (sheetName === 'Penjualan') {
    var sales = [
      ['TRX-20260905-0001', nowStr, 'CUST-003', 'Pelanggan Umum Kasir', '[{"produkId":"PRD-001","namaProduk":"Kripik Tempe Premium 250g","qty":2,"harga":15000,"subtotal":30000}]', '30000', '0', '30000', 'Tunai', 'Lunas', 'Rina Kasir Utama'],
      ['TRX-20260905-0002', nowStr, 'CUST-001', 'Toko Oleh-Oleh Barokah', '[{"produkId":"PRD-002","namaProduk":"Kue Kacang Gurih 500g","qty":10,"harga":30000,"subtotal":300000}]', '300000', '15000', '285000', 'Tempo', 'Belum Lunas', 'Rina Kasir Utama'],
      ['TRX-20260905-0003', nowStr, 'CUST-003', 'Pelanggan Umum Kasir', '[{"produkId":"PRD-003","namaProduk":"Sambal Bawang Botol 150g","qty":3,"harga":16000,"subtotal":48000}]', '48000', '0', '48000', 'Tunai', 'Lunas', 'Dimas Kasir Cabang'],
      ['TRX-20260905-0004', nowStr, 'CUST-002', 'Minimarket Sentosa', '[{"produkId":"PRD-004","namaProduk":"Keripik Singkong Pedas 200g","qty":20,"harga":12000,"subtotal":240000}]', '240000', '10000', '230000', 'Tempo', 'Belum Lunas', 'Rina Kasir Utama'],
      ['TRX-20260905-0005', nowStr, 'CUST-003', 'Pelanggan Umum Kasir', '[{"produkId":"PRD-006","namaProduk":"Basreng Daun Jeruk 150g","qty":5,"harga":14000,"subtotal":70000}]', '70000', '0', '70000', 'Tunai', 'Lunas', 'Dimas Kasir Cabang'],
      ['TRX-20260905-0006', nowStr, 'CUST-004', 'Toko Sentra Kuliner Nusantara', '[{"produkId":"PRD-005","namaProduk":"Abon Sapi Gurih 100g","qty":8,"harga":35000,"subtotal":280000}]', '280000', '10000', '270000', 'Tempo', 'Belum Lunas', 'Rina Kasir Utama'],
      ['TRX-20260905-0007', nowStr, 'CUST-003', 'Pelanggan Umum Kasir', '[{"produkId":"PRD-007","namaProduk":"Keripik Pisang Cokelat 200g","qty":4,"harga":18000,"subtotal":72000}]', '72000', '0', '72000', 'Tunai', 'Lunas', 'Dimas Kasir Cabang'],
      ['TRX-20260905-0008', nowStr, 'CUST-005', 'Supermarket Mega Rasa', '[{"produkId":"PRD-008","namaProduk":"Bakpia Basah Isi Kacang Hijau","qty":15,"harga":25000,"subtotal":375000}]', '375000', '25000', '350000', 'Tunai', 'Lunas', 'Rina Kasir Utama'],
      ['TRX-20260905-0009', nowStr, 'CUST-003', 'Pelanggan Umum Kasir', '[{"produkId":"PRD-009","namaProduk":"Makaroni Panggang Crispy 150g","qty":6,"harga":11000,"subtotal":66000}]', '66000', '0', '66000', 'Tunai', 'Lunas', 'Dimas Kasir Cabang'],
      ['TRX-20260905-0010', nowStr, 'CUST-006', 'Agen Snack Bu Siti', '[{"produkId":"PRD-010","namaProduk":"Rengginang Ketan Hitam 250g","qty":10,"harga":22000,"subtotal":220000}]', '220000', '10000', '210000', 'Tempo', 'Belum Lunas', 'Rina Kasir Utama']
    ];
    sheet.getRange(2, 1, sales.length, sales[0].length).setValues(sales);
  }

  // 7. BATCH MANUFAKTUR PRODUKSI & HPP (Produksi) - 10 Batch
  if (sheetName === 'Produksi') {
    var prod = [
      ['PRD-BATCH-20260905-0001', nowStr, 'PRD-001', 'Kripik Tempe Premium 250g', '100', '2', '98', '450000', '85000', '50000', '96000', '681000', '6949', 'Pekerja harian'],
      ['PRD-BATCH-20260905-0002', nowStr, 'PRD-002', 'Kue Kacang Gurih 500g', '50', '1', '49', '520000', '65000', '45000', '80000', '710000', '14490', 'Karyawan tetap'],
      ['PRD-BATCH-20260905-0003', nowStr, 'PRD-003', 'Sambal Bawang Botol 150g', '80', '3', '77', '380000', '72000', '40000', '70000', '562000', '7299', 'Pekerja harian'],
      ['PRD-BATCH-20260905-0004', nowStr, 'PRD-004', 'Keripik Singkong Pedas 200g', '120', '2', '118', '360000', '60000', '40000', '85000', '545000', '4619', 'Pekerja per jam'],
      ['PRD-BATCH-20260905-0005', nowStr, 'PRD-005', 'Abon Sapi Gurih 100g', '40', '1', '39', '680000', '45000', '50000', '90000', '865000', '22179', 'Karyawan tetap'],
      ['PRD-BATCH-20260905-0006', nowStr, 'PRD-006', 'Basreng Daun Jeruk 150g', '150', '4', '146', '540000', '80000', '45000', '95000', '760000', '5205', 'Pekerja harian'],
      ['PRD-BATCH-20260905-0007', nowStr, 'PRD-007', 'Keripik Pisang Cokelat 200g', '90', '2', '88', '480000', '70000', '40000', '80000', '670000', '7614', 'Pekerja harian'],
      ['PRD-BATCH-20260905-0008', nowStr, 'PRD-008', 'Bakpia Basah Isi Kacang Hijau', '60', '3', '57', '420000', '65000', '35000', '85000', '605000', '10614', 'Owner/sendiri'],
      ['PRD-BATCH-20260905-0009', nowStr, 'PRD-009', 'Makaroni Panggang Crispy 150g', '100', '2', '98', '310000', '55000', '30000', '75000', '470000', '4796', 'Pekerja per jam'],
      ['PRD-BATCH-20260905-0010', nowStr, 'PRD-010', 'Rengginang Ketan Hitam 250g', '50', '1', '49', '340000', '50000', '35000', '70000', '495000', '10102', 'Pekerja harian']
    ];
    sheet.getRange(2, 1, prod.length, prod[0].length).setValues(prod);
  }

  // 8. BUKU KAS & ARUS KEUANGAN (KeuanganKas) - 10 Transaksi Kronologis
  if (sheetName === 'KeuanganKas') {
    var kas = [
      ['KAS-20260905-0001', nowStr, 'Masuk', 'Modal Awal', '15000000', 'Saldo Kas Awal Operasional', 'INIT', '15000000', 'Owner'],
      ['KAS-20260905-0002', nowStr, 'Keluar', 'Beli Bahan Baku', '1250000', 'Pembelian Kedelai Super 100kg', 'BHN-001', '13750000', 'Bendahara'],
      ['KAS-20260905-0003', nowStr, 'Keluar', 'Beli Kemasan', '680000', 'Beli Standing Pouch 800 pcs', 'BHN-004', '13070000', 'Bendahara'],
      ['KAS-20260905-0004', nowStr, 'Masuk', 'Penjualan POS', '30000', 'Penjualan Retail TRX-20260905-0001', 'TRX-20260905-0001', '13100000', 'Rina Kasir Utama'],
      ['KAS-20260905-0005', nowStr, 'Masuk', 'Penjualan POS', '48000', 'Penjualan Retail TRX-20260905-0003', 'TRX-20260905-0003', '13148000', 'Dimas Kasir Cabang'],
      ['KAS-20260905-0006', nowStr, 'Keluar', 'Listrik & Gas Operasional', '350000', 'Pengisian Token Listrik Pabrik & Gas LPG', 'EXP-UTIL', '12798000', 'Bendahara'],
      ['KAS-20260905-0007', nowStr, 'Masuk', 'Penjualan POS', '70000', 'Penjualan Retail TRX-20260905-0005', 'TRX-20260905-0005', '12868000', 'Dimas Kasir Cabang'],
      ['KAS-20260905-0008', nowStr, 'Masuk', 'Penjualan POS', '350000', 'Penjualan Grosir TRX-20260905-0008', 'TRX-20260905-0008', '13218000', 'Rina Kasir Utama'],
      ['KAS-20260905-0009', nowStr, 'Keluar', 'Upah Tenaga Kerja', '450000', 'Pembayaran Upah Harian Produksi Shift 1', 'WAGE-P1', '12768000', 'Bendahara'],
      ['KAS-20260905-0010', nowStr, 'Masuk', 'Pelunasan Piutang Toko', '500000', 'Cicilan Piutang Toko Barokah', 'PIU-001', '13268000', 'Bendahara']
    ];
    sheet.getRange(2, 1, kas.length, kas[0].length).setValues(kas);
  }

  // 9. PRESENSI & UPAH TENAGA KERJA (TenagaKerja) - 10 Pekerja
  if (sheetName === 'TenagaKerja') {
    var tk = [
      ['TK-20260905-0001', 'Supriadi', 'Pekerja harian', dateOnlyStr, '08:00', '16:00', '8', '12000', '0', '10000', '0', '0', '106000', 'Lunas'],
      ['TK-20260905-0002', 'Bambang Hartono', 'Pekerja harian', dateOnlyStr, '08:00', '17:00', '9', '12000', '15000', '0', '0', '0', '123000', 'Lunas'],
      ['TK-20260905-0003', 'Nur Hayati', 'Karyawan tetap', dateOnlyStr, '08:00', '16:00', '8', '15000', '0', '15000', '0', '0', '135000', 'Lunas'],
      ['TK-20260905-0004', 'Wahyudi Pratama', 'Pekerja per jam', dateOnlyStr, '10:00', '16:00', '6', '12000', '0', '0', '0', '0', '72000', 'Lunas'],
      ['TK-20260905-0005', 'Sri Mulyani', 'Pekerja harian', dateOnlyStr, '08:00', '16:00', '8', '12000', '0', '0', '0', '20000', '76000', 'Lunas'],
      ['TK-20260905-0006', 'Joko Susilo', 'Pekerja harian', dateOnlyStr, '08:00', '18:00', '10', '12000', '30000', '10000', '0', '0', '160000', 'Lunas'],
      ['TK-20260905-0007', 'Endang Lestari', 'Karyawan tetap', dateOnlyStr, '08:00', '16:00', '8', '15000', '0', '0', '0', '0', '120000', 'Lunas'],
      ['TK-20260905-0008', 'Agus Setiawan', 'Pekerja per jam', dateOnlyStr, '08:00', '13:00', '5', '12000', '0', '5000', '0', '0', '65000', 'Lunas'],
      ['TK-20260905-0009', 'Tri Wahyuni', 'Pekerja harian', dateOnlyStr, '08:00', '16:00', '8', '12000', '0', '0', '5000', '0', '91000', 'Lunas'],
      ['TK-20260905-0010', 'Ahmad Dani', 'Pekerja harian', dateOnlyStr, '08:00', '16:00', '8', '12000', '0', '10000', '0', '0', '106000', 'Lunas']
    ];
    sheet.getRange(2, 1, tk.length, tk[0].length).setValues(tk);
  }

  // 10. MONITORING HUTANG & PIUTANG (HutangPiutang) - 10 Record (Sinkron Alert H-3)
  if (sheetName === 'HutangPiutang') {
    var hp = [
      ['PIU-001', '01/09/2026', 'Piutang', 'Toko Oleh-Oleh Barokah', '750000', '0', '750000', '07/09/2026', 'Belum Lunas'],
      ['PIU-002', '02/09/2026', 'Piutang', 'Minimarket Sentosa', '1200000', '0', '1200000', '08/09/2026', 'Belum Lunas'],
      ['PIU-003', '03/09/2026', 'Piutang', 'Toko Sentra Kuliner Nusantara', '900000', '0', '900000', '06/09/2026', 'Belum Lunas'],
      ['PIU-004', '04/09/2026', 'Piutang', 'Agen Snack Bu Siti', '650000', '0', '650000', '11/09/2026', 'Belum Lunas'],
      ['PIU-005', '04/09/2026', 'Piutang', 'Koperasi Karyawan Sejahtera', '800000', '0', '800000', '12/09/2026', 'Belum Lunas'],
      ['PIU-006', '05/09/2026', 'Piutang', 'Depot Pusat Rasa', '450000', '0', '450000', '07/09/2026', 'Belum Lunas'],
      ['HTG-001', '28/08/2026', 'Hutang', 'CV Sumber Pangan (Kedelai)', '2500000', '1000000', '1500000', '06/09/2026', 'Belum Lunas'],
      ['HTG-002', '30/08/2026', 'Hutang', 'PT Nabati Jaya (Minyak)', '1800000', '0', '1800000', '08/09/2026', 'Belum Lunas'],
      ['HTG-003', '01/09/2026', 'Hutang', 'Prima Packaging (Kemasan)', '950000', '0', '950000', '15/09/2026', 'Belum Lunas'],
      ['HTG-004', '02/09/2026', 'Hutang', 'RPA Berkah Daging (Daging Sapi)', '2300000', '1000000', '1300000', '07/09/2026', 'Belum Lunas']
    ];
    sheet.getRange(2, 1, hp.length, hp[0].length).setValues(hp);
  }

  // 11. STOCK OPNAME FISIK (StockOpname) - 10 Audit
  if (sheetName === 'StockOpname') {
    var opname = [
      ['OPN-20260905-0001', nowStr, 'PRD-001', 'Kripik Tempe Premium 250g', 'Etalase Toko', '45', '45', '0', 'Audit fisik harian cocok', 'Hendro Auditor'],
      ['OPN-20260905-0002', nowStr, 'PRD-002', 'Kue Kacang Gurih 500g', 'Etalase Toko', '16', '15', '-1', '1 toples pecah di display', 'Hendro Auditor'],
      ['OPN-20260905-0003', nowStr, 'PRD-003', 'Sambal Bawang Botol 150g', 'Etalase Toko', '8', '8', '0', 'Stok etalase pas', 'Hendro Auditor'],
      ['OPN-20260905-0004', nowStr, 'PRD-004', 'Keripik Singkong Pedas 200g', 'Gudang Produksi', '200', '200', '0', 'Stok gudang cocok', 'Dewi Quality Control'],
      ['OPN-20260905-0005', nowStr, 'PRD-005', 'Abon Sapi Gurih 100g', 'Etalase Toko', '12', '12', '0', 'Sesuai catatan sistem', 'Hendro Auditor'],
      ['OPN-20260905-0006', nowStr, 'PRD-006', 'Basreng Daun Jeruk 150g', 'Etalase Toko', '65', '65', '0', 'Stok fisik aman', 'Hendro Auditor'],
      ['OPN-20260905-0007', nowStr, 'PRD-007', 'Keripik Pisang Cokelat 200g', 'Gudang Produksi', '95', '95', '0', 'Kondisi kemasan rapi', 'Dewi Quality Control'],
      ['OPN-20260905-0008', nowStr, 'PRD-008', 'Bakpia Basah Isi Kacang Hijau', 'Etalase Toko', '6', '5', '-1', '1 kotak kadaluarsa display', 'Hendro Auditor'],
      ['OPN-20260905-0009', nowStr, 'PRD-009', 'Makaroni Panggang Crispy 150g', 'Etalase Toko', '40', '40', '0', 'Stok etalase cocok', 'Hendro Auditor'],
      ['OPN-20260905-0010', nowStr, 'PRD-010', 'Rengginang Ketan Hitam 250g', 'Gudang Produksi', '70', '70', '0', 'Sesuai hitungan batch', 'Dewi Quality Control']
    ];
    sheet.getRange(2, 1, opname.length, opname[0].length).setValues(opname);
  }

  // 12. LOG TRANSFER STOK INTERNAL (MutasiLokasi) - 10 Mutasi
  if (sheetName === 'MutasiLokasi') {
    var mutasi = [
      ['MUT-20260905-0001', nowStr, 'PRD-001', 'Kripik Tempe Premium 250g', 'Gudang Produksi', 'Etalase Toko', '25', 'Budi Gudang', 'Restok etalase pagi'],
      ['MUT-20260905-0002', nowStr, 'PRD-002', 'Kue Kacang Gurih 500g', 'Gudang Produksi', 'Etalase Toko', '10', 'Budi Gudang', 'Restok rak toples'],
      ['MUT-20260905-0003', nowStr, 'PRD-003', 'Sambal Bawang Botol 150g', 'Gudang Produksi', 'Etalase Toko', '15', 'Budi Gudang', 'Restok rak botol'],
      ['MUT-20260905-0004', nowStr, 'PRD-004', 'Keripik Singkong Pedas 200g', 'Gudang Produksi', 'Etalase Toko', '30', 'Budi Gudang', 'Pengisian display depan'],
      ['MUT-20260905-0005', nowStr, 'PRD-005', 'Abon Sapi Gurih 100g', 'Gudang Produksi', 'Etalase Toko', '10', 'Budi Gudang', 'Restok etalase premium'],
      ['MUT-20260905-0006', nowStr, 'PRD-006', 'Basreng Daun Jeruk 150g', 'Gudang Produksi', 'Etalase Toko', '40', 'Budi Gudang', 'Restok persiapan weekend'],
      ['MUT-20260905-0007', nowStr, 'PRD-007', 'Keripik Pisang Cokelat 200g', 'Gudang Produksi', 'Etalase Toko', '20', 'Budi Gudang', 'Restok rak snack manis'],
      ['MUT-20260905-0008', nowStr, 'PRD-008', 'Bakpia Basah Isi Kacang Hijau', 'Gudang Produksi', 'Etalase Toko', '15', 'Budi Gudang', 'Restok fresh bakery'],
      ['MUT-20260905-0009', nowStr, 'PRD-009', 'Makaroni Panggang Crispy 150g', 'Gudang Produksi', 'Etalase Toko', '25', 'Budi Gudang', 'Restok etalase kasir'],
      ['MUT-20260905-0010', nowStr, 'PRD-010', 'Rengginang Ketan Hitam 250g', 'Gudang Produksi', 'Etalase Toko', '10', 'Budi Gudang', 'Restok rak toples']
    ];
    sheet.getRange(2, 1, mutasi.length, mutasi[0].length).setValues(mutasi);
  }

  // 13. AUDIT TRAIL SENSITIF (AuditTrail) - 10 Log
  if (sheetName === 'AuditTrail') {
    var audit = [
      ['LOG-20260905-0001', nowStr, 'USR-001', 'Bapak Direktur Owner', 'Autentikasi', 'LOGIN', '-', 'Sukses', 'Login awal sistem dari Web App'],
      ['LOG-20260905-0002', nowStr, 'USR-006', 'Rudi Master Admin', 'MasterProduk', 'TAMBAH', '-', 'PRD-001', 'Pendaftaran produk Kripik Tempe Premium'],
      ['LOG-20260905-0003', nowStr, 'USR-003', 'Ahmad Supervisor Produksi', 'Produksi', 'BATCH_SELESAI', '-', 'PRD-BATCH-20260905-0001', 'Hasil bersih: 98 pcs. HPP: Rp 6949'],
      ['LOG-20260905-0004', nowStr, 'USR-007', 'Budi Kepala Gudang', 'MultiLokasi', 'TRANSFER_STOK', 'Gudang -> Etalase', '25', 'Transfer Kripik Tempe 25 pcs'],
      ['LOG-20260905-0005', nowStr, 'USR-004', 'Rina Kasir Utama', 'POS', 'TRANSAKSI_BARU', '-', 'TRX-20260905-0001', 'Penjualan tunai kasir Rp 30000'],
      ['LOG-20260905-0006', nowStr, 'USR-002', 'Ibu Siti Bendahara', 'Kas', 'MANUAL_KELUAR', '-', '1250000', 'Beli bahan baku kedelai 100kg'],
      ['LOG-20260905-0007', nowStr, 'USR-010', 'Hendro Internal Auditor', 'StockOpname', 'ADJUST_STOK', '16', '15', 'Penyesuaian selisih Kue Kacang pecah 1 toples'],
      ['LOG-20260905-0008', nowStr, 'USR-004', 'Rina Kasir Utama', 'HutangPiutang', 'PIUTANG_BARU', '-', 'PIU-001', 'Pencatatan tagihan tempo Toko Barokah Rp 750000'],
      ['LOG-20260905-0009', nowStr, 'USR-002', 'Ibu Siti Bendahara', 'TenagaKerja', 'BAYAR_UPAH', '-', '450000', 'Pelunasan upah harian shift 1'],
      ['LOG-20260905-0010', nowStr, 'USR-002', 'Ibu Siti Bendahara', 'HutangPiutang', 'QUICK_PAY', '750000', '250000', 'Verifikasi cicilan piutang Toko Barokah']
    ];
    sheet.getRange(2, 1, audit.length, audit[0].length).setValues(audit);
  }
}

/**
 * OPSI KHUSUS: Reset dan Muat Ulang Database dengan 10 Data Dummy Bersih
 * Peringatan: Hanya jalankan fungsi ini jika Anda ingin mengosongkan data lama untuk uji coba!
 */
function resetDatabaseWithDummy() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = Object.keys(SCHEMA_DEFINITIONS);

  sheetNames.forEach(function(sName) {
    var sh = ss.getSheetByName(sName);
    if (sh) {
      sh.clear();
      var expectedHeaders = SCHEMA_DEFINITIONS[sName];
      sh.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
      formatHeaderRow(sh, expectedHeaders.length);
      seedTenDummyRecords(sh, sName);
    }
  });

  SpreadsheetApp.flush();
  Logger.log('Semua tabel telah di-reset dan diisi 10 data dummy sinkron.');
  return 'Reset Selesai: 10 Data Dummy Sinkron Berhasil Dimuat.';
}