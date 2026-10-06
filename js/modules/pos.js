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
        window.updateCartQty(window.currentCart.indexOf(existing), existing.qty + 1);
    } else {
        window.currentCart.push({
            produkId: pid,
            namaProduk: nama,
            hargaDefault: parseFloat(harga) || 0,
            harga: parseFloat(harga) || 0,
            qty: 1,
            subtotal: parseFloat(harga) || 0
        });
        window.updateCartQty(window.currentCart.length - 1, 1); // trigger wholesale calc
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
        var qtyInputHtml = '<div style="display: flex; align-items: center; justify-content: center; gap: 4px;">' +
            '<button style="width: 24px; height: 24px; border: 1px solid var(--border-soft); background: #fff; border-radius: 4px; cursor: pointer; font-weight: bold; color: var(--text-dark);" onclick="window.updateCartQty(' + idx + ', ' + (item.qty - 1) + ')">-</button>' +
            '<input type="number" step="any" value="' + item.qty + '" style="width: 44px; text-align: center; border: 1px solid var(--border-soft); border-radius: 4px; padding: 2px;" onchange="window.updateCartQty(' + idx + ', this.value)">' +
            '<button style="width: 24px; height: 24px; border: 1px solid var(--border-soft); background: #fff; border-radius: 4px; cursor: pointer; font-weight: bold; color: var(--text-dark);" onclick="window.updateCartQty(' + idx + ', ' + (item.qty + 1) + ')">+</button>' +
            '</div>';

        tr.innerHTML = '<td style="padding: 10px 8px;"><b>' + escapeHtml(item.namaProduk) + '</b><br><span style="font-size:11px;color:var(--text-muted);">' + window.formatAppCurrency(item.harga) + '</span></td>'
            + '<td style="padding: 10px 8px; text-align: center;">' + qtyInputHtml + '</td>'
            + '<td style="padding: 10px 8px; text-align: right; font-weight: 700; color: var(--text-dark);">' + window.formatAppCurrency(item.subtotal) + '</td>'
            + '<td style="padding: 10px 8px; text-align:center;"><button style="border:none;background:#fee2e2;color:var(--coral-pink);cursor:pointer;border-radius:6px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;" onclick="hapusCart(' + idx + ')"><svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button></td>';
        tbody.appendChild(tr);
    });

    var elDiskonType = document.getElementById('posDiskonType');
    var elDiskon = document.getElementById('posDiskon');
    var diskonValue = elDiskon ? (parseFloat(elDiskon.value) || 0) : 0;
    var diskonType = elDiskonType ? elDiskonType.value : 'rp';
    var diskonNominal = 0;
    
    if (diskonType === 'persen') {
        diskonNominal = grandTotal * (diskonValue / 100);
    } else {
        diskonNominal = diskonValue;
    }

    var taxableAmount = Math.max(0, grandTotal - diskonNominal);

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

    if (elSubtotal) elSubtotal.textContent = window.formatAppCurrency(grandTotal);
    if (elDiskonLbl) elDiskonLbl.textContent = (diskonNominal > 0 ? '-' : '') + window.formatAppCurrency(diskonNominal);
    if (elPpnRate) elPpnRate.textContent = pajakRate + '%';
    if (elPpnLbl) elPpnLbl.textContent = window.formatAppCurrency(pajakNominal);
    if (elTotal) elTotal.textContent = window.formatAppCurrency(net);
    
    // Mode Wakil
    var chkWakil = document.getElementById('posCheckWakil');
    var boxWakil = document.getElementById('posWakilContainer');
    if (chkWakil && boxWakil) {
        if (chkWakil.checked) {
            boxWakil.style.display = 'flex';
            var pWakil = parseFloat(document.getElementById('posWakilPersen').value) || 0;
            var valWakil = net * (pWakil / 100);
            var valPerusahaan = net - valWakil;
            
            document.getElementById('posWakilLbl').textContent = window.formatAppCurrency(valWakil);
            document.getElementById('posWakilPerusahaanLbl').textContent = window.formatAppCurrency(valPerusahaan);
        } else {
            boxWakil.style.display = 'none';
        }
    }
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
    var elDiskonType = document.getElementById('posDiskonType');
    var elDiskon = document.getElementById('posDiskon');
    var diskonValue = elDiskon ? (parseFloat(elDiskon.value) || 0) : 0;
    var diskonType = elDiskonType ? elDiskonType.value : 'rp';
    var diskon = (diskonType === 'persen') ? (grandTotal * (diskonValue / 100)) : diskonValue;
    var taxableAmount = Math.max(0, grandTotal - diskon);

    var pajakRate = getAppPajakRate();
    var chkPpn = document.getElementById('posCheckPpn');
    var isPpnActive = chkPpn ? chkPpn.checked : true;
    var pajakNominal = (isPpnActive && taxableAmount > 0) ? Math.round((taxableAmount * pajakRate) / 100) : 0;
    var totalNet = taxableAmount + pajakNominal;

    var elMetode = document.getElementById('posPaymentMethod');
    var metode = elMetode ? elMetode.value : 'Tunai';
    var isTunai = String(metode).toLowerCase() === 'tunai';
    
    var custSelect = document.getElementById('posCustomer');
    var custId = custSelect ? custSelect.value : 'CUST-UMUM';
    var custName = (custSelect && custSelect.selectedIndex >= 0) ? custSelect.options[custSelect.selectedIndex].text : 'Pelanggan Umum Kasir';

    var elUangBayar = document.getElementById('posUangBayar');
    var uangBayar = elUangBayar ? (parseFloat(elUangBayar.value) || 0) : 0;
    if (isTunai && uangBayar < totalNet && uangBayar > 0) {
        return showToast('Jumlah uang bayar kurang dari total!', 'error');
    }
    
    // Automatically round up if not provided and it's cash
    var bayarNominal = isTunai ? (uangBayar || (totalNet <= 50000 ? (Math.ceil(totalNet / 10000) * 10000 || totalNet) : totalNet)) : totalNet;
    if (bayarNominal < totalNet) bayarNominal = totalNet;
    
    var kembalian = isTunai ? Math.max(0, bayarNominal - totalNet) : 0;
    
    var isTabunganMethod = String(metode).toLowerCase() === 'tabungan';
    if (isTabunganMethod) {
        if (custId === 'CUST-UMUM') return showToast('Pilih pelanggan member untuk bayar pakai Tabungan!', 'error');
        var pel = (window.allPelanggan || []).find(function(p) { return p.id === custId; });
        if (!pel || (parseFloat(pel.tabungan) || 0) < totalNet) {
            return showToast('Saldo Tabungan tidak cukup! Saldo: Rp ' + (pel ? window.formatRupiah(pel.tabungan) : '0'), 'error');
        }
        // Deduct
        pel.tabungan -= totalNet;
        // Log to Keuangan as Tabungan Keluar
        window.allKeuanganKas = window.allKeuanganKas || [];
        window.allKeuanganKas.unshift({
            id: 'KAS-' + Date.now(),
            tanggal: new Date().toISOString().split('T')[0],
            kategori: 'Tabungan Pelanggan',
            tipe: 'Tabungan Keluar',
            nominal: totalNet,
            keterangan: 'Pembayaran POS (' + custName + ')'
        });
        if (typeof window.renderTabelPelanggan === 'function') window.renderTabelPelanggan();
        if (typeof window.renderKeuanganTable === 'function') window.renderKeuanganTable();
    }
    
    var chkTabungan = document.getElementById('posSimpanTabungan');
    var isSimpanTabungan = (chkTabungan && chkTabungan.checked && kembalian > 0 && custId !== 'CUST-UMUM');

    if (isSimpanTabungan) {
        // Save kembalian to customer's tabungan
        var pel = (window.allPelanggan || []).find(function(p) { return p.id === custId; });
        if (pel) {
            pel.tabungan = (parseFloat(pel.tabungan) || 0) + kembalian;
            
            // Log to Keuangan as Tabungan Masuk
            window.allKeuanganKas = window.allKeuanganKas || [];
            window.allKeuanganKas.unshift({
                id: 'KAS-' + Date.now(),
                tanggal: new Date().toISOString().split('T')[0],
                kategori: 'Tabungan Pelanggan',
                tipe: 'Tabungan Masuk',
                nominal: kembalian,
                keterangan: 'Simpan kembalian transaksi ' + (window.orderTransactions ? window.orderTransactions.length + 1 : 1)
            });
            
            if (typeof window.renderTabelPelanggan === 'function') window.renderTabelPelanggan();
            if (typeof window.renderKeuanganTable === 'function') window.renderKeuanganTable();
        } else {
            showToast('Tabungan gagal disimpan: Pelanggan bukan anggota.', 'warning');
        }
    }

    var cartSnapshot = window.currentCart.slice();

    var chkWakil = document.getElementById('posCheckWakil');
    var isWakil = chkWakil ? chkWakil.checked : false;
    var wakilPersen = 0;
    var wakilNominal = 0;
    var perusahaanNominal = totalNet;
    
    if (isWakil) {
        wakilPersen = parseFloat(document.getElementById('posWakilPersen').value) || 0;
        wakilNominal = totalNet * (wakilPersen / 100);
        perusahaanNominal = totalNet - wakilNominal;
    }

    var payload = {
        cartItems: cartSnapshot,
        items: cartSnapshot,
        totalGross: grandTotal,
        diskon: diskon,
        pajakNominal: pajakNominal,
        pajakPersen: isPpnActive ? pajakRate : 0,
        totalNet: totalNet,
        isWakil: isWakil,
        wakilPersen: wakilPersen,
        wakilNominal: wakilNominal,
        perusahaanNominal: perusahaanNominal,
        metodeBayar: metode,
        pelangganId: custId,
        namaPelanggan: custName,
        bayarNominal: bayarNominal
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
        bayarNominal: bayarNominal,
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
                    return '• ' + ci.namaProduk + ' (' + ci.qty + 'x) : ' + (window.formatAppCurrency ? window.formatAppCurrency(ci.subtotal) : ('Rp ' + ci.subtotal));
                }).join('\n');

                var userNama = (window.currentUser && (window.currentUser.namaLengkap || window.currentUser.username)) || 'Kasir';
                var teleMsg = '🔔 *PENJUALAN POS BARU - BOS KROCO ERP*\n'
                    + '━━━━━━━━━━━━━━━━━━━━\n'
                    + '🧾 *No. Nota:* `' + (res.trxId || newTrx.id) + '` (' + newTrx.orderNum + ')\n'
                    + '👤 *Pelanggan:* ' + custName + '\n'
                    + '💳 *Metode:* ' + metode + '\n'
                    + '👨‍💼 *Petugas:* ' + userNama + '\n\n'
                    + '📦 *Rincian Belanja:*\n' + itemsText + '\n\n'
                    + '💵 *Subtotal:* ' + (window.formatAppCurrency ? window.formatAppCurrency(grandTotal) : ('Rp ' + grandTotal)) + '\n'
                    + (diskon > 0 ? ('🏷️ *Diskon:* -' + (window.formatAppCurrency ? window.formatAppCurrency(diskon) : ('Rp ' + diskon)) + '\n') : '')
                    + (pajakNominal > 0 ? ('🏛️ *PPN (' + pajakRate + '%):* ' + (window.formatAppCurrency ? window.formatAppCurrency(pajakNominal) : ('Rp ' + pajakNominal)) + '\n') : '')
                    + '💰 *TOTAL BAYAR: ' + (window.formatAppCurrency ? window.formatAppCurrency(totalNet) : ('Rp ' + totalNet)) + '*\n'
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
    if(newQty <= 0) {
        hapusCart(idx);
        return;
    }
    if (window.currentCart && window.currentCart[idx]) {
        var item = window.currentCart[idx];
        item.qty = newQty;
        
        // Cek harga grosir dari master produk
        var prod = (window.catalogProducts || []).find(function(p) { return p.produkId === item.produkId; });
        if (prod && prod.minQtyGrosir && prod.hargaGrosir) {
            if (item.qty >= parseFloat(prod.minQtyGrosir)) {
                item.harga = parseFloat(prod.hargaGrosir);
            } else {
                item.harga = item.hargaDefault || parseFloat(prod.hargaJual);
            }
        }
        
        item.subtotal = item.qty * item.harga;
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
        var priceStr = window.formatAppCurrency(p.hargaJual || 0);
        var stok = p.stokEtalase || 0;
        var grosirBadge = (p.minQtyGrosir && p.hargaGrosir) ? `<div style="position: absolute; top: 6px; left: 6px; background: var(--coral-pink); color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Grosir: ${window.formatAppCurrency(p.hargaGrosir)}</div>` : '';
        
        var div = document.createElement('div');
        div.style.cssText = "background: #ffffff; border: 1px solid var(--border-soft); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; flex-direction: column; align-items: center; position: relative;";
        div.onmouseover = function() { this.style.borderColor = 'var(--violet-main)'; this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 16px rgba(108,71,255,0.1)'; };
        div.onmouseout = function() { this.style.borderColor = 'var(--border-soft)'; this.style.transform = 'none'; this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; };
        div.onclick = function() { tambahKeKeranjangGrid(p.produkId, p.namaProduk, p.hargaJual); };
        
        div.innerHTML = `
            ${grosirBadge}
            <div style="width: 54px; height: 54px; border-radius: 12px; background: #e0e7ff; color: var(--violet-dark); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; margin-bottom: 12px;">
                ${initial}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-dark); text-align: center; margin-bottom: 4px; line-height: 1.3;">${safeNama}</div>
            <div style="font-size: 13px; font-weight: 800; color: var(--emerald);">${priceStr}</div>
            <div style="font-size: 10px; font-weight: 600; color: var(--text-muted); margin-top: 4px;">Sisa Stok: ${stok}</div>
            <div style="position: absolute; top: 12px; right: 12px; background: var(--violet-main); color: #fff; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; opacity: 0.8;">+</div>
        `;
        
        grid.appendChild(div);
    });
};

// Auto-sync Pelanggan to POS Dropdown
window.populatePosCustomers = function() {
    var custSelect = document.getElementById('posCustomer');
    if (custSelect && window._pelangganDataList) {
        custSelect.innerHTML = '<option value="CUST-UMUM">Pelanggan Umum</option>';
        window._pelangganDataList.forEach(function(p) {
            var opt = document.createElement('option');
            opt.value = p.pelanggan_id;
            opt.textContent = p.nama_toko;
            custSelect.appendChild(opt);
        });
    }
};

// Export POS functions to window
window.tambahKeKeranjangGrid = tambahKeKeranjangGrid;
window.renderCart = renderCart;
window.hapusCart = hapusCart;
window.submitTransaksiPOS = submitTransaksiPOS;
window.formatDateNow = formatDateNow;
window.cetakStrukTerakhir = cetakStrukTerakhir;

window.togglePosPaymentInputs = function() {
    var elMetode = document.getElementById('posPaymentMethod');
    var elInputs = document.getElementById('posPaymentInputs');
    if (elMetode && elInputs) {
        if (elMetode.value === 'Tempo' || elMetode.value === 'Tabungan') {
            elInputs.style.display = 'none';
        } else {
            elInputs.style.display = 'block';
        }
    }
};
