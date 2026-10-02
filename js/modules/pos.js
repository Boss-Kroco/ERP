/**
 * ============================================================================
 * BOS KROCO ERP - POINT OF SALE (POS) MODULE
 * File: js/modules/pos.js
 * ============================================================================
 */

window.currentCart = [];

function tambahKeKeranjangGrid(pid, nama, harga) {
    if (!pid || !nama) return;
    
    // Check if already in cart
    var existing = window.currentCart.find(function(i) { return i.produkId === pid; });
    if (existing) {
        existing.qty += 1;
        existing.subtotal = existing.qty * existing.harga;
    } else {
        window.currentCart.push({
            produkId: pid,
            namaProduk: nama,
            harga: parseFloat(harga) || 0,
            qty: 1,
            subtotal: parseFloat(harga) || 0
        });
    }
    
    renderCart();
    if(typeof showToast === 'function') showToast(nama + ' ditambahkan ke keranjang.', 'success');
}

window.tambahBoronganPos = function() {
    var namaPaket = prompt("Masukkan Nama Paket / Borongan:", "Paket Custom");
    if(!namaPaket) return;
    var hargaPaket = prompt("Masukkan Harga Paket (Rp):", "0");
    if(hargaPaket === null) return;
    hargaPaket = parseFloat(hargaPaket) || 0;
    
    var pid = 'PKT-' + Math.floor(Math.random() * 10000);
    window.currentCart.push({
        produkId: pid,
        namaProduk: namaPaket,
        harga: hargaPaket,
        qty: 1,
        subtotal: hargaPaket
    });
    
    renderCart();
    if(typeof showToast === 'function') showToast(namaPaket + ' berhasil dimasukkan.', 'success');
};

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
        tr.innerHTML = '<td style="padding: 10px 8px;"><b>' + escapeHtml(item.namaProduk) + '</b><br><span style="font-size:11px;color:var(--text-muted);">' + formatRupiah(item.harga) + '</span></td>'
            + '<td style="padding: 10px 8px; text-align: center;"><input type="number" step="any" value="' + item.qty + '" style="width: 50px; text-align: center; border: 1px solid var(--border-soft); border-radius: 6px; padding: 4px;" onchange="window.updateCartQty(' + idx + ', this.value)"></td>'
            + '<td style="padding: 10px 8px; text-align: right; font-weight: 700; color: var(--text-dark);">' + formatRupiah(item.subtotal) + '</td>'
            + '<td style="padding: 10px 8px; text-align:center;"><button style="border:none;background:#fee2e2;color:var(--coral-pink);cursor:pointer;border-radius:6px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;" onclick="hapusCart(' + idx + ')"><svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></td>';
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

window.updateCartQty = function(idx, newQty) {
    newQty = parseFloat(newQty) || 1;
    if(newQty <= 0) newQty = 1;
    if (window.currentCart && window.currentCart[idx]) {
        window.currentCart[idx].qty = newQty;
        window.currentCart[idx].subtotal = newQty * window.currentCart[idx].harga;
        renderCart();
    }
};

window.renderPosProductGrid = function(filterText) {
    var grid = document.getElementById('posProductGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    var query = (filterText || '').toLowerCase().trim();
    var cats = window.catalogProducts || [];
    
    cats.forEach(function(p) {
        if (query && p.namaProduk.toLowerCase().indexOf(query) === -1) return;
        
        var safeNama = escapeHtml(p.namaProduk);
        var initial = safeNama.substring(0, 2).toUpperCase();
        var priceStr = formatRupiah(p.hargaJual || 0);
        
        var div = document.createElement('div');
        div.style.cssText = "background: #ffffff; border: 1px solid var(--border-soft); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; flex-direction: column; align-items: center; position: relative;";
        div.onmouseover = function() { this.style.borderColor = 'var(--violet-main)'; this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 16px rgba(108,71,255,0.1)'; };
        div.onmouseout = function() { this.style.borderColor = 'var(--border-soft)'; this.style.transform = 'none'; this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; };
        div.onclick = function() { tambahKeKeranjangGrid(p.produkId, p.namaProduk, p.hargaJual); };
        
        div.innerHTML = `
            <div style="width: 54px; height: 54px; border-radius: 12px; background: #e0e7ff; color: var(--violet-dark); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; margin-bottom: 12px;">
                ${initial}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-dark); text-align: center; margin-bottom: 4px; line-height: 1.3;">${safeNama}</div>
            <div style="font-size: 13px; font-weight: 800; color: var(--emerald);">${priceStr}</div>
            <div style="position: absolute; top: 12px; right: 12px; background: var(--violet-main); color: #fff; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; opacity: 0.8;">+</div>
        `;
        
        grid.appendChild(div);
    });
};

// Export POS functions to window
window.tambahKeKeranjangGrid = tambahKeKeranjangGrid;
window.renderCart = renderCart;
window.hapusCart = hapusCart;
window.submitTransaksiPOS = submitTransaksiPOS;
window.formatDateNow = formatDateNow;
window.cetakStrukTerakhir = cetakStrukTerakhir;
