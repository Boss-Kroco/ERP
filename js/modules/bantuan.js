/**
 * ============================================================================
 * BOS KROCO ERP - PUSAT BANTUAN & DUKUNGAN (HELP CENTER & SUPPORT TICKETS)
 * File: js/modules/bantuan.js
 * ============================================================================
 */

window.initBantuanPage = function () {
    var user = window.currentUser || {
        namaLengkap: 'Bapak Direktur Owner',
        email: 'owner@gmail.com'
    };

    var inpNama = document.getElementById('supportInpNama');
    var inpEmail = document.getElementById('supportInpEmail');

    if (inpNama && !inpNama.value) {
        inpNama.value = user.namaLengkap || user.username || 'Bapak Direktur Owner';
    }
    if (inpEmail && !inpEmail.value) {
        inpEmail.value = user.email || 'owner@gmail.com';
    }
};

window.toggleFaqAccordion = function (idx) {
    var target = document.getElementById('faqItem' + idx);
    if (!target) return;

    var isActive = target.classList.contains('active');
    
    // Tutup accordion lain agar bersih
    var allItems = document.querySelectorAll('.faq-item');
    allItems.forEach(function (el) {
        el.classList.remove('active');
    });

    // Jika sebelumnya tidak aktif, buka
    if (!isActive) {
        target.classList.add('active');
    }
};

/**
 * Data Panduan Penggunaan Fitur Bos Kroco ERP
 */
var GUIDE_CONTENTS = {
    'produksi': {
        title: 'Panduan Produksi & HPP Otomatis',
        badge: 'Manufaktur',
        badgeColor: '#ea580c',
        iconSvg: '<svg class="svg-icon-sm" viewBox="0 0 24 24" style="stroke:#ea580c;width:18px;height:18px;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>',
        desc: 'Cara mencatat proses produksi harian, menghitung biaya bahan baku dan overhead, serta kalkulasi otomatis HPP per unit.',
        steps: [
            {
                title: '1. Masuk ke Menu Produksi',
                text: 'Klik ikon pabrik (Produksi & HPP) di bilah navigasi kiri.'
            },
            {
                title: '2. Tentukan Produk Jadi & Target Unit',
                text: 'Pilih produk jadi (misal: Bos Kroco Original / Pedas) dan masukkan jumlah unit bungkus yang berhasil diproduksi.'
            },
            {
                title: '3. Masukkan Biaya Bahan Baku & Overhead',
                text: 'Input total biaya bahan (kroco segar, tepung, bumbu) dan biaya operasional (gas, minyak, kemasan, upah langsung).'
            },
            {
                title: '4. Periksa Live Preview HPP & Simpan',
                text: 'Sistem menampilkan live estimasi HPP per bungkus dan margin keuntungan. Klik "Catat & Simpan Produksi" untuk otomatis menambah stok barang siap jual ke gudang utama.'
            }
        ]
    },
    'pos': {
        title: 'Panduan Kasir POS & Cetak Struk',
        badge: 'Penjualan',
        badgeColor: '#dc2626',
        iconSvg: '<svg class="svg-icon-sm" viewBox="0 0 24 24" style="stroke:#dc2626;width:18px;height:18px;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
        desc: 'Langkah memproses penjualan kasir cepat, memberikan diskon potongan, menerapkan PPN, dan mencetak nota struk.',
        steps: [
            {
                title: '1. Pilih Produk & Jumlah',
                text: 'Pilih produk etalase siap jual dari dropdown, masukkan jumlah Qty, dan klik "Masukkan Keranjang Belanja".'
            },
            {
                title: '2. Potongan Diskon & Opsi PPN',
                text: 'Jika ada potongan promosi, isi nominal pada kotak Diskon. Centang atau nonaktifkan pilihan "Kenakan PPN (11%)" sesuai kebijakan transaksi.'
            },
            {
                title: '3. Pilih Pelanggan & Metode Bayar',
                text: 'Pilih Pelanggan Umum atau Toko Mitra. Pilih metode "Tunai" untuk kas langsung masuk, atau "Tempo" untuk pencatatan piutang konsinyasi.'
            },
            {
                title: '4. Selesaikan & Cetak Struk PDF',
                text: 'Klik "Selesaikan Transaksi & Simpan". Struk langsung tercatat, terkirim otomatis ke Telegram Owner (jika bot aktif), dan dapat dicetak via tombol "Cetak PDF Struk".'
            }
        ]
    },
    'multilokasi': {
        title: 'Panduan Transfer Multi-Lokasi & Opname',
        badge: 'Inventori',
        badgeColor: '#2563eb',
        iconSvg: '<svg class="svg-icon-sm" viewBox="0 0 24 24" style="stroke:#2563eb;width:18px;height:18px;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>',
        desc: 'Alur mutasi barang antar gudang pabrik dan etalase toko, serta penyesuaian selisih fisik via stock opname.',
        steps: [
            {
                title: '1. Tentukan Lokasi Asal & Tujuan',
                text: 'Pada menu "Transfer Stok", pilih gudang pengirim (Pabrik) dan lokasi penerima (Etalase Toko / Konsinyasi Mitra).'
            },
            {
                title: '2. Masukkan Jumlah Transfer',
                text: 'Tentukan unit produk yang dikirimkan. Pastikan stok lokasi asal mencukupi sebelum menekan tombol kirim.'
            },
            {
                title: '3. Verifikasi Mutasi Stok Real-Time',
                text: 'Sistem seketika memotong stok di pabrik dan menambah stok di toko penerima tanpa jeda.'
            },
            {
                title: '4. Lakukan Stock Opname Berkala',
                text: 'Masuk ke menu "Stock Opname" untuk mencocokkan stok sistem dengan stok riil di rak fisik. Selisih (surplus/minus) akan langsung tercatat di log audit.'
            }
        ]
    },
    'keuangan': {
        title: 'Panduan Buku Kas & Upah Tenaga Kerja',
        badge: 'Keuangan',
        badgeColor: '#16a34a',
        iconSvg: '<svg class="svg-icon-sm" viewBox="0 0 24 24" style="stroke:#16a34a;width:18px;height:18px;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',
        desc: 'Pencatatan pengeluaran operasional harian, pemantauan batas kas kritis, dan pembukuan upah tenaga kerja.',
        steps: [
            {
                title: '1. Catat Pengeluaran di Buku Kas',
                text: 'Pilih tipe "Kas Keluar", masukkan kategori (Listrik, Kemasan, Transport, dll), isi nominal dan catatan rinci.'
            },
            {
                title: '2. Pantau Peringatan Saldo Kas Kritis',
                text: 'Jika saldo kas operasional turun di bawah batas minimum (diatur di Pengaturan, default Rp 2.000.000), sistem memunculkan banner peringatan merah "KAS KRITIS".'
            },
            {
                title: '3. Pembukuan Upah Tenaga Kerja',
                text: 'Pada menu "Tenaga Kerja & Upah", rekap jam kerja atau output borongan karyawan untuk mengkalkulasi total gaji yang harus dibayarkan.'
            },
            {
                title: '4. Laporan Arus Kas & Laba Bersih',
                text: 'Semua pemasukan kasir dan pengeluaran beban otomatis membentuk kurva laba bersih riil di Dashboard.'
            }
        ]
    }
};

