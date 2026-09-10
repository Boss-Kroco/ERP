# Panduan Integrasi Supabase - Bos Kroco ERP

Dokumen ini menjelaskan langkah mudah menghubungkan aplikasi **Bos Kroco ERP** ke database **Supabase**.

---

## 🚀 Langkah 1: Buat Proyek di Supabase (Gratis)
1. Buka [https://supabase.com](https://supabase.com) dan login / register akun.
2. Klik tombol **New Project**.
3. Isi form:
   - **Name**: `bos-kroco-erp` (atau sesuai keinginan Anda)
   - **Database Password**: Buat password yang kuat (simpan baik-baik)
   - **Region**: Pilih yang terdekat (misal: `Singapore (ap-southeast-1)`)
4. Klik **Create new project** dan tunggu beberapa menit hingga database siap.

---

## 🗄️ Langkah 2: Jalankan Skema & Data (SQL Editor)
1. Di dashboard Supabase, buka menu **SQL Editor** (ikon terminal `>_` di sidebar kiri).
2. Klik tombol **New query**.
3. Buka file [`schema.sql`](file:///c:/Boss%20Kroco/supabase/schema.sql) di text editor / VS Code, copy seluruh isinya, paste ke SQL Editor, lalu klik tombol **Run** (Ctrl+Enter).
   - Seluruh 13 tabel PostgreSQL beserta constraint & index akan langsung dibuat.
4. Buat query baru lagi, buka file [`seed.sql`](file:///c:/Boss%20Kroco/supabase/seed.sql), copy seluruh isinya, paste ke SQL Editor, lalu klik tombol **Run**.
   - Seluruh 10 data awal resmi dari `setup.gs` akan langsung terisi ke database.
5. (Opsional) Buka file [`rls.sql`](file:///c:/Boss%20Kroco/supabase/rls.sql), copy dan jalankan di SQL Editor untuk memastikan kebijakan hak akses public policy aktif.

---

## 🔑 Langkah 3: Ambil Kredensial & Pasang di Aplikasi
1. Di dashboard Supabase, buka **Project Settings** (ikon gear di sidebar kiri bawah) -> pilih **API**.
2. Salin 2 nilai berikut:
   - **Project URL** (contoh: `https://xyzcompany.supabase.co`)
   - **Project API Keys** -> Salin kunci **`anon` / `public`** (dimulai dengan huruf `eyJ...`)
3. Buka file [`js/config.js`](file:///c:/Boss%20Kroco/js/config.js) di proyek Bos Kroco Anda:
   ```javascript
   window.SUPABASE_CONFIG = {
       url: 'https://xyzcompany.supabase.co', // Ganti dengan Project URL Anda
       anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Ganti dengan anon key Anda
   };
   ```
4. Simpan file! Aplikasi akan secara otomatis mendeteksi kredensial tersebut dan langsung terhubung secara live ke Supabase!

> [!NOTE]
> Jika kredensial belum diisi, aplikasi akan tetap berjalan dengan aman dalam **Mode Simulasi / Demo Lokal** sehingga Anda tetap dapat melihat seluruh fitur dan tampilan tanpa error.
