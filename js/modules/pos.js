/**
 * ============================================================================
 * BOS KROCO ERP - POINT OF SALE (POS) MODULE
 * File: js/modules/pos.js
 * ============================================================================
 */

window.currentCart = [];

function tambahKeKeranjangGrid(pid, nama, harga) {
    if (!pid || !nama) return;
    
    // Validasi stok etalase produk
    var prod = (window.catalogProducts || []).find(function(p) { return p.produkId === pid; });
    if (pid && !pid.startsWith('PKT-')) {
        var stokTersedia = prod ? (parseFloat(prod.stokEtalase) || 0) : 0;
        if (stokTersedia <= 0) {
            if (typeof showToast === 'function') {
                showToast('Stok "' + nama + '" habis (0)! Tidak dapat transaksi.', 'error');
            }
            return;
        }
        var existingInCart = window.currentCart.find(function(i) { return i.produkId === pid; });
        if (existingInCart && existingInCart.qty >= stokTersedia) {
            if (typeof showToast === 'function') {
                showToast('Jumlah di keranjang sudah mencapai sisa stok maksimum (' + stokTersedia + ' unit)!', 'warning');
            }
            return;
        }
    }
    
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
    
    window.currentPosTotalNet = net;
    if (typeof window.renderPosQuickCashChips === 'function') {
        window.renderPosQuickCashChips(net);
    }
    if (typeof window.updatePosKembalian === 'function') {
        window.updatePosKembalian();
    }
    
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
    
    // Validasi stok seluruh item sebelum memproses transaksi
    for (var k = 0; k < window.currentCart.length; k++) {
        var cartItem = window.currentCart[k];
        if (cartItem.produkId && !cartItem.produkId.startsWith('PKT-')) {
            var pCheck = (window.catalogProducts || []).find(function(p) { return p.produkId === cartItem.produkId; });
            var curStok = pCheck ? (parseFloat(pCheck.stokEtalase) || 0) : 0;
            if (curStok <= 0) {
                return showToast('Transaksi ditolak: Stok "' + cartItem.namaProduk + '" habis (0)!', 'error');
            }
            if (cartItem.qty > curStok) {
                return showToast('Transaksi ditolak: Stok "' + cartItem.namaProduk + '" hanya tersisa ' + curStok + ' unit (permintaan: ' + cartItem.qty + ')!', 'error');
            }
        }
    }
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
    var uangBayar = elUangBayar ? (parseFloat(String(elUangBayar.value).replace(/\D/g, '')) || 0) : 0;
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
    var elUangBayar = document.getElementById('posUangBayar');
    if (elUangBayar) elUangBayar.value = '';
    
    // Kurangi stok lokal etalase dan refresh tampilan grid seketika
    cartSnapshot.forEach(function (ci) {
        if (ci.produkId && !ci.produkId.startsWith('PKT-')) {
            var pMatch = (window.catalogProducts || []).find(function (p) { return p.produkId === ci.produkId; });
            if (pMatch) {
                pMatch.stokEtalase = Math.max(0, (parseFloat(pMatch.stokEtalase) || 0) - (parseFloat(ci.qty) || 1));
            }
        }
    });
    if (typeof window.renderPosProductGrid === 'function') {
        window.renderPosProductGrid();
    }
    
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
        
        // Cek stok etalase
        var prod = (window.catalogProducts || []).find(function(p) { return p.produkId === item.produkId; });
        if (prod && item.produkId && !item.produkId.startsWith('PKT-')) {
            var stokTersedia = parseFloat(prod.stokEtalase) || 0;
            if (stokTersedia <= 0) {
                hapusCart(idx);
                if (typeof showToast === 'function') {
                    showToast('Stok "' + item.namaProduk + '" habis (0)! Item dihapus dari keranjang.', 'error');
                }
                return;
            }
            if (newQty > stokTersedia) {
                newQty = stokTersedia;
                if (typeof showToast === 'function') {
                    showToast('Jumlah dibatasi sesuai sisa stok etalase: ' + stokTersedia + ' unit.', 'warning');
                }
            }
        }
        
        item.qty = newQty;
        
        // Cek harga grosir dari master produk
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
        var stok = parseFloat(p.stokEtalase) || 0;
        var isHabis = stok <= 0;
        
        var grosirBadge = (!isHabis && p.minQtyGrosir && p.hargaGrosir) 
            ? `<div style="position: absolute; top: 6px; left: 6px; background: var(--coral-pink); color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Grosir: ${window.formatAppCurrency(p.hargaGrosir)}</div>` 
            : '';
        var statusBadge = isHabis 
            ? `<div style="position: absolute; top: 6px; left: 6px; background: #ef4444; color: #fff; font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 800; letter-spacing: 0.3px;">STOK HABIS</div>` 
            : grosirBadge;
        
        var div = document.createElement('div');
        if (isHabis) {
            div.style.cssText = "background: #fdf2f2; border: 1.5px solid #fecaca; border-radius: 12px; padding: 16px; cursor: not-allowed; transition: all 0.2s ease; display: flex; flex-direction: column; align-items: center; position: relative; opacity: 0.7;";
            div.onclick = function() { 
                if (typeof showToast === 'function') showToast('Stok produk "' + safeNama + '" habis (0)! Tidak bisa ditambahkan.', 'error'); 
            };
        } else {
            div.style.cssText = "background: #ffffff; border: 1px solid var(--border-soft); border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.02); display: flex; flex-direction: column; align-items: center; position: relative;";
            div.onmouseover = function() { this.style.borderColor = 'var(--violet-main)'; this.style.transform = 'translateY(-2px)'; this.style.boxShadow = '0 6px 16px rgba(108,71,255,0.1)'; };
            div.onmouseout = function() { this.style.borderColor = 'var(--border-soft)'; this.style.transform = 'none'; this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; };
            div.onclick = function() { tambahKeKeranjangGrid(p.produkId, p.namaProduk, p.hargaJual); };
        }
        
        var iconAction = isHabis 
            ? `<div style="position: absolute; top: 12px; right: 12px; background: #fee2e2; color: #ef4444; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px;">✕</div>`
            : `<div style="position: absolute; top: 12px; right: 12px; background: var(--violet-main); color: #fff; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; opacity: 0.8;">+</div>`;

        var stokLabel = isHabis
            ? `<div style="font-size: 10px; font-weight: 800; color: #dc2626; margin-top: 4px; background: #fee2e2; padding: 2px 6px; border-radius: 4px;">Sisa Stok: 0 (Habis)</div>`
            : `<div style="font-size: 10px; font-weight: 600; color: var(--text-muted); margin-top: 4px;">Sisa Stok: ${stok}</div>`;

        div.innerHTML = `
            ${statusBadge}
            <div style="width: 54px; height: 54px; border-radius: 12px; background: ${isHabis ? '#fee2e2' : '#e0e7ff'}; color: ${isHabis ? '#b91c1c' : 'var(--violet-dark)'}; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; margin-bottom: 12px;">
                ${initial}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: ${isHabis ? '#991b1b' : 'var(--text-dark)'}; text-align: center; margin-bottom: 4px; line-height: 1.3;">${safeNama}</div>
            <div style="font-size: 13px; font-weight: 800; color: ${isHabis ? '#991b1b' : 'var(--emerald)'};">${priceStr}</div>
            ${stokLabel}
            ${iconAction}
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

window.handlePosUangInput = function(inputEl) {
    if (!inputEl) return;
    var raw = inputEl.value.replace(/\D/g, '');
    if (!raw) {
        inputEl.value = '';
    } else {
        var num = parseInt(raw, 10);
        inputEl.value = num.toLocaleString('id-ID');
    }
    window.updatePosKembalian();
};

window.posClearUangBayar = function() {
    var el = document.getElementById('posUangBayar');
    if (el) el.value = '';
    window.updatePosKembalian();
};

window.posQuickCash = function(val) {
    var elUangBayar = document.getElementById('posUangBayar');
    if (!elUangBayar) return;
    if (val === 'pas') {
        var net = window.currentPosTotalNet || 0;
        elUangBayar.value = net > 0 ? net.toLocaleString('id-ID') : '';
    } else {
        var num = parseFloat(val) || 0;
        elUangBayar.value = num > 0 ? num.toLocaleString('id-ID') : '';
    }
    window.updatePosKembalian();
};

window.renderPosQuickCashChips = function(total) {
    var group = document.getElementById('posQuickCashGroup');
    if (!group) return;
    
    total = total || window.currentPosTotalNet || 0;
    var chips = [];
    
    if (total <= 0) {
        chips = [10000, 20000, 50000, 100000];
    } else {
        // Rekomendasi pembulatan terdekat
        var r10k = Math.ceil(total / 10000) * 10000;
        if (r10k > total && chips.indexOf(r10k) === -1) {
            chips.push(r10k);
        }
        var r20k = Math.ceil(total / 20000) * 20000;
        if (r20k > total && chips.indexOf(r20k) === -1) {
            chips.push(r20k);
        }
        var r50k = Math.ceil(total / 50000) * 50000;
        if (r50k > total && chips.indexOf(r50k) === -1) {
            chips.push(r50k);
        }
        var r100k = Math.ceil(total / 100000) * 100000;
        if (r100k > total && chips.indexOf(r100k) === -1) {
            chips.push(r100k);
        }
        
        // Standar pecahan uang kertas Indonesia
        var standardNotes = [20000, 50000, 100000, 200000];
        for (var i = 0; i < standardNotes.length; i++) {
            var note = standardNotes[i];
            if (note > total && chips.indexOf(note) === -1 && chips.length < 4) {
                chips.push(note);
            }
        }
        
        chips.sort(function(a, b) { return a - b; });
        chips = chips.slice(0, 4);
    }
    
    var html = '<button type="button" onclick="window.posQuickCash(\'pas\')" class="pos-chip-btn" id="btnChipPas" style="flex: 1.2; min-width: 85px; padding: 7px 10px; font-size: 11.5px; font-weight: 800; border-radius: 8px; border: 1.5px solid #818cf8; background: linear-gradient(135deg, #eef2ff 0%, #ede9fe 100%); color: #4338ca; cursor: pointer; transition: all 0.15s ease; display: inline-flex; align-items: center; justify-content: center;">Uang Pas</button>';
    
    chips.forEach(function(val) {
        var label = val.toLocaleString('id-ID');
        html += '<button type="button" onclick="window.posQuickCash(' + val + ')" class="pos-chip-btn" data-val="' + val + '" style="flex: 1; min-width: 58px; padding: 7px 8px; font-size: 11.5px; font-weight: 700; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #ffffff; color: #334155; cursor: pointer; transition: all 0.15s ease;">' + label + '</button>';
    });
    
    group.innerHTML = html;
};

window.updatePosKembalian = function() {
    var elUangBayar = document.getElementById('posUangBayar');
    var elReset = document.getElementById('posBtnResetUang');
    var elFeedbackBox = document.getElementById('posKembalianFeedbackBox');
    var elFeedbackAmount = document.getElementById('posFeedbackAmount');
    var elSubmitBtn = document.getElementById('posBtnSubmit');
    var elMetode = document.getElementById('posPaymentMethod');
    var isTunai = !elMetode || String(elMetode.value).toLowerCase() === 'tunai';

    var total = window.currentPosTotalNet || 0;
    var rawDigits = elUangBayar ? elUangBayar.value.replace(/\D/g, '') : '';
    var bayarNum = rawDigits ? (parseInt(rawDigits, 10) || 0) : 0;

    if (elReset) {
        elReset.style.display = rawDigits ? 'inline-block' : 'none';
    }

    // Active state highlighting for quick cash chips
    var allChips = document.querySelectorAll('#posQuickCashGroup .pos-chip-btn');
    allChips.forEach(function(chip) {
        if (chip.id === 'btnChipPas') {
            if (bayarNum > 0 && bayarNum === total) {
                chip.style.borderColor = 'var(--violet-main)';
                chip.style.boxShadow = '0 0 0 2px rgba(108,71,255,0.25)';
            } else {
                chip.style.borderColor = '#818cf8';
                chip.style.boxShadow = 'none';
            }
        } else {
            var chipVal = parseFloat(chip.getAttribute('data-val')) || 0;
            if (bayarNum > 0 && bayarNum === chipVal) {
                chip.style.borderColor = 'var(--violet-main)';
                chip.style.background = '#f5f3ff';
                chip.style.color = 'var(--violet-main)';
            } else {
                chip.style.borderColor = '#e2e8f0';
                chip.style.background = '#ffffff';
                chip.style.color = '#334155';
            }
        }
    });

    // Proteksi Tombol Submit jika uang tunai kurang
    if (elSubmitBtn) {
        if (isTunai && rawDigits && bayarNum < total) {
            elSubmitBtn.disabled = true;
            elSubmitBtn.style.opacity = '0.55';
            elSubmitBtn.style.cursor = 'not-allowed';
            elSubmitBtn.style.background = '#94a3b8';
            elSubmitBtn.style.boxShadow = 'none';
            elSubmitBtn.innerHTML = '<svg style="width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg> Uang Belum Cukup';
        } else {
            elSubmitBtn.disabled = false;
            elSubmitBtn.style.opacity = '1';
            elSubmitBtn.style.cursor = 'pointer';
            elSubmitBtn.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
            elSubmitBtn.style.boxShadow = '0 8px 24px -4px rgba(79, 70, 229, 0.35)';
            elSubmitBtn.innerHTML = '<svg style="width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2;" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg> Proses Pembayaran';
        }
    }

    if (!elFeedbackBox || !elFeedbackAmount) return;

    if (!rawDigits || bayarNum <= 0) {
        elFeedbackBox.style.display = 'none';
        return;
    }

    if (total <= 0) {
        elFeedbackBox.style.display = 'none';
        return;
    }

    if (bayarNum > total) {
        var kembali = bayarNum - total;
        elFeedbackBox.style.display = 'flex';
        elFeedbackBox.style.background = '#ecfdf5';
        elFeedbackBox.style.border = '1.5px solid #a7f3d0';
        elFeedbackBox.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.08)';
        elFeedbackAmount.textContent = window.formatAppCurrency(kembali);
        elFeedbackAmount.style.color = '#059669';
    } else if (bayarNum === total) {
        elFeedbackBox.style.display = 'flex';
        elFeedbackBox.style.background = '#f0fdf4';
        elFeedbackBox.style.border = '1.5px solid #bbf7d0';
        elFeedbackBox.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.08)';
        elFeedbackAmount.textContent = 'Rp 0';
        elFeedbackAmount.style.color = '#16a34a';
    } else {
        // bayarNum < total (Kurang -> merah dengan minus)
        var kurang = total - bayarNum;
        elFeedbackBox.style.display = 'flex';
        elFeedbackBox.style.background = '#fef2f2';
        elFeedbackBox.style.border = '1.5px solid #fecaca';
        elFeedbackBox.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.08)';
        elFeedbackAmount.textContent = '- ' + window.formatAppCurrency(kurang);
        elFeedbackAmount.style.color = '#dc2626';
    }
};

window.posHandleEnterSubmit = function() {
    var elUangBayar = document.getElementById('posUangBayar');
    var total = window.currentPosTotalNet || 0;
    var rawDigits = elUangBayar ? elUangBayar.value.replace(/\D/g, '') : '';
    var bayarNum = rawDigits ? (parseInt(rawDigits, 10) || 0) : 0;
    var elMetode = document.getElementById('posPaymentMethod');
    var isTunai = !elMetode || String(elMetode.value).toLowerCase() === 'tunai';

    if (isTunai && rawDigits && bayarNum < total) {
        if (typeof showToast === 'function') {
            showToast('Uang yang dimasukkan belum cukup!', 'warning');
        }
        return;
    }
    submitTransaksiPOS();
};

// Global Hotkeys for POS
if (!window._posHotkeysAttached) {
    window._posHotkeysAttached = true;
    document.addEventListener('keydown', function(e) {
        var posView = document.getElementById('view-pos');
        if (!posView || posView.style.display === 'none') return;
        
        // F2: Fokus langsung ke input uang diterima
        if (e.key === 'F2') {
            e.preventDefault();
            var inputUang = document.getElementById('posUangBayar');
            if (inputUang) {
                inputUang.focus();
                inputUang.select();
            }
            return;
        }
        
        // Escape: Blur input uang
        if (e.key === 'Escape') {
            var inputUang2 = document.getElementById('posUangBayar');
            if (inputUang2 && document.activeElement === inputUang2) {
                inputUang2.blur();
            }
        }
    });
}

window.togglePosPaymentInputs = function() {
    var elMetode = document.getElementById('posPaymentMethod');
    var elInputs = document.getElementById('posPaymentInputs');
    if (elMetode && elInputs) {
        if (elMetode.value === 'Tempo' || elMetode.value === 'Tabungan') {
            elInputs.style.display = 'none';
        } else {
            elInputs.style.display = 'block';
            window.updatePosKembalian();
        }
    }
};
