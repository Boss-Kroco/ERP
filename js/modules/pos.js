/**
 * ============================================================================
 * BOS KROCO ERP - POINT OF SALE (POS) MODULE
 * File: js/modules/pos.js
 * ============================================================================
 */

window.currentCart = [];

function tambahKeKeranjang() {
    var sel = document.getElementById('posSelectProduk');
    if (!sel) return;
    var pid = sel.value;
    if (!pid) return showToast('Pilih produk terlebih dahulu.', 'error');
    var opt = sel.options[sel.selectedIndex];
    var nama = opt.getAttribute('data-nama');
    var harga = parseFloat(opt.getAttribute('data-harga')) || 0;
    var qty = parseFloat(document.getElementById('posQty').value) || 1;

    window.currentCart.push({
        produkId: pid,
        namaProduk: nama,
        harga: harga,
        qty: qty,
        subtotal: qty * harga
    });
    renderCart();
    showToast(nama + ' dimasukkan ke keranjang.', 'success');
}

function getAppPajakRate() {
    try {
        var raw = localStorage.getItem('bos_kroco_app_settings');
        if (raw) {
            var cfg = JSON.parse(raw);
            if (cfg && cfg.pajak !== undefined) {
                var p = parseFloat(cfg.pajak);
                if (!isNaN(p)) return p;
            }
        }
    } catch (e) {}
    return 11;
}

function renderCart() {
    var tbody = document.getElementById('tblCart');
    if (!tbody) return;
    tbody.innerHTML = '';
    var grandTotal = 0;
    (window.currentCart || []).forEach(function (item, idx) {
        grandTotal += item.subtotal;
        var tr = document.createElement('tr');
        tr.innerHTML = '<td><b>' + escapeHtml(item.namaProduk) + '</b></td>'
            + '<td>' + escapeHtml(String(item.qty)) + '</td>'
            + '<td>' + formatRupiah(item.subtotal) + '</td>'
            + '<td style="text-align:center;"><button style="border:none;background:none;color:var(--coral-pink);cursor:pointer;" onclick="hapusCart(' + idx + ')"><svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></td>';
        tbody.appendChild(tr);
    });

    var elDiskon = document.getElementById('posDiskon');
    var diskon = elDiskon ? (parseFloat(elDiskon.value) || 0) : 0;
    var taxableAmount = Math.max(0, grandTotal - diskon);

    var pajakRate = getAppPajakRate();
    var chkPpn = document.getElementById('posCheckPpn');
    var isPpnActive = chkPpn ? chkPpn.checked : true;
    var pajakNominal = (isPpnActive && taxableAmount > 0) ? Math.round((taxableAmount * pajakRate) / 100) : 0;
    var net = taxableAmount + pajakNominal;

    var elSubtotal = document.getElementById('posSubtotalLabel');
    var elDiskonLbl = document.getElementById('posDiskonLabel');
    var elPpnRate = document.getElementById('posPpnRateLabel');
    var elPpnLbl = document.getElementById('posPpnLabel');
    var elTotal = document.getElementById('posTotalLabel');

    if (elSubtotal) elSubtotal.textContent = formatRupiah(grandTotal);
    if (elDiskonLbl) elDiskonLbl.textContent = (diskon > 0 ? '-' : '') + formatRupiah(diskon);
    if (elPpnRate) elPpnRate.textContent = pajakRate + '%';
    if (elPpnLbl) elPpnLbl.textContent = formatRupiah(pajakNominal);
    if (elTotal) elTotal.textContent = formatRupiah(net);
}

function hapusCart(idx) {
    if (window.currentCart) {
        window.currentCart.splice(idx, 1);
        renderCart();
    }
}