window.openGuideModal = function (guideKey) {
    var data = GUIDE_CONTENTS[guideKey];
    if (!data) return;

    var elTitle = document.getElementById('guideModalTitle');
    var elBadge = document.getElementById('guideModalBadge');
    var elDesc = document.getElementById('guideModalDesc');
    var elBody = document.getElementById('guideModalBody');

    if (elTitle) {
        elTitle.innerHTML = (data.iconSvg ? '<span style="display:inline-flex;align-items:center;vertical-align:middle;margin-right:8px;">' + data.iconSvg + '</span>' : '') + escapeHtml(data.title);
    }
    if (elBadge) {
        elBadge.textContent = data.badge;
        elBadge.style.background = data.badgeColor + '20';
        elBadge.style.color = data.badgeColor;
    }
    if (elDesc) elDesc.textContent = data.desc;

    if (elBody) {
        elBody.innerHTML = '';
        data.steps.forEach(function (st, idx) {
            var card = document.createElement('div');
            card.style.background = '#f8fafc';
            card.style.border = '1px solid var(--border-strong)';
            card.style.borderRadius = '10px';
            card.style.padding = '12px 14px';
            card.style.marginBottom = '10px';

            card.innerHTML = '<div style="font-weight: 800; font-size: 13px; color: var(--text-main); margin-bottom: 4px;">'
                + escapeHtml(st.title) + '</div>'
                + '<div style="font-size: 12px; line-height: 1.6; color: var(--text-muted);">'
                + escapeHtml(st.text) + '</div>';
            elBody.appendChild(card);
        });
    }

    var modal = document.getElementById('modalBantuanGuide');
    if (modal) modal.classList.add('active');
};

window.closeGuideModal = function () {
    var modal = document.getElementById('modalBantuanGuide');
    if (modal) modal.classList.remove('active');
};

/**
 * Pengiriman Formulir Tiket Bantuan (Support Ticket)
 */
