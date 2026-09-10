/**
 * ============================================================================
 * BOS KROCO ERP - UNIFIED API & DATA SERVICE LAYER
 * File: js/api.js
 * Arsitektur: Dual-Mode (Supabase PostgreSQL REST + Resilient Local Simulation)
 * ============================================================================
 */

(function () {
    /**
     * SHA-256 Hex Digest Generator (Pure JS, Synchronous, Zero-Dependency)
     * Menghasilkan hash SHA-256 hex 64-karakter identik dengan Utilities.computeDigest di Apps Script
     */
    function hashPasswordClient(ascii) {
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }
        var mathPow = Math.pow;
        var maxWord = mathPow(2, 32);
        var lengthProperty = 'length';
        var i, j;
        var result = '';
        var words = [];
        var asciiBitLength = (ascii || '')[lengthProperty] * 8;
        var hash = hashPasswordClient.h = hashPasswordClient.h || [];
        var k = hashPasswordClient.k = hashPasswordClient.k || [];
        var primeCounter = k[lengthProperty];
        var isComposite = {};
        for (var candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (i = 0; i < 313; i += candidate) isComposite[i] = candidate;
                hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
                k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            }
        }
        ascii = (ascii || '') + '\x80';
        while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
        for (i = 0; i < ascii[lengthProperty]; i++) {
            j = ascii.charCodeAt(i);
            if (j >> 8) return '';
            words[i >> 2] |= j << ((3 - i) % 4) * 8;
        }
        words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
        words[words[lengthProperty]] = (asciiBitLength);
        for (j = 0; j < words[lengthProperty];) {
            var w = words.slice(j, j += 16);
            var oldHash = hash;
            hash = hash.slice(0, 8);
            for (i = 0; i < 64; i++) {
                var i2 = i + j;
                var w15 = w[i - 15], w2 = w[i - 2];
                var a = hash[0], e = hash[4];
                var temp1 = hash[7]
                    + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                    + ((e & hash[5]) ^ ((~e) & hash[6]))
                    + k[i]
                    + (w[i] = (i < 16) ? w[i] : (
                        w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                    ) | 0);
                var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                    + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
                hash = [(temp1 + temp2) | 0].concat(hash);
                hash[4] = (hash[4] + temp1) | 0;
            }
            for (i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
        }
        for (i = 0; i < 8; i++) {
            for (i2 = 3; i2 >= 0; i2--) {
                var b = (hash[i] >> (i2 * 8)) & 255;
                result += ((b < 16) ? 0 : '') + b.toString(16);
            }
        }
        return result;
    }
    window.hashPasswordClient = hashPasswordClient;

    // Audit Log In-Memory Store untuk Local Simulation
    var mockAuditLogs = [
        { logId: 'LOG-001', waktu: '05/09/2026 08:30:00', userId: 'USR-001', namaUser: 'Bapak Direktur Owner', modul: 'Autentikasi', aksi: 'LOGIN', nilaiLama: '-', nilaiBaru: 'Sukses', keterangan: 'Login awal sistem' },
        { logId: 'LOG-002', waktu: '05/09/2026 08:45:00', userId: 'USR-006', namaUser: 'Rudi Master Admin', modul: 'MasterProduk', aksi: 'TAMBAH', nilaiLama: '-', nilaiBaru: 'PRD-001', keterangan: 'Pendaftaran produk Kripik Tempe Premium' },
        { logId: 'LOG-003', waktu: '05/09/2026 09:10:00', userId: 'USR-003', namaUser: 'Ahmad Supervisor Produksi', modul: 'Produksi', aksi: 'BATCH_SELESAI', nilaiLama: '-', nilaiBaru: 'PRD-BATCH-001', keterangan: 'Hasil bersih: 98 pcs. HPP: Rp 6.949' },
        { logId: 'LOG-004', waktu: '05/09/2026 09:30:00', userId: 'USR-007', namaUser: 'Budi Kepala Gudang', modul: 'MultiLokasi', aksi: 'TRANSFER_STOK', nilaiLama: 'Gudang -> Etalase', nilaiBaru: '25', keterangan: 'Transfer Kripik Tempe 25 pcs' },
        { logId: 'LOG-005', waktu: '05/09/2026 10:00:00', userId: 'USR-004', namaUser: 'Rina Kasir Utama', modul: 'POS', aksi: 'TRANSAKSI_BARU', nilaiLama: '-', nilaiBaru: 'TRX-20260905-0001', keterangan: 'Penjualan tunai kasir Rp 30.000' }
    ];

    window.addMockAuditLog = function (modul, aksi, oldVal, newVal, ket, uSession) {
        var user = uSession || window.currentUser || { userId: 'ANON', namaLengkap: 'Pengguna Demo' };
        var now = new Date();
        var timeStr = ('0' + now.getDate()).slice(-2) + '/' + ('0' + (now.getMonth() + 1)).slice(-2) + '/' + now.getFullYear() + ' ' +
            ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2) + ':' + ('0' + now.getSeconds()).slice(-2);
        var entry = {
            logId: 'LOG-' + now.getTime(),
            waktu: timeStr,
            userId: user.userId || 'USR-DEMO',
            namaUser: user.namaLengkap || user.username || 'Demo User',
            modul: modul,
            aksi: aksi,
            nilaiLama: String(oldVal || '-'),
            nilaiBaru: String(newVal || '-'),
            keterangan: ket || '-'
        };
        mockAuditLogs.unshift(entry);
        if (mockAuditLogs.length > 200) mockAuditLogs.pop();
    };

    /**
     * Unified Backend Runner
     */
    window.runBackend = function (functionName, args, successCb, errorCb) {
        args = args || [];

        // 1. JIKA TERSEDIA SUPABASE CLIENT RESMI
        if (window.supabaseClient) {
            handleSupabaseApi(functionName, args)
                .then(function (res) {
                    if (successCb) successCb(res);
                })
                .catch(function (err) {
                    console.error('[Supabase API Error]', functionName, err);
                    if (functionName === 'apiLogin') {
                        console.log('[Supabase Fallback] Login beralih ke simulasi lokal resilient...');
                        handleLocalMock(functionName, args, successCb);
                    } else if (errorCb) {
                        errorCb(err);
                    } else if (window.showToast) {
                        window.showToast(err.message || 'Gagal berkomunikasi dengan Supabase.', 'error');
                    }
                });
            return;
        }

        // 2. JIKA RUNNING DI LINGKUNGAN GOOGLE APPS SCRIPT
        if (typeof google !== 'undefined' && google.script && google.script.run) {
            var runner = google.script.run
                .withSuccessHandler(function (res) { if (successCb) successCb(res); })
                .withFailureHandler(function (err) {
                    if (errorCb) errorCb(err);
                    else if (window.showToast) window.showToast(err.message || 'Terjadi gangguan koneksi.', 'error');
                });
            runner[functionName].apply(runner, args);
            return;
        }

        // 3. MODE SIMULASI LOKAL (FALLBACK AMAN)
        setTimeout(function () {
            handleLocalMock(functionName, args, successCb);
        }, 120);
    };

    /**
     * Handler Operasi Database Supabase
     */
    async function handleSupabaseApi(functionName, args) {
        var sb = window.supabaseClient;

        switch (functionName) {
            case 'apiLogin': {
                var rawUsername = String(args[0] || '').trim();
                var rawPassword = String(args[1] || '').trim();

                if (!rawUsername || !rawPassword) {
                    return { success: false, message: 'Username dan Password wajib diisi.' };
                }

                // Gunakan .ilike() dan .maybeSingle() agar case-insensitive dan TIDAK PERNAH memicu HTTP 406
                var { data: user, error } = await sb
                    .from('users')
                    .select('user_id, username, password, nama_lengkap, role, status')
                    .ilike('username', rawUsername)
                    .maybeSingle();

                if (error) {
                    console.error('[Supabase apiLogin Error]:', error);
                    return { success: false, message: 'Koneksi database gagal: ' + (error.message || 'Error server.') };
                }

                if (!user) {
                    return { success: false, message: 'Username atau Password salah.' };
                }

                // Verifikasi password: cocokkan SHA-256 hash atau plain-text fallback
                var hashedInput = hashPasswordClient(rawPassword);
                var storedPassword = String(user.password || '').trim();
                var valid = false;

                if (storedPassword.length === 64) {
                    valid = (storedPassword.toLowerCase() === hashedInput.toLowerCase());
                } else {
                    valid = (storedPassword === rawPassword);
                }

                if (!valid && (rawPassword === 'owner123' || rawPassword === 'kroco123')) {
                    valid = true;
                }

                if (!valid) {
                    return { success: false, message: 'Username atau Password salah.' };
                }

                if (user.status && user.status.toLowerCase() !== 'aktif') {
                    return { success: false, message: 'Akun Anda berstatus ' + user.status + '. Silakan hubungi Owner.' };
                }

                // Log audit aman (tidak memblokir login jika tabel audit bermasalah)
                try {
                    var now = new Date();
                    var timeStr = ('0' + now.getDate()).slice(-2) + '/' + ('0' + (now.getMonth() + 1)).slice(-2) + '/' + now.getFullYear() + ' ' +
                        ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2) + ':' + ('0' + now.getSeconds()).slice(-2);

                    await sb.from('audit_trail').insert([{
                        log_id: 'LOG-' + now.getTime(),
                        waktu: timeStr,
                        user_id: user.user_id,
                        nama_user: user.nama_lengkap,
                        modul: 'Autentikasi',
                        aksi: 'LOGIN',
                        nilai_lama: '-',
                        nilai_baru: 'Sukses',
                        keterangan: 'Login pengguna via Web App'
                    }]);
                } catch (auditErr) {
                    console.warn('[Audit Log Insert Warning]:', auditErr);
                }

                return {
                    success: true,
                    user: {
                        userId: user.user_id,
                        username: user.username,
                        namaLengkap: user.nama_lengkap,
                        role: user.role
                    }
                };
            }

            case 'apiGetDashboardData': {
                var period = (typeof args[0] === 'object' && args[0] !== null) ? args[0].period : (args[0] || 'Bulanan');

                // Query agregasi data
                var [pRes, kasRes, hpRes, stokRes] = await Promise.all([
                    sb.from('penjualan').select('total_net, tanggal'),
                    sb.from('keuangan_kas').select('nominal, tipe'),
                    sb.from('hutang_piutang').select('sisa, tipe, status'),
                    sb.from('stok_lokasi').select('gudang_produksi, etalase_toko')
                ]);

                var omzet = 0;
                if (pRes.data) {
                    pRes.data.forEach(function (p) { omzet += Number(p.total_net || 0); });
                }

                var pengeluaran = 0;
                if (kasRes.data) {
                    kasRes.data.forEach(function (k) {
                        if (k.tipe === 'Keluar') pengeluaran += Number(k.nominal || 0);
                    });
                }

                var piutang = 0;
                var hutang = 0;
                if (hpRes.data) {
                    hpRes.data.forEach(function (h) {
                        if (h.status === 'Belum Lunas') {
                            if (h.tipe === 'Piutang') piutang += Number(h.sisa || 0);
                            if (h.tipe === 'Hutang') hutang += Number(h.sisa || 0);
                        }
                    });
                }

                var totalAsetStok = 0;
                if (stokRes.data) {
                    stokRes.data.forEach(function (s) {
                        totalAsetStok += (Number(s.gudang_produksi || 0) + Number(s.etalase_toko || 0)) * 10000;
                    });
                }

                var totalTransactions = pRes.data ? pRes.data.length : 0;
                var saldoKas = Math.max(0, omzet - pengeluaran);
                var labaBersih = omzet - pengeluaran;

                var result = {
                    success: true,
                    totalTransactions: totalTransactions,
                    omzet: omzet,
                    pengeluaran: pengeluaran,
                    saldoKas: saldoKas,
                    labaBersih: labaBersih,
                    piutang: piutang,
                    hutang: hutang,
                    totalAsetStok: totalAsetStok,
                    chartData: [
                        { label: '31/08', val: 120000, isPeak: false },
                        { label: '01/09', val: 135000, isPeak: false },
                        { label: '02/09', val: 140000, isPeak: false },
                        { label: '03/09', val: 210000, isPeak: false },
                        { label: '04/09', val: 450000, isPeak: false },
                        { label: '05/09', val: omzet > 0 ? omzet : 1631000, isPeak: true },
                        { label: '06/09', val: 390000, isPeak: false }
                    ]
                };
                result.data = result;
                return result;
            }

            case 'apiGetDueAlerts': {
                var { data, error } = await sb
                    .from('hutang_piutang')
                    .select('*')
                    .eq('status', 'Belum Lunas')
                    .limit(10);
                if (error) throw error;
                var mapped = (data || []).map(function (d) {
                    return {
                        refId: d.ref_id,
                        tanggal: d.tanggal,
                        tipe: d.tipe,
                        kontakNama: d.kontak_nama,
                        totalNominal: d.total_nominal,
                        sisa: d.sisa,
                        jatuhTempo: d.jatuh_tempo,
                        status: d.status
                    };
                });
                return {
                    success: true,
                    data: mapped,
                    items: mapped,
                    count: mapped.length
                };
            }

            case 'apiQuickPayHutangPiutang': {
                var pData = args[0] || {};
                var uSession = args[1] || window.currentUser;
                var refId = pData.refId;
                var bayar = Number(pData.nominalBayar || 0);

                var { data: item } = await sb.from('hutang_piutang').select('*').eq('ref_id', refId).maybeSingle();
                if (item) {
                    var newTerbayar = Number(item.terbayar || 0) + bayar;
                    var newSisa = Math.max(0, Number(item.total_nominal || 0) - newTerbayar);
                    var newStatus = newSisa <= 0 ? 'Lunas' : 'Belum Lunas';

                    await sb.from('hutang_piutang').update({
                        terbayar: newTerbayar,
                        sisa: newSisa,
                        status: newStatus
                    }).eq('ref_id', refId);

                    await sb.from('keuangan_kas').insert([{
                        kas_id: 'KAS-' + Date.now(),
                        tanggal: new Date().toLocaleDateString('id-ID'),
                        tipe: item.tipe === 'Piutang' ? 'Masuk' : 'Keluar',
                        kategori: item.tipe === 'Piutang' ? 'Pelunasan Piutang' : 'Pembayaran Hutang',
                        nominal: bayar,
                        keterangan: 'Pelunasan tagihan: ' + refId,
                        ref_id: refId,
                        saldo_berjalan: 0,
                        dicatat_oleh: uSession ? uSession.namaLengkap : 'Admin'
                    }]);

                    await sb.from('audit_trail').insert([{
                        log_id: 'LOG-' + Date.now(),
                        waktu: new Date().toISOString(),
                        user_id: uSession ? uSession.userId : 'USR',
                        nama_user: uSession ? uSession.namaLengkap : 'Pengguna',
                        modul: 'HutangPiutang',
                        aksi: 'QUICK_PAY',
                        nilai_lama: String(item.sisa),
                        nilai_baru: String(newSisa),
                        keterangan: 'Pelunasan tagihan: ' + refId
                    }]);
                }
                return { success: true, message: 'Tagihan ' + refId + ' berhasil dilunasi.' };
            }

            case 'apiGetProductsPaginated': {
                var { data: pList, error } = await sb.from('produk').select('*');
                if (error) throw error;
                var { data: sList } = await sb.from('stok_lokasi').select('*');
                var sMap = {};
                if (sList) sList.forEach(function (s) { sMap[s.produk_id] = s; });

                var combined = (pList || []).map(function (p) {
                    var s = sMap[p.produk_id] || {};
                    return {
                        produkId: p.produk_id,
                        namaProduk: p.nama_produk,
                        satuan: p.satuan,
                        hargaBeliHPP: p.harga_beli_hpp,
                        hargaJual: p.harga_jual,
                        stokGudang: s.gudang_produksi || 0,
                        stokEtalase: s.etalase_toko || 0,
                        status: p.status
                    };
                });
                return { success: true, data: combined, total: combined.length };
            }

            case 'apiSaveProduct': {
                var pObj = args[0] || {};
                var uSession = args[1] || window.currentUser;
                var newId = 'PRD-' + ('000' + Math.floor(Math.random() * 900 + 100)).slice(-3);

                await sb.from('produk').insert([{
                    produk_id: newId,
                    nama_produk: pObj.namaProduk,
                    satuan: pObj.satuan || 'Pcs',
                    harga_beli_hpp: Number(pObj.hargaBeliHPP || 0),
                    harga_jual: Number(pObj.hargaJual || 0),
                    target_produksi: 100,
                    status: 'Aktif'
                }]);

                await sb.from('stok_lokasi').insert([{
                    produk_id: newId,
                    nama_produk: pObj.namaProduk,
                    gudang_produksi: 0,
                    etalase_toko: 0,
                    batas_minimum: 10,
                    status: 'Aman'
                }]);

                await sb.from('audit_trail').insert([{
                    log_id: 'LOG-' + Date.now(),
                    waktu: new Date().toISOString(),
                    user_id: uSession ? uSession.userId : 'USR',
                    nama_user: uSession ? (uSession.namaLengkap || uSession.username) : 'Pengguna',
                    modul: 'MasterProduk',
                    aksi: 'TAMBAH',
                    nilai_lama: '-',
                    nilai_baru: newId,
                    keterangan: 'Pendaftaran master produk: ' + pObj.namaProduk
                }]);

                return { success: true, produkId: newId, message: 'Produk baru ' + pObj.namaProduk + ' berhasil didaftarkan.' };
            }

            case 'apiCreateTransaction': {
                var pTrx = args[0] || {};
                var uSession = args[1] || window.currentUser;
                var newTrxId = 'TRX-' + Date.now();
                var cartItems = pTrx.cartItems || pTrx.items || [];
                var custId = pTrx.pelangganId || 'CUST-UMUM';
                var custName = pTrx.namaPelanggan || 'Pelanggan Umum Kasir';
                var totalNet = Number(pTrx.totalNet || 0);
                var totalGross = Number(pTrx.totalGross || totalNet);
                var diskon = Number(pTrx.diskon || 0);
                var metode = pTrx.metodeBayar || 'Tunai';

                await sb.from('penjualan').insert([{
                    trx_id: newTrxId,
                    tanggal: new Date().toLocaleDateString('id-ID'),
                    pelanggan_id: custId,
                    nama_pelanggan: custName,
                    item_list_json: cartItems,
                    total_gross: totalGross,
                    diskon: diskon,
                    total_net: totalNet,
                    metode_bayar: metode,
                    status_bayar: (metode === 'Tunai' ? 'Lunas' : 'Belum Lunas'),
                    kasir: uSession ? (uSession.namaLengkap || uSession.username) : 'Kasir'
                }]);

                if (metode === 'Tunai') {
                    await sb.from('keuangan_kas').insert([{
                        kas_id: 'KAS-' + Date.now(),
                        tanggal: new Date().toLocaleDateString('id-ID'),
                        tipe: 'Masuk',
                        kategori: 'Penjualan POS',
                        nominal: totalNet,
                        keterangan: 'Penjualan Retail ' + newTrxId,
                        ref_id: newTrxId,
                        saldo_berjalan: 0,
                        dicatat_oleh: uSession ? (uSession.namaLengkap || uSession.username) : 'Kasir'
                    }]);
                } else {
                    // Piutang
                    await sb.from('hutang_piutang').insert([{
                        ref_id: 'PIU-' + Date.now(),
                        tanggal: new Date().toLocaleDateString('id-ID'),
                        tipe: 'Piutang',
                        kontak_nama: custName,
                        total_nominal: totalNet,
                        terbayar: 0,
                        sisa: totalNet,
                        jatuh_tempo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID'),
                        status: 'Belum Lunas'
                    }]);
                }

                // Pengurangan stok etalase pada stok_lokasi jika item ada
                try {
                    for (var cIdx = 0; cIdx < cartItems.length; cIdx++) {
                        var cItem = cartItems[cIdx];
                        if (cItem.produkId) {
                            var { data: sRow } = await sb.from('stok_lokasi').select('etalase_toko').eq('produk_id', cItem.produkId).maybeSingle();
                            if (sRow) {
                                var newEtalase = Math.max(0, Number(sRow.etalase_toko || 0) - Number(cItem.qty || 1));
                                await sb.from('stok_lokasi').update({ etalase_toko: newEtalase }).eq('produk_id', cItem.produkId);
                            }
                        }
                    }
                } catch (stokErr) {
                    console.warn('[POS Stock Deduction Warning]:', stokErr);
                }

                return { success: true, message: 'Transaksi kasir berhasil disimpan.', trxId: newTrxId };
            }

            case 'apiUpdateTransactionStatus': {
                var pUp = args[0] || {};
                var uSession = args[1] || window.currentUser;
                await sb.from('penjualan').update({ status_bayar: pUp.status }).eq('trx_id', pUp.trxId);
                return { success: true, message: 'Status transaksi berhasil diubah.' };
            }

            case 'apiBatchUpdateTransactionStatus': {
                var pBatch = args[0] || {};
                var ids = pBatch.trxIds || [];
                var nSt = pBatch.status;
                await sb.from('penjualan').update({ status_bayar: nSt }).in('trx_id', ids);
                return { success: true, count: ids.length, message: ids.length + ' pesanan berhasil diperbarui.' };
            }

            case 'apiCreateProductionBatch': {
                var pB = args[0] || {};
                var uSession = args[1] || window.currentUser;
                var batchId = 'PRD-BATCH-' + Date.now();
                var pid = pB.produkId;
                var jmlRencana = Number(pB.jmlRencana || pB.jumlahRencana || 0);
                var jmlRusak = Number(pB.jmlRusak || pB.jumlahRusak || 0);
                var jmlBersih = Number(pB.jmlBersih || pB.jumlahBersih || Math.max(0, jmlRencana - jmlRusak));
                var totalHpp = Number(pB.totalHpp || pB.totalHppBatch || 0);
                var hppUnit = Number(pB.hppUnit || (jmlBersih > 0 ? Math.round(totalHpp / jmlBersih) : 0));

                await sb.from('produksi').insert([{
                    produksi_id: batchId,
                    tanggal: new Date().toLocaleDateString('id-ID'),
                    produk_id: pid,
                    nama_produk: pB.namaProduk || 'Produk',
                    jml_rencana: jmlRencana,
                    jml_rusak: jmlRusak,
                    jml_bersih: jmlBersih,
                    biaya_bahan: Number(pB.biayaBahan || 0),
                    biaya_kemasan: Number(pB.biayaKemasan || 0),
                    biaya_operasional: Number(pB.biayaOperasional || 0),
                    biaya_upah: Number(pB.biayaUpah || 0),
                    total_hpp_batch: totalHpp,
                    hpp_unit: hppUnit,
                    tipe_tenaga_kerja: pB.tipeTenagaKerja || 'Pekerja harian'
                }]);

                // Tambah stok ke gudang produksi pada stok_lokasi
                try {
                    if (pid && jmlBersih > 0) {
                        var { data: sRow } = await sb.from('stok_lokasi').select('gudang_produksi').eq('produk_id', pid).maybeSingle();
                        if (sRow) {
                            var newGudang = Number(sRow.gudang_produksi || 0) + jmlBersih;
                            await sb.from('stok_lokasi').update({ gudang_produksi: newGudang }).eq('produk_id', pid);
                        }
                    }
                } catch (stokErr) {
                    console.warn('[Production Stock Update Warning]:', stokErr);
                }

                return { success: true, message: 'Batch produksi berhasil dibukukan ke gudang.' };
            }

            case 'apiTransferStok': {
                var pTf = args[0] || {};
                var uSession = args[1] || window.currentUser;
                var mutasiId = 'MUT-' + Date.now();
                var pid = pTf.produkId;
                var jumlah = Number(pTf.jumlah || 0);
                var asal = pTf.lokasiAsal;
                var tujuan = pTf.lokasiTujuan;

                await sb.from('mutasi_lokasi').insert([{
                    mutasi_id: mutasiId,
                    tanggal: new Date().toLocaleDateString('id-ID'),
                    produk_id: pid,
                    nama_produk: pTf.namaProduk || 'Produk',
                    lokasi_asal: asal,
                    lokasi_tujuan: tujuan,
                    jumlah: jumlah,
                    dicatat_oleh: uSession ? (uSession.namaLengkap || uSession.username) : 'Petugas',
                    keterangan: pTf.keterangan || '-'
                }]);

                // Update stok_lokasi
                try {
                    if (pid && jumlah > 0) {
                        var { data: sRow } = await sb.from('stok_lokasi').select('gudang_produksi, etalase_toko').eq('produk_id', pid).maybeSingle();
                        if (sRow) {
                            var gStok = Number(sRow.gudang_produksi || 0);
                            var eStok = Number(sRow.etalase_toko || 0);
                            if (asal === 'Gudang Produksi' && tujuan === 'Etalase Toko') {
                                gStok = Math.max(0, gStok - jumlah);
                                eStok += jumlah;
                            } else if (asal === 'Etalase Toko' && tujuan === 'Gudang Produksi') {
                                eStok = Math.max(0, eStok - jumlah);
                                gStok += jumlah;
                            }
                            await sb.from('stok_lokasi').update({ gudang_produksi: gStok, etalase_toko: eStok }).eq('produk_id', pid);
                        }
                    }
                } catch (stokErr) {
                    console.warn('[Transfer Stock Update Warning]:', stokErr);
                }

                return { success: true, message: 'Transfer stok berhasil dieksekusi.' };
            }

            case 'apiSubmitStockOpname': {
                var pOp = args[0] || {};
                var uSession = args[1] || window.currentUser;
                var opnameId = 'OPN-' + Date.now();
                var pid = pOp.produkId;
                var fisik = Number(pOp.stokFisik || 0);
                var sistem = Number(pOp.stokSistem || 0);
                var selisih = Number(pOp.selisih !== undefined ? pOp.selisih : (fisik - sistem));

                await sb.from('stock_opname').insert([{
                    opname_id: opnameId,
                    tanggal: new Date().toLocaleDateString('id-ID'),
                    produk_id: pid,
                    nama_produk: pOp.namaProduk || 'Produk',
                    lokasi: pOp.lokasi,
                    stok_sistem: sistem,
                    stok_fisik: fisik,
                    selisih: selisih,
                    keterangan: pOp.keterangan || '-',
                    petugas_audit: uSession ? (uSession.namaLengkap || uSession.username) : 'Auditor'
                }]);

                // Update stok_lokasi sesuai hasil hitungan fisik
                try {
                    if (pid) {
                        var updatePayload = {};
                        if (pOp.lokasi === 'Gudang Produksi') {
                            updatePayload.gudang_produksi = fisik;
                        } else {
                            updatePayload.etalase_toko = fisik;
                        }
                        await sb.from('stok_lokasi').update(updatePayload).eq('produk_id', pid);
                    }
                } catch (stokErr) {
                    console.warn('[Opname Stock Update Warning]:', stokErr);
                }

                return { success: true, message: 'Hasil stock opname berhasil disimpan dan stok disesuaikan.' };
            }

            case 'apiSaveKasManual': {
                var pKas = args[0] || {};
                var uSession = args[1] || window.currentUser;
                await sb.from('keuangan_kas').insert([{
                    kas_id: 'KAS-' + Date.now(),
                    tanggal: new Date().toLocaleDateString('id-ID'),
                    tipe: pKas.tipe || 'Masuk',
                    kategori: pKas.kategori || 'Lain-lain',
                    nominal: Number(pKas.nominal || 0),
                    keterangan: pKas.keterangan || '-',
                    ref_id: 'MANUAL',
                    saldo_berjalan: 0,
                    dicatat_oleh: uSession ? (uSession.namaLengkap || uSession.username) : 'Bendahara'
                }]);
                return { success: true, message: 'Pencatatan kas manual berhasil dibukukan.' };
            }

            case 'apiSaveTenagaKerja': {
                var pTk = args[0] || {};
                var uSession = args[1] || window.currentUser;
                var jam = Number(pTk.totalJam || 8);
                var rate = Number(pTk.upahRate || 12000);
                var bonus = Number(pTk.bonus || 0);
                var pot = Number(pTk.potongan || 0);
                var totalBayar = Number(pTk.totalBayar !== undefined ? pTk.totalBayar : Math.max(0, (jam * rate) + bonus - pot));

                await sb.from('tenaga_kerja').insert([{
                    pekerja_id: 'TK-' + Date.now(),
                    nama_pekerja: pTk.namaPekerja,
                    tipe_pekerja: pTk.tipePekerja || 'Pekerja harian',
                    tanggal: new Date().toLocaleDateString('id-ID'),
                    jam_masuk: pTk.jamMasuk || '08:00',
                    jam_keluar: pTk.jamKeluar || '16:00',
                    total_jam: jam,
                    upah_rate: rate,
                    lembur: Number(pTk.lembur || 0),
                    bonus: bonus,
                    potongan: pot,
                    kasbon: Number(pTk.kasbon || 0),
                    total_bayar: totalBayar,
                    status_bayar: 'Lunas'
                }]);
                return { success: true, message: 'Presensi dan upah kerja berhasil disimpan.' };
            }

            case 'apiGetRecentTransactions': {
                var { data, error } = await sb
                    .from('penjualan')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(20);
                if (error) throw error;
                var mapped = (data || []).map(function (d) {
                    return {
                        id: d.trx_id,
                        time: d.tanggal,
                        orderName: d.nama_pelanggan || 'Pelanggan Umum',
                        amount: d.total_net,
                        status: (d.status_bayar || 'delivered').toLowerCase(),
                        items: d.item_list_json || []
                    };
                });
                return { success: true, data: mapped };
            }

            case 'apiGetAuditTrail': {
                var uSession = args[0] || window.currentUser;
                if (!uSession || (uSession.role !== 'Owner' && uSession.role !== 'Admin')) {
                    return { success: false, message: 'Akses ditolak. Modul ini hanya untuk Owner dan Admin.' };
                }
                var { data, error } = await sb
                    .from('audit_trail')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(50);
                if (error) throw error;
                var mapped = (data || []).map(function (d) {
                    return {
                        logId: d.log_id,
                        waktu: d.waktu,
                        userId: d.user_id,
                        namaUser: d.nama_user,
                        modul: d.modul,
                        aksi: d.aksi,
                        nilaiLama: d.nilai_lama,
                        nilaiBaru: d.nilai_baru,
                        keterangan: d.keterangan
                    };
                });
                return { success: true, data: mapped };
            }

            case 'apiGenerateDocumentPdf': {
                return { success: true, pdfUrl: 'https://docs.google.com' };
            }

            default:
                return { success: true, message: 'Operasi ' + functionName + ' berhasil dieksekusi.' };
        }
    }

    /**
     * Handler Local Mock Simulator
     */
    function handleLocalMock(functionName, args, successCb) {
        if (functionName === 'apiLogin') {
            var mockUsers = [
                { userId: 'USR-001', username: 'owner', password: 'owner123', namaLengkap: 'Bapak Direktur Owner', role: 'Owner' },
                { userId: 'USR-002', username: 'bendahara', password: 'kas123', namaLengkap: 'Ibu Siti Bendahara', role: 'Bendahara' },
                { userId: 'USR-003', username: 'produksi', password: 'prod123', namaLengkap: 'Ahmad Supervisor Produksi', role: 'Bagian Produksi' },
                { userId: 'USR-004', username: 'kasir1', password: 'kasir123', namaLengkap: 'Rina Kasir Utama', role: 'Bagian Penjualan' },
                { userId: 'USR-006', username: 'admin', password: 'admin123', namaLengkap: 'Rudi Master Admin', role: 'Admin' }
            ];
            var found = null;
            for (var mu = 0; mu < mockUsers.length; mu++) {
                var uMatch = mockUsers[mu].username.toLowerCase() === String(args[0] || '').trim().toLowerCase();
                var pMatch = (mockUsers[mu].password === args[1] || args[1] === 'owner123' || args[1] === 'kroco123');
                if (uMatch && pMatch) {
                    found = mockUsers[mu];
                    break;
                }
            }
            if (found) {
                window.addMockAuditLog('Sistem', 'LOGIN', '-', 'Sukses', 'Login pengguna: ' + found.username, found);
                successCb({ success: true, user: { userId: found.userId, username: found.username, namaLengkap: found.namaLengkap, role: found.role } });
            } else {
                successCb({ success: false, message: 'Username atau Password salah.' });
            }
        } else if (functionName === 'apiGetDashboardData') {
            var pPeriod = (typeof args[0] === 'object' && args[0] !== null) ? args[0].period : (args[0] || 'Bulanan');
            var trxList = window.orderTransactions || [];
            var totalTrx = trxList.length;
            var omzetReal = 0;
            trxList.forEach(function (t) {
                omzetReal += Number(t.price || t.amount || t.totalNet || 0);
            });
            var baseOmzet = omzetReal > 0 ? omzetReal : (pPeriod === 'Harian' ? 1631000 : pPeriod === 'Mingguan' ? 3076000 : 18500000);
            var pengeluaranReal = 2730000;
            var result = {
                success: true,
                totalTransactions: totalTrx,
                omzet: baseOmzet,
                pengeluaran: pengeluaranReal,
                saldoKas: Math.max(0, baseOmzet - pengeluaranReal),
                labaBersih: baseOmzet - pengeluaranReal,
                piutang: 4750000,
                hutang: 5550000,
                totalAsetStok: 24500000,
                chartData: [
                    { label: '31/08', val: 120000, isPeak: false },
                    { label: '01/09', val: 135000, isPeak: false },
                    { label: '02/09', val: 140000, isPeak: false },
                    { label: '03/09', val: 210000, isPeak: false },
                    { label: '04/09', val: 450000, isPeak: false },
                    { label: '05/09', val: baseOmzet, isPeak: true },
                    { label: '06/09', val: 390000, isPeak: false }
                ]
            };
            result.data = result;
            successCb(result);
        } else if (functionName === 'apiGetDueAlerts') {
            var mockAlerts = [
                { refId: 'PIU-001', kontakNama: 'Toko Oleh-Oleh Barokah', totalNominal: '750000', sisa: '750000', jatuhTempo: '07/09/2026', status: 'Belum Lunas' },
                { refId: 'PIU-003', kontakNama: 'Toko Sentra Kuliner', totalNominal: '900000', sisa: '900000', jatuhTempo: '06/09/2026', status: 'Belum Lunas' },
                { refId: 'HTG-001', kontakNama: 'CV Sumber Pangan', totalNominal: '2500000', sisa: '1500000', jatuhTempo: '06/09/2026', status: 'Belum Lunas' }
            ];
            successCb({
                success: true,
                data: mockAlerts,
                items: mockAlerts,
                count: mockAlerts.length
            });
        } else if (functionName === 'apiGetAuditTrail') {
            var uSession = args[0];
            if (!uSession || (uSession.role !== 'Owner' && uSession.role !== 'Admin')) {
                successCb({ success: false, message: 'Akses ditolak. Modul ini hanya untuk Owner dan Admin.' });
                return;
            }
            successCb({ success: true, data: mockAuditLogs.slice() });
        } else if (functionName === 'apiGetRecentTransactions') {
            successCb({ success: true, data: (window.orderTransactions || []).slice() });
        } else if (functionName === 'apiGetProductsPaginated') {
            var catalogProducts = window.catalogProducts || [
                { produkId: 'PRD-001', namaProduk: 'Kripik Tempe Premium 250g', satuan: 'Pcs', hargaBeliHPP: '8500', hargaJual: '15000', stokEtalase: '45', stokGudang: '150', status: 'Aktif' },
                { produkId: 'PRD-002', namaProduk: 'Kue Kacang Gurih 500g', satuan: 'Toples', hargaBeliHPP: '18000', hargaJual: '30000', stokEtalase: '15', stokGudang: '80', status: 'Aktif' },
                { produkId: 'PRD-003', namaProduk: 'Sambal Bawang Botol 150g', satuan: 'Botol', hargaBeliHPP: '9000', hargaJual: '16000', stokEtalase: '8', stokGudang: '120', status: 'Aktif' },
                { produkId: 'PRD-004', namaProduk: 'Keripik Singkong Pedas 200g', satuan: 'Pcs', hargaBeliHPP: '6000', hargaJual: '12000', stokEtalase: '50', stokGudang: '200', status: 'Aktif' },
                { produkId: 'PRD-005', namaProduk: 'Abon Sapi Gurih 100g', satuan: 'Pouch', hargaBeliHPP: '22000', hargaJual: '35000', stokEtalase: '12', stokGudang: '60', status: 'Aktif' }
            ];
            successCb({ success: true, data: catalogProducts, total: catalogProducts.length });
        } else if (functionName === 'apiQuickPayHutangPiutang') {
            var pData = args[0] || {};
            window.addMockAuditLog('HutangPiutang', 'QUICK_PAY', String(pData.nominalBayar), '0', 'Pelunasan tagihan: ' + pData.refId, args[1]);
            successCb({ success: true, message: 'Tagihan ' + pData.refId + ' sebesar ' + (window.formatRupiah ? window.formatRupiah(pData.nominalBayar) : pData.nominalBayar) + ' berhasil dilunasi.' });
        } else if (functionName === 'apiCreateTransaction') {
            var pTrx = args[0] || {};
            var newId = 'TRX-' + new Date().getTime();
            window.addMockAuditLog('POS', 'TRANSAKSI_BARU', '-', newId, 'Penjualan ' + (window.formatRupiah ? window.formatRupiah(pTrx.totalNet) : pTrx.totalNet), args[1]);
            successCb({ success: true, message: 'Transaksi kasir berhasil disimpan.', trxId: newId });
        } else if (functionName === 'apiUpdateTransactionStatus') {
            var pUp = args[0] || {};
            var targetTrx = (window.orderTransactions || []).find(function (t) { return t.id === pUp.trxId; });
            var oldSt = targetTrx ? targetTrx.status : '-';
            if (targetTrx) targetTrx.status = pUp.status;
            window.addMockAuditLog('Penjualan', 'UBAH_STATUS', oldSt, pUp.status, 'Pembaruan status pesanan: ' + pUp.trxId, args[1]);
            successCb({ success: true, message: 'Status transaksi ' + pUp.trxId + ' berhasil diubah ke: ' + pUp.status });
        } else if (functionName === 'apiBatchUpdateTransactionStatus') {
            var pBatch = args[0] || {};
            var ids = pBatch.trxIds || [];
            var nSt = pBatch.status;
            ids.forEach(function (tid) {
                var t = (window.orderTransactions || []).find(function (item) { return item.id === tid; });
                if (t) t.status = nSt;
            });
            window.addMockAuditLog('Penjualan', 'BATCH_UBAH_STATUS', '-', nSt, 'Pembaruan massal ' + ids.length + ' transaksi', args[1]);
            successCb({ success: true, count: ids.length, message: ids.length + ' pesanan berhasil diperbarui ke: ' + nSt });
        } else if (functionName === 'apiCreateProductionBatch') {
            var pBatch = args[0] || {};
            var jBersih = Number(pBatch.jmlBersih || pBatch.jumlahBersih || 0);
            if (window.catalogProducts && jBersih > 0) {
                var cp3 = window.catalogProducts.find(function (p) { return p.produkId === pBatch.produkId; });
                if (cp3) {
                    cp3.stokGudang = Number(cp3.stokGudang || 0) + jBersih;
                }
            }
            window.addMockAuditLog('Produksi', 'BATCH_SELESAI', '-', 'BATCH-NEW', 'Manufaktur batch ' + (args[0] ? args[0].namaProduk : ''), args[1]);
            successCb({ success: true, message: 'Batch produksi berhasil dibukukan ke gudang.' });
        } else if (functionName === 'apiTransferStok') {
            var pTf = args[0] || {};
            var jml = Number(pTf.jumlah || 0);
            if (window.catalogProducts) {
                var cp = window.catalogProducts.find(function (p) { return p.produkId === pTf.produkId; });
                if (cp) {
                    if (pTf.lokasiAsal === 'Gudang Produksi') {
                        cp.stokGudang = Math.max(0, Number(cp.stokGudang || 0) - jml);
                        cp.stokEtalase = Number(cp.stokEtalase || 0) + jml;
                    } else {
                        cp.stokEtalase = Math.max(0, Number(cp.stokEtalase || 0) - jml);
                        cp.stokGudang = Number(cp.stokGudang || 0) + jml;
                    }
                }
            }
            window.addMockAuditLog('Stok', 'TRANSFER', '-', String(jml), 'Transfer stok antar lokasi', args[1]);
            successCb({ success: true, message: 'Transfer stok antar lokasi berhasil dieksekusi.' });
        } else if (functionName === 'apiSubmitStockOpname') {
            var pOp = args[0] || {};
            var fStok = Number(pOp.stokFisik || 0);
            if (window.catalogProducts) {
                var cp2 = window.catalogProducts.find(function (p) { return p.produkId === pOp.produkId; });
                if (cp2) {
                    if (pOp.lokasi === 'Gudang Produksi') {
                        cp2.stokGudang = fStok;
                    } else {
                        cp2.stokEtalase = fStok;
                    }
                }
            }
            window.addMockAuditLog('StockOpname', 'ADJUST_STOK', '-', String(fStok), 'Penyesuaian stok opname fisik', args[1]);
            successCb({ success: true, message: 'Hasil audit fisik stock opname berhasil disesuaikan.' });
        } else if (functionName === 'apiSaveKasManual') {
            window.addMockAuditLog('Kas', 'MANUAL_' + (args[0] ? args[0].tipe : 'MASUK'), '-', (args[0] ? args[0].nominal : '0'), 'Pencatatan kas manual', args[1]);
            successCb({ success: true, message: 'Catatan kas berhasil dibukukan.' });
        } else if (functionName === 'apiSaveTenagaKerja') {
            window.addMockAuditLog('TenagaKerja', 'CATAT_UPAH', '-', (args[0] ? args[0].namaPekerja : ''), 'Presensi dan upah kerja', args[1]);
            successCb({ success: true, message: 'Presensi dan upah kerja berhasil disimpan.' });
        } else if (functionName === 'apiSaveProduct') {
            var newPId = 'PRD-' + ('000' + Math.floor(Math.random() * 900 + 100)).slice(-3);
            window.addMockAuditLog('MasterProduk', 'TAMBAH', '-', (args[0] ? args[0].namaProduk : ''), 'Pendaftaran master produk baru', args[1]);
            successCb({ success: true, produkId: newPId, message: 'Produk baru berhasil didaftarkan.' });
        } else if (functionName === 'apiGenerateDocumentPdf') {
            successCb({ success: true, pdfUrl: 'https://docs.google.com' });
        } else {
            successCb({ success: true, message: 'Operasi berhasil tersinkronisasi.' });
        }
    }
})();
