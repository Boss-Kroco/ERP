-- ============================================================================
-- BOS KROCO ERP - SEED DATA RESMI DARI SETUP.GS
-- Total 10 Record Realistis & Terintegrasi per Tabel
-- ============================================================================

-- Bersihkan data lama jika ada
TRUNCATE TABLE audit_trail, mutasi_lokasi, stock_opname, hutang_piutang,
               tenaga_kerja, keuangan_kas, produksi, penjualan,
               pelanggan_toko, bahan_baku, stok_lokasi, produk, users CASCADE;

-- 1. USERS
INSERT INTO users (user_id, username, password, nama_lengkap, role, status) VALUES
('USR-001', 'owner', '43a0d17178a9d26c9e0fe9a74b0b45e38d32f27aed887a008a54bf6e033bf7b9', 'Bapak Direktur Owner', 'Owner', 'Aktif'),
('USR-002', 'bendahara', '896815d7a569bdafc83f62e618fc3453c045f622dbf2af962a0eff0a54121d51', 'Ibu Siti Bendahara', 'Bendahara', 'Aktif'),
('USR-003', 'produksi', '97f08b12c985e818cb86cd3d6f7c4dec65a586d95874ce54db426d20d383ab2a', 'Ahmad Supervisor Produksi', 'Bagian Produksi', 'Aktif'),
('USR-004', 'kasir1', 'f02b7c1e519e4fa436147f7e1399974f9510aa9c8e0cb8be29151eb540f9d214', 'Rina Kasir Utama', 'Bagian Penjualan', 'Aktif'),
('USR-005', 'kasir2', 'b00e26ab12912e6d41bb9d69cc79a2592f95f260a800fbf8df8b5b67ed5d1438', 'Dimas Kasir Cabang', 'Bagian Penjualan', 'Aktif'),
('USR-006', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Rudi Master Admin', 'Admin', 'Aktif'),
('USR-007', 'gudang', '1a62eac618f519df0f710271f67285afe8bab689f9c7d902157c50a9c90f4f9e', 'Budi Kepala Gudang', 'Bagian Produksi', 'Aktif'),
('USR-008', 'sales', '6bc0a63cb29c92306020c0a6bbc358cc4628db277dc06e253535e126517ad637', 'Fajar Sales Kanvas', 'Bagian Penjualan', 'Aktif'),
('USR-009', 'qc', '9d7248aac3d2459c349d2e1e132a5c64b5decb30c04b41b27eea3277260c55b9', 'Dewi Quality Control', 'Bagian Produksi', 'Aktif'),
('USR-010', 'auditor', '0b26f7caa1c2e5e3f11adfd22f47403ed214a1d4451117a18ea726b451a3aa61', 'Hendro Internal Auditor', 'Owner', 'Aktif');

-- 2. PRODUK
INSERT INTO produk (produk_id, nama_produk, satuan, harga_beli_hpp, harga_jual, target_produksi, status) VALUES
('PRD-001', 'Kripik Tempe Premium 250g', 'Pcs', 8500, 15000, 100, 'Aktif'),
('PRD-002', 'Kue Kacang Gurih 500g', 'Toples', 18000, 30000, 50, 'Aktif'),
('PRD-003', 'Sambal Bawang Botol 150g', 'Botol', 9000, 16000, 80, 'Aktif'),
('PRD-004', 'Keripik Singkong Pedas 200g', 'Pcs', 6000, 12000, 120, 'Aktif'),
('PRD-005', 'Abon Sapi Gurih 100g', 'Pouch', 22000, 35000, 40, 'Aktif'),
('PRD-006', 'Basreng Daun Jeruk 150g', 'Pcs', 7500, 14000, 150, 'Aktif'),
('PRD-007', 'Keripik Pisang Cokelat 200g', 'Pcs', 9500, 18000, 90, 'Aktif'),
('PRD-008', 'Bakpia Basah Isi Kacang Hijau', 'Kotak', 15000, 25000, 60, 'Aktif'),
('PRD-009', 'Makaroni Panggang Crispy 150g', 'Pcs', 5500, 11000, 100, 'Aktif'),
('PRD-010', 'Rengginang Ketan Hitam 250g', 'Toples', 12000, 22000, 50, 'Aktif');

-- 3. STOK LOKASI
INSERT INTO stok_lokasi (produk_id, nama_produk, gudang_produksi, etalase_toko, batas_minimum, status) VALUES
('PRD-001', 'Kripik Tempe Premium 250g', 150, 45, 20, 'Aman'),
('PRD-002', 'Kue Kacang Gurih 500g', 80, 15, 10, 'Aman'),
('PRD-003', 'Sambal Bawang Botol 150g', 120, 8, 15, 'Menipis'),
('PRD-004', 'Keripik Singkong Pedas 200g', 200, 50, 25, 'Aman'),
('PRD-005', 'Abon Sapi Gurih 100g', 60, 12, 15, 'Menipis'),
('PRD-006', 'Basreng Daun Jeruk 150g', 180, 65, 30, 'Aman'),
('PRD-007', 'Keripik Pisang Cokelat 200g', 95, 25, 20, 'Aman'),
('PRD-008', 'Bakpia Basah Isi Kacang Hijau', 40, 5, 10, 'Menipis'),
('PRD-009', 'Makaroni Panggang Crispy 150g', 140, 40, 20, 'Aman'),
('PRD-010', 'Rengginang Ketan Hitam 250g', 70, 18, 15, 'Aman');

-- 4. BAHAN BAKU
INSERT INTO bahan_baku (bahan_id, nama_bahan, satuan, stok, harga_beli, supplier, terakhir_beli) VALUES
('BHN-001', 'Kedelai Super Sortir', 'Kg', 250, 12500, 'CV Sumber Pangan', '05/09/2026'),
('BHN-002', 'Minyak Goreng Kelapa', 'Liter', 120, 17000, 'PT Nabati Jaya', '05/09/2026'),
('BHN-003', 'Tepung Bumbu Racik', 'Kg', 85, 9500, 'Toko Berkah Tepung', '05/09/2026'),
('BHN-004', 'Standing Pouch Sablon', 'Pcs', 800, 850, 'Prima Packaging', '05/09/2026'),
('BHN-005', 'Bawang Merah Brebes', 'Kg', 45, 28000, 'Tani Makmur Perkasa', '05/09/2026'),
('BHN-006', 'Cabai Rawit Merah', 'Kg', 18, 42000, 'Pasar Induk Sayur', '05/09/2026'),
('BHN-007', 'Daging Sapi Gandik Segar', 'Kg', 30, 115000, 'RPA Berkah Daging', '05/09/2026'),
('BHN-008', 'Pisang Kepok Kuning', 'Sisir', 50, 14000, 'Petani Pisang Mandiri', '05/09/2026'),
('BHN-009', 'Cokelat Bubuk Glaze', 'Kg', 25, 48000, 'CV Cokelat Nusantara', '05/09/2026'),
('BHN-010', 'Kacang Tanah Tuban Kupas', 'Kg', 60, 26000, 'Gudang Hasil Bumi', '05/09/2026');

-- 5. PELANGGAN TOKO
INSERT INTO pelanggan_toko (pelanggan_id, nama_toko, kontak, alamat, total_beli, total_piutang, status) VALUES
('CUST-001', 'Toko Oleh-Oleh Barokah', '081234567890', 'Jl. Malioboro No. 45, Yogyakarta', 4500000, 750000, 'Aktif'),
('CUST-002', 'Minimarket Sentosa', '085678901234', 'Jl. Sudirman No. 12, Solo', 8200000, 1200000, 'Aktif'),
('CUST-003', 'Pelanggan Umum Kasir', '-', 'Walk-in Retail Customer', 3500000, 0, 'Aktif'),
('CUST-004', 'Toko Sentra Kuliner Nusantara', '081987654321', 'Jl. Pandanaran No. 88, Semarang', 6100000, 900000, 'Aktif'),
('CUST-005', 'Supermarket Mega Rasa', '082134567891', 'Jl. Slamet Riyadi No. 101, Surakarta', 11500000, 0, 'Aktif'),
('CUST-006', 'Agen Snack Bu Siti', '081398761234', 'Pasar Klewer Kios B-14', 5400000, 650000, 'Aktif'),
('CUST-007', 'Warung Berkah Abadi', '087812345678', 'Jl. Veteran No. 34, Boyolali', 2900000, 0, 'Aktif'),
('CUST-008', 'Koperasi Karyawan Sejahtera', '081567890123', 'Kawasan Industri Rungkut', 4800000, 800000, 'Aktif'),
('CUST-009', 'Toko Roti & Snack Kurnia', '082245678901', 'Jl. Pemuda No. 76, Magelang', 3750000, 0, 'Aktif'),
('CUST-010', 'Depot Pusat Rasa', '081876543210', 'Jl. Gajah Mada No. 55, Salatiga', 4200000, 450000, 'Aktif');

-- 6. PENJUALAN
INSERT INTO penjualan (trx_id, tanggal, pelanggan_id, nama_pelanggan, item_list_json, total_gross, diskon, total_net, metode_bayar, status_bayar, kasir) VALUES
('TRX-20260905-0001', '05/09/2026 10:00:00', 'CUST-003', 'Pelanggan Umum Kasir', '[{"produkId":"PRD-001","namaProduk":"Kripik Tempe Premium 250g","qty":2,"harga":15000,"subtotal":30000}]'::jsonb, 30000, 0, 30000, 'Tunai', 'Lunas', 'Rina Kasir Utama'),
('TRX-20260905-0002', '05/09/2026 10:00:00', 'CUST-001', 'Toko Oleh-Oleh Barokah', '[{"produkId":"PRD-002","namaProduk":"Kue Kacang Gurih 500g","qty":10,"harga":30000,"subtotal":300000}]'::jsonb, 300000, 15000, 285000, 'Tempo', 'Belum Lunas', 'Rina Kasir Utama'),
('TRX-20260905-0003', '05/09/2026 10:00:00', 'CUST-003', 'Pelanggan Umum Kasir', '[{"produkId":"PRD-003","namaProduk":"Sambal Bawang Botol 150g","qty":3,"harga":16000,"subtotal":48000}]'::jsonb, 48000, 0, 48000, 'Tunai', 'Lunas', 'Dimas Kasir Cabang'),
('TRX-20260905-0004', '05/09/2026 10:00:00', 'CUST-002', 'Minimarket Sentosa', '[{"produkId":"PRD-004","namaProduk":"Keripik Singkong Pedas 200g","qty":20,"harga":12000,"subtotal":240000}]'::jsonb, 240000, 10000, 230000, 'Tempo', 'Belum Lunas', 'Rina Kasir Utama'),
('TRX-20260905-0005', '05/09/2026 10:00:00', 'CUST-003', 'Pelanggan Umum Kasir', '[{"produkId":"PRD-006","namaProduk":"Basreng Daun Jeruk 150g","qty":5,"harga":14000,"subtotal":70000}]'::jsonb, 70000, 0, 70000, 'Tunai', 'Lunas', 'Dimas Kasir Cabang'),
('TRX-20260905-0006', '05/09/2026 10:00:00', 'CUST-004', 'Toko Sentra Kuliner Nusantara', '[{"produkId":"PRD-005","namaProduk":"Abon Sapi Gurih 100g","qty":8,"harga":35000,"subtotal":280000}]'::jsonb, 280000, 10000, 270000, 'Tempo', 'Belum Lunas', 'Rina Kasir Utama'),
('TRX-20260905-0007', '05/09/2026 10:00:00', 'CUST-003', 'Pelanggan Umum Kasir', '[{"produkId":"PRD-007","namaProduk":"Keripik Pisang Cokelat 200g","qty":4,"harga":18000,"subtotal":72000}]'::jsonb, 72000, 0, 72000, 'Tunai', 'Lunas', 'Dimas Kasir Cabang'),
('TRX-20260905-0008', '05/09/2026 10:00:00', 'CUST-005', 'Supermarket Mega Rasa', '[{"produkId":"PRD-008","namaProduk":"Bakpia Basah Isi Kacang Hijau","qty":15,"harga":25000,"subtotal":375000}]'::jsonb, 375000, 25000, 350000, 'Tunai', 'Lunas', 'Rina Kasir Utama'),
('TRX-20260905-0009', '05/09/2026 10:00:00', 'CUST-003', 'Pelanggan Umum Kasir', '[{"produkId":"PRD-009","namaProduk":"Makaroni Panggang Crispy 150g","qty":6,"harga":11000,"subtotal":66000}]'::jsonb, 66000, 0, 66000, 'Tunai', 'Lunas', 'Dimas Kasir Cabang'),
('TRX-20260905-0010', '05/09/2026 10:00:00', 'CUST-006', 'Agen Snack Bu Siti', '[{"produkId":"PRD-010","namaProduk":"Rengginang Ketan Hitam 250g","qty":10,"harga":22000,"subtotal":220000}]'::jsonb, 220000, 10000, 210000, 'Tempo', 'Belum Lunas', 'Rina Kasir Utama');

-- 7. PRODUKSI
INSERT INTO produksi (produksi_id, tanggal, produk_id, nama_produk, jml_rencana, jml_rusak, jml_bersih, biaya_bahan, biaya_kemasan, biaya_operasional, biaya_upah, total_hpp_batch, hpp_unit, tipe_tenaga_kerja) VALUES
('PRD-BATCH-20260905-0001', '05/09/2026 10:00:00', 'PRD-001', 'Kripik Tempe Premium 250g', 100, 2, 98, 450000, 85000, 50000, 96000, 681000, 6949, 'Pekerja harian'),
('PRD-BATCH-20260905-0002', '05/09/2026 10:00:00', 'PRD-002', 'Kue Kacang Gurih 500g', 50, 1, 49, 520000, 65000, 45000, 80000, 710000, 14490, 'Karyawan tetap'),
('PRD-BATCH-20260905-0003', '05/09/2026 10:00:00', 'PRD-003', 'Sambal Bawang Botol 150g', 80, 3, 77, 380000, 72000, 40000, 70000, 562000, 7299, 'Pekerja harian'),
('PRD-BATCH-20260905-0004', '05/09/2026 10:00:00', 'PRD-004', 'Keripik Singkong Pedas 200g', 120, 2, 118, 360000, 60000, 40000, 85000, 545000, 4619, 'Pekerja per jam'),
('PRD-BATCH-20260905-0005', '05/09/2026 10:00:00', 'PRD-005', 'Abon Sapi Gurih 100g', 40, 1, 39, 680000, 45000, 50000, 90000, 865000, 22179, 'Karyawan tetap'),
('PRD-BATCH-20260905-0006', '05/09/2026 10:00:00', 'PRD-006', 'Basreng Daun Jeruk 150g', 150, 4, 146, 540000, 80000, 45000, 95000, 760000, 5205, 'Pekerja harian'),
('PRD-BATCH-20260905-0007', '05/09/2026 10:00:00', 'PRD-007', 'Keripik Pisang Cokelat 200g', 90, 2, 88, 480000, 70000, 40000, 80000, 670000, 7614, 'Pekerja harian'),
('PRD-BATCH-20260905-0008', '05/09/2026 10:00:00', 'PRD-008', 'Bakpia Basah Isi Kacang Hijau', 60, 3, 57, 420000, 65000, 35000, 85000, 605000, 10614, 'Owner/sendiri'),
('PRD-BATCH-20260905-0009', '05/09/2026 10:00:00', 'PRD-009', 'Makaroni Panggang Crispy 150g', 100, 2, 98, 310000, 55000, 30000, 75000, 470000, 4796, 'Pekerja per jam'),
('PRD-BATCH-20260905-0010', '05/09/2026 10:00:00', 'PRD-010', 'Rengginang Ketan Hitam 250g', 50, 1, 49, 340000, 50000, 35000, 70000, 495000, 10102, 'Pekerja harian');

-- 8. KEUANGAN KAS
INSERT INTO keuangan_kas (kas_id, tanggal, tipe, kategori, nominal, keterangan, ref_id, saldo_berjalan, dicatat_oleh) VALUES
('KAS-20260905-0001', '05/09/2026 10:00:00', 'Masuk', 'Modal Awal', 15000000, 'Saldo Kas Awal Operasional', 'INIT', 15000000, 'Owner'),
('KAS-20260905-0002', '05/09/2026 10:00:00', 'Keluar', 'Beli Bahan Baku', 1250000, 'Pembelian Kedelai Super 100kg', 'BHN-001', 13750000, 'Bendahara'),
('KAS-20260905-0003', '05/09/2026 10:00:00', 'Keluar', 'Beli Kemasan', 680000, 'Beli Standing Pouch 800 pcs', 'BHN-004', 13070000, 'Bendahara'),
('KAS-20260905-0004', '05/09/2026 10:00:00', 'Masuk', 'Penjualan POS', 30000, 'Penjualan Retail TRX-20260905-0001', 'TRX-20260905-0001', 13100000, 'Rina Kasir Utama'),
('KAS-20260905-0005', '05/09/2026 10:00:00', 'Masuk', 'Penjualan POS', 48000, 'Penjualan Retail TRX-20260905-0003', 'TRX-20260905-0003', 13148000, 'Dimas Kasir Cabang'),
('KAS-20260905-0006', '05/09/2026 10:00:00', 'Keluar', 'Listrik & Gas Operasional', 350000, 'Pengisian Token Listrik Pabrik & Gas LPG', 'EXP-UTIL', 12798000, 'Bendahara'),
('KAS-20260905-0007', '05/09/2026 10:00:00', 'Masuk', 'Penjualan POS', 70000, 'Penjualan Retail TRX-20260905-0005', 'TRX-20260905-0005', 12868000, 'Dimas Kasir Cabang'),
('KAS-20260905-0008', '05/09/2026 10:00:00', 'Masuk', 'Penjualan POS', 350000, 'Penjualan Grosir TRX-20260905-0008', 'TRX-20260905-0008', 13218000, 'Rina Kasir Utama'),
('KAS-20260905-0009', '05/09/2026 10:00:00', 'Keluar', 'Upah Tenaga Kerja', 450000, 'Pembayaran Upah Harian Produksi Shift 1', 'WAGE-P1', 12768000, 'Bendahara'),
('KAS-20260905-0010', '05/09/2026 10:00:00', 'Masuk', 'Pelunasan Piutang Toko', 500000, 'Cicilan Piutang Toko Barokah', 'PIU-001', 13268000, 'Bendahara');

-- 9. TENAGA KERJA
INSERT INTO tenaga_kerja (pekerja_id, nama_pekerja, tipe_pekerja, tanggal, jam_masuk, jam_keluar, total_jam, upah_rate, lembur, bonus, potongan, kasbon, total_bayar, status_bayar) VALUES
('TK-20260905-0001', 'Supriadi', 'Pekerja harian', '05/09/2026', '08:00', '16:00', 8, 12000, 0, 10000, 0, 0, 106000, 'Lunas'),
('TK-20260905-0002', 'Bambang Hartono', 'Pekerja harian', '05/09/2026', '08:00', '17:00', 9, 12000, 15000, 0, 0, 0, 123000, 'Lunas'),
('TK-20260905-0003', 'Nur Hayati', 'Karyawan tetap', '05/09/2026', '08:00', '16:00', 8, 15000, 0, 15000, 0, 0, 135000, 'Lunas'),
('TK-20260905-0004', 'Wahyudi Pratama', 'Pekerja per jam', '05/09/2026', '10:00', '16:00', 6, 12000, 0, 0, 0, 0, 72000, 'Lunas'),
('TK-20260905-0005', 'Sri Mulyani', 'Pekerja harian', '05/09/2026', '08:00', '16:00', 8, 12000, 0, 0, 0, 20000, 76000, 'Lunas'),
('TK-20260905-0006', 'Joko Susilo', 'Pekerja harian', '05/09/2026', '08:00', '18:00', 10, 12000, 30000, 10000, 0, 0, 160000, 'Lunas'),
('TK-20260905-0007', 'Endang Lestari', 'Karyawan tetap', '05/09/2026', '08:00', '16:00', 8, 15000, 0, 0, 0, 0, 120000, 'Lunas'),
('TK-20260905-0008', 'Agus Setiawan', 'Pekerja per jam', '05/09/2026', '08:00', '13:00', 5, 12000, 0, 5000, 0, 0, 65000, 'Lunas'),
('TK-20260905-0009', 'Tri Wahyuni', 'Pekerja harian', '05/09/2026', '08:00', '16:00', 8, 12000, 0, 0, 5000, 0, 91000, 'Lunas'),
('TK-20260905-0010', 'Ahmad Dani', 'Pekerja harian', '05/09/2026', '08:00', '16:00', 8, 12000, 0, 10000, 0, 0, 106000, 'Lunas');

-- 10. HUTANG PIUTANG
INSERT INTO hutang_piutang (ref_id, tanggal, tipe, kontak_nama, total_nominal, terbayar, sisa, jatuh_tempo, status) VALUES
('PIU-001', '01/09/2026', 'Piutang', 'Toko Oleh-Oleh Barokah', 750000, 0, 750000, '07/09/2026', 'Belum Lunas'),
('PIU-002', '02/09/2026', 'Piutang', 'Minimarket Sentosa', 1200000, 0, 1200000, '08/09/2026', 'Belum Lunas'),
('PIU-003', '03/09/2026', 'Piutang', 'Toko Sentra Kuliner Nusantara', 900000, 0, 900000, '06/09/2026', 'Belum Lunas'),
('PIU-004', '04/09/2026', 'Piutang', 'Agen Snack Bu Siti', 650000, 0, 650000, '11/09/2026', 'Belum Lunas'),
('PIU-005', '04/09/2026', 'Piutang', 'Koperasi Karyawan Sejahtera', 800000, 0, 800000, '12/09/2026', 'Belum Lunas'),
('PIU-006', '05/09/2026', 'Piutang', 'Depot Pusat Rasa', 450000, 0, 450000, '07/09/2026', 'Belum Lunas'),
('HTG-001', '28/08/2026', 'Hutang', 'CV Sumber Pangan (Kedelai)', 2500000, 1000000, 1500000, '06/09/2026', 'Belum Lunas'),
('HTG-002', '30/08/2026', 'Hutang', 'PT Nabati Jaya (Minyak)', 1800000, 0, 1800000, '08/09/2026', 'Belum Lunas'),
('HTG-003', '01/09/2026', 'Hutang', 'Prima Packaging (Kemasan)', 950000, 0, 950000, '15/09/2026', 'Belum Lunas'),
('HTG-004', '02/09/2026', 'Hutang', 'RPA Berkah Daging (Daging Sapi)', 2300000, 1000000, 1300000, '07/09/2026', 'Belum Lunas');

-- 11. STOCK OPNAME
INSERT INTO stock_opname (opname_id, tanggal, produk_id, nama_produk, lokasi, stok_sistem, stok_fisik, selisih, keterangan, petugas_audit) VALUES
('OPN-20260905-0001', '05/09/2026 10:00:00', 'PRD-001', 'Kripik Tempe Premium 250g', 'Etalase Toko', 45, 45, 0, 'Audit fisik harian cocok', 'Hendro Auditor'),
('OPN-20260905-0002', '05/09/2026 10:00:00', 'PRD-002', 'Kue Kacang Gurih 500g', 'Etalase Toko', 16, 15, -1, '1 toples pecah di display', 'Hendro Auditor'),
('OPN-20260905-0003', '05/09/2026 10:00:00', 'PRD-003', 'Sambal Bawang Botol 150g', 'Etalase Toko', 8, 8, 0, 'Stok etalase pas', 'Hendro Auditor'),
('OPN-20260905-0004', '05/09/2026 10:00:00', 'PRD-004', 'Keripik Singkong Pedas 200g', 'Gudang Produksi', 200, 200, 0, 'Stok gudang cocok', 'Dewi Quality Control'),
('OPN-20260905-0005', '05/09/2026 10:00:00', 'PRD-005', 'Abon Sapi Gurih 100g', 'Etalase Toko', 12, 12, 0, 'Sesuai catatan sistem', 'Hendro Auditor'),
('OPN-20260905-0006', '05/09/2026 10:00:00', 'PRD-006', 'Basreng Daun Jeruk 150g', 'Etalase Toko', 65, 65, 0, 'Stok fisik aman', 'Hendro Auditor'),
('OPN-20260905-0007', '05/09/2026 10:00:00', 'PRD-007', 'Keripik Pisang Cokelat 200g', 'Gudang Produksi', 95, 95, 0, 'Kondisi kemasan rapi', 'Dewi Quality Control'),
('OPN-20260905-0008', '05/09/2026 10:00:00', 'PRD-008', 'Bakpia Basah Isi Kacang Hijau', 'Etalase Toko', 6, 5, -1, '1 kotak kadaluarsa display', 'Hendro Auditor'),
('OPN-20260905-0009', '05/09/2026 10:00:00', 'PRD-009', 'Makaroni Panggang Crispy 150g', 'Etalase Toko', 40, 40, 0, 'Stok etalase cocok', 'Hendro Auditor'),
('OPN-20260905-0010', '05/09/2026 10:00:00', 'PRD-010', 'Rengginang Ketan Hitam 250g', 'Gudang Produksi', 70, 70, 0, 'Sesuai hitungan batch', 'Dewi Quality Control');

-- 12. MUTASI LOKASI
INSERT INTO mutasi_lokasi (mutasi_id, tanggal, produk_id, nama_produk, lokasi_asal, lokasi_tujuan, jumlah, dicatat_oleh, keterangan) VALUES
('MUT-20260905-0001', '05/09/2026 10:00:00', 'PRD-001', 'Kripik Tempe Premium 250g', 'Gudang Produksi', 'Etalase Toko', 25, 'Budi Gudang', 'Restok etalase pagi'),
('MUT-20260905-0002', '05/09/2026 10:00:00', 'PRD-002', 'Kue Kacang Gurih 500g', 'Gudang Produksi', 'Etalase Toko', 10, 'Budi Gudang', 'Restok rak toples'),
('MUT-20260905-0003', '05/09/2026 10:00:00', 'PRD-003', 'Sambal Bawang Botol 150g', 'Gudang Produksi', 'Etalase Toko', 15, 'Budi Gudang', 'Restok rak botol'),
('MUT-20260905-0004', '05/09/2026 10:00:00', 'PRD-004', 'Keripik Singkong Pedas 200g', 'Gudang Produksi', 'Etalase Toko', 30, 'Budi Gudang', 'Pengisian display depan'),
('MUT-20260905-0005', '05/09/2026 10:00:00', 'PRD-005', 'Abon Sapi Gurih 100g', 'Gudang Produksi', 'Etalase Toko', 10, 'Budi Gudang', 'Restok etalase premium'),
('MUT-20260905-0006', '05/09/2026 10:00:00', 'PRD-006', 'Basreng Daun Jeruk 150g', 'Gudang Produksi', 'Etalase Toko', 40, 'Budi Gudang', 'Restok persiapan weekend'),
('MUT-20260905-0007', '05/09/2026 10:00:00', 'PRD-007', 'Keripik Pisang Cokelat 200g', 'Gudang Produksi', 'Etalase Toko', 20, 'Budi Gudang', 'Restok rak snack manis'),
('MUT-20260905-0008', '05/09/2026 10:00:00', 'PRD-008', 'Bakpia Basah Isi Kacang Hijau', 'Gudang Produksi', 'Etalase Toko', 15, 'Budi Gudang', 'Restok fresh bakery'),
('MUT-20260905-0009', '05/09/2026 10:00:00', 'PRD-009', 'Makaroni Panggang Crispy 150g', 'Gudang Produksi', 'Etalase Toko', 25, 'Budi Gudang', 'Restok etalase kasir'),
('MUT-20260905-0010', '05/09/2026 10:00:00', 'PRD-010', 'Rengginang Ketan Hitam 250g', 'Gudang Produksi', 'Etalase Toko', 10, 'Budi Gudang', 'Restok rak toples');

-- 13. AUDIT TRAIL
INSERT INTO audit_trail (log_id, waktu, user_id, nama_user, modul, aksi, nilai_lama, nilai_baru, keterangan) VALUES
('LOG-20260905-0001', '05/09/2026 10:00:00', 'USR-001', 'Bapak Direktur Owner', 'Autentikasi', 'LOGIN', '-', 'Sukses', 'Login awal sistem dari Web App'),
('LOG-20260905-0002', '05/09/2026 10:00:00', 'USR-006', 'Rudi Master Admin', 'MasterProduk', 'TAMBAH', '-', 'PRD-001', 'Pendaftaran produk Kripik Tempe Premium'),
('LOG-20260905-0003', '05/09/2026 10:00:00', 'USR-003', 'Ahmad Supervisor Produksi', 'Produksi', 'BATCH_SELESAI', '-', 'PRD-BATCH-20260905-0001', 'Hasil bersih: 98 pcs. HPP: Rp 6949'),
('LOG-20260905-0004', '05/09/2026 10:00:00', 'USR-007', 'Budi Kepala Gudang', 'MultiLokasi', 'TRANSFER_STOK', 'Gudang -> Etalase', '25', 'Transfer Kripik Tempe 25 pcs'),
('LOG-20260905-0005', '05/09/2026 10:00:00', 'USR-004', 'Rina Kasir Utama', 'POS', 'TRANSAKSI_BARU', '-', 'TRX-20260905-0001', 'Penjualan tunai kasir Rp 30000'),
('LOG-20260905-0006', '05/09/2026 10:00:00', 'USR-002', 'Ibu Siti Bendahara', 'Kas', 'MANUAL_KELUAR', '-', '1250000', 'Beli bahan baku kedelai 100kg'),
('LOG-20260905-0007', '05/09/2026 10:00:00', 'USR-010', 'Hendro Internal Auditor', 'StockOpname', 'ADJUST_STOK', '16', '15', 'Penyesuaian selisih Kue Kacang pecah 1 toples'),
('LOG-20260905-0008', '05/09/2026 10:00:00', 'USR-004', 'Rina Kasir Utama', 'HutangPiutang', 'PIUTANG_BARU', '-', 'PIU-001', 'Pencatatan tagihan tempo Toko Barokah Rp 750000'),
('LOG-20260905-0009', '05/09/2026 10:00:00', 'USR-002', 'Ibu Siti Bendahara', 'TenagaKerja', 'BAYAR_UPAH', '-', '450000', 'Pelunasan upah harian shift 1'),
('LOG-20260905-0010', '05/09/2026 10:00:00', 'USR-002', 'Ibu Siti Bendahara', 'HutangPiutang', 'QUICK_PAY', '750000', '250000', 'Verifikasi cicilan piutang Toko Barokah');