window.submitSupportTicket = function () {
    var inpNama = document.getElementById('supportInpNama');
    var inpEmail = document.getElementById('supportInpEmail');
    var inpKategori = document.getElementById('supportInpKategori');
    var inpDeskripsi = document.getElementById('supportInpDeskripsi');
    var btn = document.getElementById('supportSubmitBtn');

    var nama = inpNama ? inpNama.value.trim() : '';
    var email = inpEmail ? inpEmail.value.trim() : '';
    var kategori = inpKategori ? inpKategori.value : 'Kendala Teknis';
    var deskripsi = inpDeskripsi ? inpDeskripsi.value.trim() : '';

    if (!nama || !email || !deskripsi) {
        if (typeof window.showToast === 'function') {
            window.showToast('Harap lengkapi seluruh formulir tiket bantuan.', 'error');
        }
        return;
    }

    // Buat Ticket ID Unik: TKT-BK-XXXXX
    var randomNum = Math.floor(10000 + Math.random() * 90000);
    var ticketId = 'TKT-BK-' + randomNum;
    var nowIso = new Date().toISOString();
    var nowFormatted = new Date().toLocaleString('id-ID');

    var ticketObj = {
        id: ticketId,
        nama: nama,
        email: email,
        kategori: kategori,
        deskripsi: deskripsi,
        status: 'Menunggu Respon',
        createdAt: nowIso,
        waktuFormatted: nowFormatted
    };

    // Simpan ke localStorage
    try {
        var existing = [];
        var raw = localStorage.getItem('bos_kroco_tickets');
        if (raw) existing = JSON.parse(raw);
        existing.unshift(ticketObj);
        localStorage.setItem('bos_kroco_tickets', JSON.stringify(existing));
    } catch (e) {
        console.warn('Gagal menyimpan tiket bantuan ke local storage:', e);
    }

    if (btn) btn.disabled = true;

    // Kirim notifikasi otomatis ke Bot Telegram jika terhubung
    if (typeof window.sendTelegramNotification === 'function') {
        var teleMsg = '🎫 *TIKET BANTUAN BARU - BOS KROCO ERP*\n'
            + '━━━━━━━━━━━━━━━━━━━━\n'
            + '🆔 *ID Tiket:* `' + ticketId + '`\n'
            + '👤 *Pengirim:* ' + nama + '\n'
            + '📧 *Email:* ' + email + '\n'
            + '📂 *Kategori:* ' + kategori + '\n\n'
            + '📝 *Deskripsi Kendala:*\n' + deskripsi + '\n\n'
            + '📅 *Waktu:* ' + nowFormatted;

        window.sendTelegramNotification(teleMsg);
    }

    setTimeout(function () {
        if (btn) btn.disabled = false;
        if (inpDeskripsi) inpDeskripsi.value = '';

        if (typeof window.showToast === 'function') {
            window.showToast('Tiket #' + ticketId + ' berhasil dikirim ke tim teknis!', 'success');
        }

        // Tampilkan modal konfirmasi dengan opsi lacak
        alert('✅ Tiket Bantuan Berhasil Dibuat!\n\nNomor Tiket Anda: #' + ticketId + '\nTim dukungan teknis akan segera menindaklanjuti kendala Anda.\nAnda dapat memeriksa statusnya kapan saja melalui tombol "Lacak Tiket".');
    }, 400);
};

/**
 * Lacak Tiket Bantuan
 */
window.openLacakTiketModal = function () {
    window.renderTicketList();
    var modal = document.getElementById('modalLacakTiket');
    if (modal) modal.classList.add('active');
};

window.closeLacakTiketModal = function () {
    var modal = document.getElementById('modalLacakTiket');
    if (modal) modal.classList.remove('active');
};

window.renderTicketList = function (searchQuery) {
    var container = document.getElementById('ticketListContainer');
    if (!container) return;

    var tickets = [];
    try {
        var raw = localStorage.getItem('bos_kroco_tickets');
        if (raw) tickets = JSON.parse(raw);
    } catch (e) {}

    var q = (searchQuery || '').toLowerCase().trim();
    if (q) {
        tickets = tickets.filter(function (t) {
            return (t.id && t.id.toLowerCase().indexOf(q) !== -1) ||
                (t.kategori && t.kategori.toLowerCase().indexOf(q) !== -1) ||
                (t.deskripsi && t.deskripsi.toLowerCase().indexOf(q) !== -1);
        });
    }

    container.innerHTML = '';

    if (tickets.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 30px; color: var(--text-muted); font-size: 12.5px;">'
            + '<div style="font-size: 28px; margin-bottom: 8px;">🎫</div>'
            + 'Belum ada tiket bantuan yang diajukan.'
            + '</div>';
        return;
    }

    tickets.forEach(function (t) {
        var item = document.createElement('div');
        item.style.background = '#f8fafc';
        item.style.border = '1px solid var(--border-strong)';
        item.style.borderRadius = '12px';
        item.style.padding = '14px';
        item.style.marginBottom = '10px';

        var statusBg = '#fef3c7';
        var statusColor = '#b45309';
        if (t.status === 'Diproses') {
            statusBg = '#eff6ff';
            statusColor = '#1d4ed8';
        } else if (t.status === 'Selesai') {
            statusBg = '#f0fdf4';
            statusColor = '#15803d';
        }

        item.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">'
            + '<div>'
            + '<span style="font-weight: 800; font-size: 13px; color: var(--violet-main);">' + escapeHtml(t.id) + '</span>'
            + '<span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">' + escapeHtml(t.waktuFormatted || '') + '</span>'
            + '</div>'
            + '<span style="background: ' + statusBg + '; color: ' + statusColor + '; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">' + escapeHtml(t.status) + '</span>'
            + '</div>'
            + '<div style="font-size: 12px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">' + escapeHtml(t.kategori) + '</div>'
            + '<div style="font-size: 11.5px; color: var(--text-muted); line-height: 1.5; background: #ffffff; padding: 8px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">' + escapeHtml(t.deskripsi) + '</div>';

        container.appendChild(item);
    });
};
