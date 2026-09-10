-- ============================================================================
-- BOS KROCO ERP - SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Keamanan: Akses anon read-write untuk aplikasi web (atau JWT auth)
-- ============================================================================

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_lokasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE bahan_baku ENABLE ROW LEVEL SECURITY;
ALTER TABLE pelanggan_toko ENABLE ROW LEVEL SECURITY;
ALTER TABLE penjualan ENABLE ROW LEVEL SECURITY;
ALTER TABLE produksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE keuangan_kas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenaga_kerja ENABLE ROW LEVEL SECURITY;
ALTER TABLE hutang_piutang ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_opname ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutasi_lokasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses penuh untuk anon key / public (agar Web App dapat beroperasi langsung)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON %I;', tbl);
        EXECUTE format('CREATE POLICY "Public access policy" ON %I FOR ALL USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;
