-- ============================================================================
-- BOS KROCO ERP - SUPABASE (POSTGRESQL) SCHEMA DDL
-- Arsitektur: 13 Tabel Terintegrasi, Foreign Keys, Indexes & Constraints
-- Timezone: Asia/Jakarta (WIB)
-- ============================================================================

-- Enable pgcrypto extension for UUIDs and hashes if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. USERS
DROP TABLE IF EXISTS audit_trail CASCADE;
DROP TABLE IF EXISTS mutasi_lokasi CASCADE;
DROP TABLE IF EXISTS stock_opname CASCADE;
DROP TABLE IF EXISTS hutang_piutang CASCADE;
DROP TABLE IF EXISTS tenaga_kerja CASCADE;
DROP TABLE IF EXISTS keuangan_kas CASCADE;
DROP TABLE IF EXISTS produksi CASCADE;
DROP TABLE IF EXISTS penjualan CASCADE;
DROP TABLE IF EXISTS pelanggan_toko CASCADE;
DROP TABLE IF EXISTS bahan_baku CASCADE;
DROP TABLE IF EXISTS stok_lokasi CASCADE;
DROP TABLE IF EXISTS produk CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Owner', 'Admin', 'Bendahara', 'Bagian Produksi', 'Bagian Penjualan')),
    status VARCHAR(50) DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUK
CREATE TABLE produk (
    produk_id VARCHAR(50) PRIMARY KEY,
    nama_produk VARCHAR(200) NOT NULL,
    satuan VARCHAR(50) DEFAULT 'Pcs',
    harga_beli_hpp NUMERIC(15, 2) DEFAULT 0,
    harga_jual NUMERIC(15, 2) DEFAULT 0,
    target_produksi INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STOK LOKASI
CREATE TABLE stok_lokasi (
    produk_id VARCHAR(50) PRIMARY KEY REFERENCES produk(produk_id) ON DELETE CASCADE,
    nama_produk VARCHAR(200) NOT NULL,
    gudang_produksi INTEGER DEFAULT 0,
    etalase_toko INTEGER DEFAULT 0,
    batas_minimum INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Aman',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BAHAN BAKU
CREATE TABLE bahan_baku (
    bahan_id VARCHAR(50) PRIMARY KEY,
    nama_bahan VARCHAR(200) NOT NULL,
    satuan VARCHAR(50) DEFAULT 'Kg',
    stok NUMERIC(15, 2) DEFAULT 0,
    harga_beli NUMERIC(15, 2) DEFAULT 0,
    supplier VARCHAR(200),
    terakhir_beli VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PELANGGAN TOKO
CREATE TABLE pelanggan_toko (
    pelanggan_id VARCHAR(50) PRIMARY KEY,
    nama_toko VARCHAR(200) NOT NULL,
    kontak VARCHAR(50),
    alamat TEXT,
    total_beli NUMERIC(15, 2) DEFAULT 0,
    total_piutang NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PENJUALAN
CREATE TABLE penjualan (
    trx_id VARCHAR(50) PRIMARY KEY,
    tanggal VARCHAR(50) NOT NULL,
    pelanggan_id VARCHAR(50),
    nama_pelanggan VARCHAR(200),
    item_list_json JSONB,
    total_gross NUMERIC(15, 2) DEFAULT 0,
    diskon NUMERIC(15, 2) DEFAULT 0,
    total_net NUMERIC(15, 2) DEFAULT 0,
    metode_bayar VARCHAR(50) DEFAULT 'Tunai',
    status_bayar VARCHAR(50) DEFAULT 'Lunas',
    kasir VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PRODUKSI
CREATE TABLE produksi (
    produksi_id VARCHAR(50) PRIMARY KEY,
    tanggal VARCHAR(50) NOT NULL,
    produk_id VARCHAR(50) REFERENCES produk(produk_id) ON DELETE SET NULL,
    nama_produk VARCHAR(200) NOT NULL,
    jml_rencana INTEGER DEFAULT 0,
    jml_rusak INTEGER DEFAULT 0,
    jml_bersih INTEGER DEFAULT 0,
    biaya_bahan NUMERIC(15, 2) DEFAULT 0,
    biaya_kemasan NUMERIC(15, 2) DEFAULT 0,
    biaya_operasional NUMERIC(15, 2) DEFAULT 0,
    biaya_upah NUMERIC(15, 2) DEFAULT 0,
    total_hpp_batch NUMERIC(15, 2) DEFAULT 0,
    hpp_unit NUMERIC(15, 2) DEFAULT 0,
    tipe_tenaga_kerja VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. KEUANGAN KAS
CREATE TABLE keuangan_kas (
    kas_id VARCHAR(50) PRIMARY KEY,
    tanggal VARCHAR(50) NOT NULL,
    tipe VARCHAR(50) NOT NULL CHECK (tipe IN ('Masuk', 'Keluar')),
    kategori VARCHAR(100) NOT NULL,
    nominal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    keterangan TEXT,
    ref_id VARCHAR(100),
    saldo_berjalan NUMERIC(15, 2) NOT NULL DEFAULT 0,
    dicatat_oleh VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TENAGA KERJA
CREATE TABLE tenaga_kerja (
    pekerja_id VARCHAR(50) PRIMARY KEY,
    nama_pekerja VARCHAR(150) NOT NULL,
    tipe_pekerja VARCHAR(100) NOT NULL,
    tanggal VARCHAR(50) NOT NULL,
    jam_masuk VARCHAR(20),
    jam_keluar VARCHAR(20),
    total_jam NUMERIC(10, 2) DEFAULT 0,
    upah_rate NUMERIC(15, 2) DEFAULT 0,
    lembur NUMERIC(15, 2) DEFAULT 0,
    bonus NUMERIC(15, 2) DEFAULT 0,
    potongan NUMERIC(15, 2) DEFAULT 0,
    kasbon NUMERIC(15, 2) DEFAULT 0,
    total_bayar NUMERIC(15, 2) DEFAULT 0,
    status_bayar VARCHAR(50) DEFAULT 'Lunas',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. HUTANG PIUTANG
CREATE TABLE hutang_piutang (
    ref_id VARCHAR(50) PRIMARY KEY,
    tanggal VARCHAR(50) NOT NULL,
    tipe VARCHAR(50) NOT NULL CHECK (tipe IN ('Hutang', 'Piutang')),
    kontak_nama VARCHAR(200) NOT NULL,
    total_nominal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    terbayar NUMERIC(15, 2) DEFAULT 0,
    sisa NUMERIC(15, 2) NOT NULL DEFAULT 0,
    jatuh_tempo VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Belum Lunas',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. STOCK OPNAME
CREATE TABLE stock_opname (
    opname_id VARCHAR(50) PRIMARY KEY,
    tanggal VARCHAR(50) NOT NULL,
    produk_id VARCHAR(50) REFERENCES produk(produk_id) ON DELETE SET NULL,
    nama_produk VARCHAR(200) NOT NULL,
    lokasi VARCHAR(100) NOT NULL,
    stok_sistem INTEGER DEFAULT 0,
    stok_fisik INTEGER DEFAULT 0,
    selisih INTEGER DEFAULT 0,
    keterangan TEXT,
    petugas_audit VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. MUTASI LOKASI
CREATE TABLE mutasi_lokasi (
    mutasi_id VARCHAR(50) PRIMARY KEY,
    tanggal VARCHAR(50) NOT NULL,
    produk_id VARCHAR(50) REFERENCES produk(produk_id) ON DELETE SET NULL,
    nama_produk VARCHAR(200) NOT NULL,
    lokasi_asal VARCHAR(100) NOT NULL,
    lokasi_tujuan VARCHAR(100) NOT NULL,
    jumlah INTEGER DEFAULT 0,
    dicatat_oleh VARCHAR(150),
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. AUDIT TRAIL
CREATE TABLE audit_trail (
    log_id VARCHAR(50) PRIMARY KEY,
    waktu VARCHAR(50) NOT NULL,
    user_id VARCHAR(50),
    nama_user VARCHAR(150),
    modul VARCHAR(100) NOT NULL,
    aksi VARCHAR(100) NOT NULL,
    nilai_lama TEXT,
    nilai_baru TEXT,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERFORMANCE INDEXES
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_penjualan_tanggal ON penjualan(tanggal);
CREATE INDEX idx_penjualan_pelanggan ON penjualan(pelanggan_id);
CREATE INDEX idx_produksi_tanggal ON produksi(tanggal);
CREATE INDEX idx_keuangan_tanggal ON keuangan_kas(tanggal);
CREATE INDEX idx_hutang_piutang_status ON hutang_piutang(status);
CREATE INDEX idx_audit_waktu ON audit_trail(waktu);