function submitTransaksiPOS() {
    if (!window.currentCart || window.currentCart.length === 0) return showToast('Keranjang belanja kosong.', 'error');
    var grandTotal = 0;
    window.currentCart.forEach(function (i) { grandTotal += i.subtotal; });
    var elDiskon = document.getElementById('posDiskon');
    var diskon = elDiskon ? (parseFloat(elDiskon.value) || 0) : 0;
    var taxableAmount = Math.max(0, grandTotal - diskon);

    var pajakRate = getAppPajakRate();
    var chkPpn = document.getElementById('posCheckPpn');
    var isPpnActive = chkPpn ? chkPpn.checked : true;
    var pajakNominal = (isPpnActive && taxableAmount > 0) ? Math.round((taxableAmount * pajakRate) / 100) : 0;
    var totalNet = taxableAmount + pajakNominal;

    var elMetode = document.getElementById('posPaymentMethod');
    var metode = elMetode ? elMetode.value : 'Tunai';
    var custSelect = document.getElementById('posCustomer');
    var custId = custSelect ? custSelect.value : 'CUST-UMUM';
    var custName = (custSelect && custSelect.selectedIndex >= 0) ? custSelect.options[custSelect.selectedIndex].text : 'Pelanggan Umum Kasir';

    var cartSnapshot = window.currentCart.slice();

    var payload = {
        cartItems: cartSnapshot,
        items: cartSnapshot,
        totalGross: grandTotal,
        diskon: diskon,
        pajakNominal: pajakNominal,
        pajakPersen: isPpnActive ? pajakRate : 0,
        totalNet: totalNet,
        metodeBayar: metode,
        pelangganId: custId,
        namaPelanggan: custName
    };

    // Optimistic addition to orders table dengan rincian items
    var newTrx = {
        id: 'TRX-' + new Date().getTime(),
        orderNum: 'Nº' + Math.floor(600000 + Math.random() * 90000),
        customer: custName,
        phone: 'Kasir Walk-in',
        category: window.currentCart[0].namaProduk + (window.currentCart.length > 1 ? ' +' + (window.currentCart.length - 1) : ''),
        price: totalNet,
        date: formatDateNow(),
        payment: metode,
        status: (metode === 'Tunai' ? 'delivered' : 'await'),
        items: cartSnapshot
    };
    if (window.orderTransactions) {
        window.orderTransactions.unshift(newTrx);
    }
    if (typeof window.renderOrderTable === 'function') {
        window.renderOrderTable();
    }

    window.currentCart = [];
    renderCart();
    showToast('Memproses transaksi POS...', 'success');

    runBackend('apiCreateTransaction', [payload, window.currentUser], function (res) {
        if (res.success) {
            if (res.trxId) newTrx.id = res.trxId;
            showToast(res.message, 'success');
            if (typeof window.loadDashboardData === 'function') {
                window.loadDashboardData();
            }

            // Kirim notifikasi otomatis ke Bot Telegram jika terkonfigurasi
            if (typeof window.sendTelegramNotification === 'function') {
                var itemsText = cartSnapshot.map(function (ci) {
                    return '• ' + ci.namaProduk + ' (' + ci.qty + 'x) : ' + (window.formatRupiah ? window.formatRupiah(ci.subtotal) : ('Rp ' + ci.subtotal));
                }).join('\n');

                var userNama = (window.currentUser && (window.currentUser.namaLengkap || window.currentUser.username)) || 'Kasir';
                var teleMsg = '🔔 *PENJUALAN POS BARU - BOS KROCO ERP*\n'
                    + '━━━━━━━━━━━━━━━━━━━━\n'
                    + '🧾 *No. Nota:* `' + (res.trxId || newTrx.id) + '` (' + newTrx.orderNum + ')\n'
                    + '👤 *Pelanggan:* ' + custName + '\n'
                    + '💳 *Metode:* ' + metode + '\n'
                    + '👨‍💼 *Petugas:* ' + userNama + '\n\n'
                    + '📦 *Rincian Belanja:*\n' + itemsText + '\n\n'
                    + '💵 *Subtotal:* ' + (window.formatRupiah ? window.formatRupiah(grandTotal) : ('Rp ' + grandTotal)) + '\n'
                    + (diskon > 0 ? ('🏷️ *Diskon:* -' + (window.formatRupiah ? window.formatRupiah(diskon) : ('Rp ' + diskon)) + '\n') : '')
                    + (pajakNominal > 0 ? ('🏛️ *PPN (' + pajakRate + '%):* ' + (window.formatRupiah ? window.formatRupiah(pajakNominal) : ('Rp ' + pajakNominal)) + '\n') : '')
                    + '💰 *TOTAL BAYAR: ' + (window.formatRupiah ? window.formatRupiah(totalNet) : ('Rp ' + totalNet)) + '*\n'
                    + '📅 *Waktu:* ' + new Date().toLocaleString('id-ID');

                window.sendTelegramNotification(teleMsg);
            }
        } else {
            // Rollback optimistic addition jika backend gagal
            if (window.orderTransactions) {
                window.orderTransactions = window.orderTransactions.filter(function (t) { return t.id !== newTrx.id; });
            }
            if (typeof window.renderOrderTable === 'function') {
                window.renderOrderTable();
            }
            showToast(res.message || 'Transaksi gagal diproses.', 'error');
        }
    });
}

function formatDateNow() {
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}

function cetakStrukTerakhir() {
    var orders = window.orderTransactions || [];
    var lastTrxId = orders.length > 0 ? orders[0].id : null;
    if (!lastTrxId) {
        if (typeof window.showToast === 'function') window.showToast('Belum ada transaksi untuk dicetak.', 'error');
        return;
    }
    if (typeof window.openPreviewStruk === 'function') {
        window.openPreviewStruk(lastTrxId);
    }
}

function filterPosProducts(q) {
    q = (q || '').toLowerCase().trim();
    var sel = document.getElementById('posSelectProduk');
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
        var opt = sel.options[i];
        if (!opt.value) continue;
        var text = (opt.text || '').toLowerCase();
        opt.style.display = (text.indexOf(q) !== -1) ? '' : 'none';
    }
}

// Export POS functions to window
window.tambahKeKeranjang = tambahKeKeranjang;
window.renderCart = renderCart;
window.hapusCart = hapusCart;
window.submitTransaksiPOS = submitTransaksiPOS;
window.formatDateNow = formatDateNow;
window.cetakStrukTerakhir = cetakStrukTerakhir;
window.filterPosProducts = filterPosProducts;
