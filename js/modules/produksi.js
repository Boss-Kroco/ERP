/**
 * ============================================================================
 * BOS KROCO ERP - MODUL HPP PRODUK
 * File: js/modules/produksi.js (repurposed for HPP)
 * ============================================================================
 */

window.hppRincian = {};
try {
    var storedRincian = localStorage.getItem('bos_kroco_hpp_rincian');
    if (storedRincian) window.hppRincian = JSON.parse(storedRincian);
} catch (e) {}

window.hppRiwayatData = [];
try {
    var storedRiwayat = localStorage.getItem('bos_kroco_hpp_riwayat');
    if (storedRiwayat) window.hppRiwayatData = JSON.parse(storedRiwayat);
} catch (e) {}
if (!window.hppRiwayatData || !window.hppRiwayatData.length) {
    window.hppRiwayatData = [
        { tanggal: '2026-09-01', produk: 'Kue Kacang Original', hppLama: 180, hppBaru: 192.46, penyebab: 'Kenaikan harga kacang' }
    ];
}

window.tempBahanBaku = [
    { nama: 'Kacang Tanah', qty: 1, harga: 25000 }
];

window.switchHppTab = function(tabId) {
    var tabs = ['daftar', 'tambah', 'riwayat', 'pengaturan'];
    tabs.forEach(function(t) {
        document.getElementById('hpp-tab-' + t).style.display = (t === tabId) ? 'block' : 'none';
        var btnId = 'btnTabHpp' + t.charAt(0).toUpperCase() + t.slice(1);
        var btn = document.getElementById(btnId);
        if(btn) {
            if(t === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });

    if(tabId === 'daftar') window.renderDaftarHPP();
    if(tabId === 'riwayat') window.renderRiwayatHPP();
    if(tabId === 'tambah') window.initTambahHpp();
};

window.renderDaftarHPP = function() {
    var tbody = document.getElementById('tblDaftarHPP');
    if(!tbody) return;
    tbody.innerHTML = '';

    (window.catalogProducts || []).forEach(function(item) {
        var tr = document.createElement('tr');
        var hpp = item.hargaBeliHPP || 0;
        var jual = item.hargaJual || 0;
        var laba = jual - hpp;
        var margin = jual > 0 ? (laba / jual) * 100 : 0;
        
        tr.innerHTML = `
            <td style="font-weight: 600;">${item.namaProduk}</td>
            <td>${item.produkId}</td>
            <td>${item.satuan}</td>
            <td style="text-align: right; font-weight: bold; color: var(--text-dark);">${window.formatAppCurrency(hpp)}</td>
            <td style="text-align: right;">${window.formatAppCurrency(jual)}</td>
            <td style="text-align: right; color: var(--emerald); font-weight: bold;">${window.formatAppCurrency(laba)}</td>
            <td style="text-align: right; color: var(--violet-main); font-weight: bold;">${margin.toFixed(2)}%</td>
            <td><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${item.status}</span></td>
            <td style="text-align: center;">
                <button class="btn-pill-action btn-pill-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.lihatDetailHpp('${item.produkId}')">Lihat Detail</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.lihatDetailHpp = function(id) {
    var item = (window.catalogProducts || []).find(function(i) { return i.produkId === id; });
    if(!item) return;

    var hpp = item.hargaBeliHPP || 0;
    var jual = item.hargaJual || 0;
    var laba = jual - hpp;
    var margin = jual > 0 ? (laba / jual) * 100 : 0;

    document.getElementById('detHppNamaProduk').textContent = item.namaProduk;
    document.getElementById('detHppNilai').textContent = window.formatAppCurrency(hpp);
    document.getElementById('detHppJual').textContent = window.formatAppCurrency(jual);
    document.getElementById('detHppLaba').textContent = window.formatAppCurrency(laba);
    document.getElementById('detHppMargin').textContent = margin.toFixed(2) + '%';

    window.hppRincian = window.hppRincian || {};
    var r = window.hppRincian[id] || { bahan: hpp };
    document.getElementById('detRincianBahan').textContent = window.formatAppCurrency(r.bahan || 0);
    document.getElementById('detRincianTk').textContent = window.formatAppCurrency(r.tk || 0);
    document.getElementById('detRincianGas').textContent = window.formatAppCurrency(r.gas || 0);
    document.getElementById('detRincianKemasan').textContent = window.formatAppCurrency(r.kemasan || 0);
    document.getElementById('detRincianOverhead').textContent = window.formatAppCurrency ? window.formatAppCurrency((r.overhead || 0) + (r.listrik || 0) + (r.lainnya || 0)) : ('Rp ' + ((r.overhead || 0) + (r.listrik || 0) + (r.lainnya || 0)));

    document.getElementById('modalDetailHpp').style.display = 'flex';
};

window.renderRiwayatHPP = function() {
    var tbody = document.getElementById('tblRiwayatHPP');
    if(!tbody) return;
    tbody.innerHTML = '';

    window.hppRiwayatData.forEach(function(item) {
        var tr = document.createElement('tr');
        var selisih = item.hppBaru - item.hppLama;
        var selisihWarna = selisih > 0 ? 'red' : (selisih < 0 ? 'green' : 'black');
        var selisihTanda = selisih > 0 ? '+' : '';
        
        tr.innerHTML = `
            <td>${item.tanggal}</td>
            <td>${item.produk}</td>
            <td style="text-align: right;">${window.formatAppCurrency(item.hppLama)}</td>
            <td style="text-align: right; font-weight: bold;">${window.formatAppCurrency(item.hppBaru)}</td>
            <td style="text-align: right; color: ${selisihWarna}; font-weight: bold;">${selisihTanda} ${window.formatAppCurrency ? window.formatAppCurrency(Math.abs(selisih)) : ('Rp ' + Math.abs(selisih))}</td>
            <td>${item.penyebab}</td>
        `;
        tbody.appendChild(tr);
    });
};

window.initTambahHpp = function(isProductChange) {
    var sel = document.getElementById('hppSelProduk');
    var currentProds = (window.catalogProducts && window.catalogProducts.length) ? window.catalogProducts : (window.catalogProducts || []);
    if(sel) {
        var curVal = sel.value;
        if(sel.options.length <= 1 || sel.options.length !== (currentProds.length + 1)) {
            var optHtml = '<option value="">-- Pilih Produk --</option>';
            currentProds.forEach(function(p) {
                optHtml += '<option value="' + p.produkId + '">' + (p.namaProduk || '') + ' (' + p.produkId + ')</option>';
            });
            sel.innerHTML = optHtml;
            if(curVal) sel.value = curVal;
        }
    }
    
    // Auto-fill Harga Jual and Restore saved recipe if selected
    if (sel && sel.value) {
        var prdId = sel.value;
        var prd = (window.catalogProducts || []).find(function(p) { return p.produkId === prdId; });
        var cfg = window.getAppCurrencyConfig ? window.getAppCurrencyConfig() : { exchangeRate: 1 };
        
        var elHj = document.getElementById('hppHargaJual');
        if (isProductChange && elHj) {
            delete elHj.dataset.modified;
        }

        if (prd) {
            if (elHj && !elHj.dataset.modified) {
                var hjCurr = window.toAppCurrency ? window.toAppCurrency(prd.hargaJual || 0) : (prd.hargaJual || 0);
                elHj.value = parseFloat(hjCurr.toFixed(2));
            }
            var elHmg = document.getElementById('hppMinGrosir');
            if (elHmg) elHmg.value = prd.minQtyGrosir || '';
            var elHhg = document.getElementById('hppHargaGrosir');
            if (elHhg) {
                var hgCurr = prd.hargaGrosir ? (window.toAppCurrency ? window.toAppCurrency(prd.hargaGrosir) : prd.hargaGrosir) : '';
                elHhg.value = hgCurr ? parseFloat(Number(hgCurr).toFixed(2)) : '';
            }
        }

        window.hppRincian = window.hppRincian || {};
        var savedState = window.hppRincian[prdId];
        
        if (savedState && savedState.bahanList && savedState.bahanList.length) {
            window.tempBahanBaku = JSON.parse(JSON.stringify(savedState.bahanList));
            // Konversi nilai tersimpan ke mata uang aktif saat ini jika berbeda
            var savedRate = savedState.exchangeRate || 1;
            var currentRate = cfg.exchangeRate || 1;
            var rateMultiplier = savedRate / currentRate;
            
            if (Math.abs(rateMultiplier - 1) > 0.001) {
                window.tempBahanBaku.forEach(function(b) {
                    b.harga = parseFloat((Number(b.harga || 0) * rateMultiplier).toFixed(2));
                });
            }

            if (savedState.rawBiaya) {
                var rb = savedState.rawBiaya;
                ['tk', 'gas', 'listrik', 'kemasan', 'overhead', 'lainnya'].forEach(function(k) {
                    var inputId = 'hppBiaya' + k.charAt(0).toUpperCase() + k.slice(1);
                    var el = document.getElementById(inputId);
                    if (el) {
                        var rawVal = Number(rb[k] || 0);
                        var convertedVal = Math.abs(rateMultiplier - 1) > 0.001 ? (rawVal * rateMultiplier) : rawVal;
                        el.value = convertedVal ? parseFloat(convertedVal.toFixed(2)) : 0;
                    }
                });
                if (document.getElementById('hppJmlProduksi')) {
                    document.getElementById('hppJmlProduksi').value = savedState.rawBiaya.jmlProd || 1;
                }
            }
        } else {
            // Jika belum ada resep tersimpan, cek apakah user sudah mengisi sesuatu di form sebelumnya
            var hasExistingData = window.tempBahanBaku && window.tempBahanBaku.some(function(b) { return (b.nama || b.harga > 0); });
            if (!hasExistingData) {
                window.tempBahanBaku = [{ nama: 'Bahan Baku 1', qty: 1, harga: 0 }];
                ['hppBiayaTk', 'hppBiayaGas', 'hppBiayaListrik', 'hppBiayaKemasan', 'hppBiayaOverhead', 'hppBiayaLain'].forEach(function(id) {
                    if (document.getElementById(id)) document.getElementById(id).value = 0;
                });
                if (document.getElementById('hppJmlProduksi')) document.getElementById('hppJmlProduksi').value = 1;
            }
        }
    } else {
        if (!window.tempBahanBaku || !window.tempBahanBaku.length) {
            window.tempBahanBaku = [{ nama: 'Bahan Baku 1', qty: 1, harga: 0 }];
        }
    }

    if (typeof window.updateAppCurrencyUI === 'function') window.updateAppCurrencyUI();
    window.renderHppBahanBaku();
    if(typeof window.kalkulasiTotalHpp === 'function') window.kalkulasiTotalHpp();
};

window.syncHppBahanFromDOM = function() {
    var tbody = document.getElementById('bodyHppBahanBaku');
    if(!tbody) return window.tempBahanBaku || [];
    var rows = tbody.querySelectorAll('tr');
    if(!rows.length) return window.tempBahanBaku || [];

    var list = [];
    rows.forEach(function(r) {
        var nEl = r.querySelector('.input-hpp-nama');
        var qEl = r.querySelector('.input-hpp-qty');
        var hEl = r.querySelector('.input-hpp-harga');
        list.push({
            nama: nEl ? nEl.value.trim() : '',
            qty: qEl ? (parseFloat(qEl.value) || 0) : 1,
            harga: hEl ? (parseFloat(hEl.value) || 0) : 0
        });
    });
    window.tempBahanBaku = list;
    return list;
};

window.onHppBahanInput = function(idx) {
    var tbody = document.getElementById('bodyHppBahanBaku');
    if (!tbody) return;
    var rows = tbody.querySelectorAll('tr');
    var targetRow = rows[idx];
    if (!targetRow) return;

    var namaEl = targetRow.querySelector('.input-hpp-nama');
    var qtyEl = targetRow.querySelector('.input-hpp-qty');
    var hargaEl = targetRow.querySelector('.input-hpp-harga');
    var subEl = targetRow.querySelector('.cell-hpp-subtotal');

    var nama = namaEl ? namaEl.value : '';
    var qty = qtyEl ? (parseFloat(qtyEl.value) || 0) : 0;
    var harga = hargaEl ? (parseFloat(hargaEl.value) || 0) : 0;
    var sub = qty * harga;

    if (!window.tempBahanBaku[idx]) window.tempBahanBaku[idx] = {};
    window.tempBahanBaku[idx].nama = nama;
    window.tempBahanBaku[idx].qty = qtyEl && qtyEl.value !== '' ? qtyEl.value : 0;
    window.tempBahanBaku[idx].harga = hargaEl && hargaEl.value !== '' ? hargaEl.value : 0;

    if (subEl) {
        subEl.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(sub) : window.formatAppCurrency(sub);
    }

    // Hitung total dari seluruh baris aktif di DOM
    var totalBahan = 0;
    rows.forEach(function(r) {
        var q = parseFloat((r.querySelector('.input-hpp-qty') || {}).value) || 0;
        var h = parseFloat((r.querySelector('.input-hpp-harga') || {}).value) || 0;
        totalBahan += (q * h);
    });

    var lblTotalBahan = document.getElementById('lblHppTotalBahan');
    if (lblTotalBahan) {
        lblTotalBahan.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(totalBahan) : window.formatAppCurrency(totalBahan);
        lblTotalBahan.dataset.val = totalBahan;
    }

    window.kalkulasiTotalHpp();
};

window.renderHppBahanBaku = function() {
    var tbody = document.getElementById('bodyHppBahanBaku');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if (!window.tempBahanBaku || !window.tempBahanBaku.length) {
        window.tempBahanBaku = [{ nama: 'Bahan Baku 1', qty: 1, harga: 0 }];
    }

    var totalBahan = 0;
    window.tempBahanBaku.forEach(function(item, idx) {
        var qVal = item.qty !== undefined && item.qty !== '' ? item.qty : 1;
        var hVal = item.harga !== undefined && item.harga !== '' ? item.harga : 0;
        var sub = (parseFloat(qVal) || 0) * (parseFloat(hVal) || 0);
        totalBahan += sub;
        var safeNama = (item.nama || '').replace(/"/g, '&quot;');
        
        var tr = document.createElement('tr');
        tr.dataset.idx = idx;
        tr.innerHTML = `
            <td><input type="text" class="hpp-clean-input input-hpp-nama" style="width: 100%; min-width: 120px;" placeholder="Nama bahan..." value="${safeNama}" oninput="window.onHppBahanInput(${idx})"></td>
            <td><input type="number" step="any" min="0" class="hpp-clean-input input-hpp-qty" style="text-align: center; width: 90px; padding: 4px;" value="${qVal}" oninput="window.onHppBahanInput(${idx})"></td>
            <td><input type="number" step="any" min="0" class="hpp-clean-input input-hpp-harga" style="text-align: right; width: 100px; padding: 4px;" value="${hVal}" oninput="window.onHppBahanInput(${idx})"></td>
            <td class="cell-hpp-subtotal" style="font-weight: 700; text-align: right; color: var(--text-dark);">${window.formatAppCurrencyValue ? window.formatAppCurrencyValue(sub) : window.formatAppCurrency(sub)}</td>
            <td style="text-align: center;">
                <button type="button" style="border: none; background: #fff1f2; color: #e11d48; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center;" onclick="window.hapusHppBahan(${idx})" title="Hapus bahan">
                    <svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    var lblTotalBahan = document.getElementById('lblHppTotalBahan');
    if (lblTotalBahan) {
        lblTotalBahan.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(totalBahan) : window.formatAppCurrency(totalBahan);
        lblTotalBahan.dataset.val = totalBahan;
    }
    window.kalkulasiTotalHpp();
};

window.updateHppBahan = function(idx, field, value) {
    if(field === 'qty' || field === 'harga') value = parseFloat(value) || 0;
    if (!window.tempBahanBaku[idx]) window.tempBahanBaku[idx] = {};
    window.tempBahanBaku[idx][field] = value;
    window.renderHppBahanBaku();
};

window.addHppBahanBaku = function() {
    window.syncHppBahanFromDOM();
    if (!window.tempBahanBaku) window.tempBahanBaku = [];
    window.tempBahanBaku.push({ nama: '', qty: 1, harga: 0 });
    window.renderHppBahanBaku();
    setTimeout(function() {
        var tbody = document.getElementById('bodyHppBahanBaku');
        if (tbody) {
            var inputs = tbody.querySelectorAll('.input-hpp-nama');
            if (inputs.length) inputs[inputs.length - 1].focus();
        }
    }, 50);
};

window.hapusHppBahan = function(idx) {
    window.syncHppBahanFromDOM();
    if (window.tempBahanBaku && window.tempBahanBaku.length > idx) {
        window.tempBahanBaku.splice(idx, 1);
    }
    if (!window.tempBahanBaku.length) {
        window.tempBahanBaku = [{ nama: '', qty: 1, harga: 0 }];
    }
    window.renderHppBahanBaku();
};

window.kalkulasiTotalHpp = function() {
    var lblTotalBahan = document.getElementById('lblHppTotalBahan');
    var totalBahan = 0;
    if (lblTotalBahan && lblTotalBahan.dataset.val !== undefined && !isNaN(parseFloat(lblTotalBahan.dataset.val))) {
        totalBahan = parseFloat(lblTotalBahan.dataset.val);
    } else {
        (window.tempBahanBaku || []).forEach(function(b) {
            totalBahan += (parseFloat(b.qty) || 0) * (parseFloat(b.harga) || 0);
        });
    }
    
    var bTk = parseFloat((document.getElementById('hppBiayaTk') || {}).value) || 0;
    var bGas = parseFloat((document.getElementById('hppBiayaGas') || {}).value) || 0;
    var bListrik = parseFloat((document.getElementById('hppBiayaListrik') || {}).value) || 0;
    var bKemasan = parseFloat((document.getElementById('hppBiayaKemasan') || {}).value) || 0;
    var bOverhead = parseFloat((document.getElementById('hppBiayaOverhead') || {}).value) || 0;
    var bLain = parseFloat((document.getElementById('hppBiayaLain') || {}).value) || 0;
    
    var totalProduksi = bTk + bGas + bListrik + bKemasan + bOverhead + bLain;
    var lblTotalProd = document.getElementById('lblHppTotalProduksi');
    if (lblTotalProd) lblTotalProd.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(totalProduksi) : window.formatAppCurrency(totalProduksi);
    
    var grandTotal = totalBahan + totalProduksi;
    var lblGrandTotal = document.getElementById('lblHppGrandTotal');
    if (lblGrandTotal) lblGrandTotal.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(grandTotal) : window.formatAppCurrency(grandTotal);
    
    var jmlProd = parseFloat((document.getElementById('hppJmlProduksi') || {}).value) || 1;
    if (jmlProd <= 0 || isNaN(jmlProd)) jmlProd = 1;

    var hppItem = grandTotal / jmlProd;
    if (isNaN(hppItem) || !isFinite(hppItem)) hppItem = 0;
    
    var lblPerItem = document.getElementById('lblHppPerItem');
    if (lblPerItem) lblPerItem.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(hppItem) : window.formatAppCurrency(hppItem);
    
    window.tempHppResult = {
        totalBahan: totalBahan,
        bTk: bTk, bGas: bGas, bListrik: bListrik, bKemasan: bKemasan, bOverhead: bOverhead, bLain: bLain,
        grandTotal: grandTotal,
        jmlProd: jmlProd,
        hppItem: hppItem
    };
};

window.simpanHppBaru = function() {
    var sel = document.getElementById('hppSelProduk');
    if (!sel || !sel.value) {
        if(window.showToast) window.showToast('Pilih produk terlebih dahulu!', 'error');
        if (sel) sel.focus();
        return;
    }
    var selId = sel.value;
    var prd = (window.catalogProducts || []).find(function(p) { return p.produkId === selId; });
    
    if(!prd) {
        if(window.showToast) window.showToast('Produk yang dipilih tidak ditemukan!', 'error');
        return;
    }
    
    // Pastikan seluruh input di tabel disinkronkan dan dikalkulasi ulang
    window.syncHppBahanFromDOM();
    window.kalkulasiTotalHpp();

    var cfg = window.getAppCurrencyConfig ? window.getAppCurrencyConfig() : { exchangeRate: 1 };
    var res = window.tempHppResult;
    
    if (!res || res.hppItem === undefined || isNaN(res.hppItem)) {
        if(window.showToast) window.showToast('Silakan lengkapi tabel bahan baku dan biaya terlebih dahulu!', 'error');
        return;
    }
    
    var hargaJualInput = document.getElementById('hppHargaJual');
    var hargaJualCurr = hargaJualInput ? (parseFloat(hargaJualInput.value) || 0) : 0;
    if (hargaJualCurr <= 0 && prd.hargaJual) {
        hargaJualCurr = window.toAppCurrency ? window.toAppCurrency(prd.hargaJual) : prd.hargaJual;
    }

    var minGrosirInput = document.getElementById('hppMinGrosir');
    var minGrosirValue = (minGrosirInput && minGrosirInput.value !== '') ? parseFloat(minGrosirInput.value) : (prd.minQtyGrosir || 0);
    
    var hargaGrosirInput = document.getElementById('hppHargaGrosir');
    var hargaGrosirCurr = (hargaGrosirInput && hargaGrosirInput.value !== '') ? parseFloat(hargaGrosirInput.value) : (prd.hargaGrosir || 0);

    // Nilai dalam base IDR untuk disimpan ke master database
    var hppItemBaseIdr = Math.round(window.fromAppCurrency ? window.fromAppCurrency(res.hppItem) : res.hppItem);
    var hargaJualBaseIdr = Math.round(window.fromAppCurrency ? window.fromAppCurrency(hargaJualCurr) : hargaJualCurr);
    var hargaGrosirBaseIdr = Math.round(window.fromAppCurrency ? window.fromAppCurrency(hargaGrosirCurr) : hargaGrosirCurr);

    var jmlProdSafe = res.jmlProd > 0 ? res.jmlProd : 1;

    // Save recipe details in memory and localStorage (dengan exchangeRate untuk konversi antar kurs)
    window.hppRincian = window.hppRincian || {};
    window.hppRincian[selId] = {
        exchangeRate: cfg.exchangeRate || 1,
        bahan: res.totalBahan / jmlProdSafe,
        tk: res.bTk / jmlProdSafe,
        gas: res.bGas / jmlProdSafe,
        listrik: res.bListrik / jmlProdSafe,
        kemasan: res.bKemasan / jmlProdSafe,
        overhead: res.bOverhead / jmlProdSafe,
        lainnya: res.bLain / jmlProdSafe,
        bahanList: JSON.parse(JSON.stringify(window.tempBahanBaku)),
        rawBiaya: {
            tk: res.bTk,
            gas: res.bGas,
            listrik: res.bListrik,
            kemasan: res.bKemasan,
            overhead: res.bOverhead,
            lainnya: res.bLain,
            jmlProd: jmlProdSafe
        }
    };
    try {
        localStorage.setItem('bos_kroco_hpp_rincian', JSON.stringify(window.hppRincian));
    } catch(e) {}
    
    var payload = {
        produkId: prd.produkId,
        namaProduk: prd.namaProduk,
        satuan: prd.satuan || 'Pcs',
        hargaBeliHPP: hppItemBaseIdr || 0,
        hargaJual: hargaJualBaseIdr || 0,
        minQtyGrosir: minGrosirValue,
        hargaGrosir: hargaGrosirBaseIdr,
        status: prd.status || 'Aktif'
    };

    if (window.showToast) window.showToast('Menyimpan HPP produk ke database...', 'info');

    if (window.runBackend) {
        window.runBackend('apiUpdateProduct', [payload, window.currentUser], function(apiRes) {
            if (!apiRes || apiRes.success === false) {
                var errTxt = (apiRes && apiRes.message) ? apiRes.message : 'Gagal memperbarui produk di database';
                if(window.showToast) window.showToast(errTxt, 'error');
                return;
            }

            // Update local memory
            var oldHpp = prd.hargaBeliHPP || 0;
            prd.hargaBeliHPP = hppItemBaseIdr || 0;
            prd.hargaJual = hargaJualBaseIdr || 0;
            prd.minQtyGrosir = minGrosirValue;
            prd.hargaGrosir = hargaGrosirBaseIdr;

            if (window.catalogProducts) {
                var cPrd = window.catalogProducts.find(function(p) { return p.produkId === selId; });
                if (cPrd) {
                    cPrd.hargaBeliHPP = prd.hargaBeliHPP;
                    cPrd.hargaJual = prd.hargaJual;
                    cPrd.minQtyGrosir = prd.minQtyGrosir;
                    cPrd.hargaGrosir = prd.hargaGrosir;
                }
            }

            // Also keep mock catalogProducts synced in localStorage
            try {
                localStorage.setItem('bos_kroco_catalog_products', JSON.stringify(window.catalogProducts));
            } catch(e) {}

            var today = new Date().toISOString().split('T')[0];
            window.hppRiwayatData = window.hppRiwayatData || [];
            window.hppRiwayatData.unshift({
                tanggal: today,
                produk: prd.namaProduk,
                hppLama: oldHpp,
                hppBaru: res.hppItem,
                penyebab: 'Kalkulasi ulang via form HPP'
            });
            try {
                localStorage.setItem('bos_kroco_hpp_riwayat', JSON.stringify(window.hppRiwayatData));
            } catch(e) {}

            if(window.populateProductDropdowns) window.populateProductDropdowns();
            if(window.renderMasterProdukTable) window.renderMasterProdukTable();
            if(window.renderDaftarHPP) window.renderDaftarHPP();
            if(window.showToast) window.showToast('HPP dan Harga Jual ' + prd.namaProduk + ' berhasil disimpan!', 'success');
            window.switchHppTab('daftar');
        }, function(err) {
            if(window.showToast) window.showToast('Gagal menyimpan HPP: ' + (err.message || 'Error koneksi database'), 'error');
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if(window.renderDaftarHPP) window.renderDaftarHPP();
    }, 500);
});

window.simpanProdukBaruHpp = function() {
    var namaEl = document.getElementById('newProdNamaHpp') || document.getElementById('newProdNama');
    var skuEl = document.getElementById('newProdSkuHpp') || document.getElementById('newProdSku');
    var satuanEl = document.getElementById('newProdSatuanHpp') || document.getElementById('newProdSatuan');
    var hargaEl = document.getElementById('newProdHargaHpp') || document.getElementById('newProdHarga');

    var nama = namaEl ? namaEl.value.trim() : '';
    var sku = skuEl ? skuEl.value.trim() : '';
    var satuan = satuanEl ? satuanEl.value.trim() : 'Pcs';
    var harga = hargaEl ? (parseFloat(hargaEl.value) || 0) : 0;

    if(!nama) {
        if(window.showToast) window.showToast('Nama produk harus diisi!', 'error');
        return;
    }

    if(!satuan) satuan = 'Pcs';

    var payload = {
        namaProduk: nama,
        satuan: satuan,
        hargaBeliHPP: 0,
        hargaJual: harga
    };

    if (window.runBackend) {
        window.showToast('Menyimpan produk ke master...', 'info');
        window.runBackend('apiSaveProduct', [payload, window.currentUser], function (res) {
            if (!res.success) {
                if(window.showToast) window.showToast(res.message || 'Gagal menyimpan produk.', 'error');
                return;
            }
            
            var newProdItem = {
                produkId: res.produkId,
                namaProduk: payload.namaProduk,
                satuan: payload.satuan,
                hargaBeliHPP: payload.hargaBeliHPP,
                hargaJual: payload.hargaJual,
                stokEtalase: 0,
                stokGudang: 0,
                status: 'Aktif'
            };

            if (!window.catalogProducts) window.catalogProducts = [];
            window.catalogProducts.unshift(newProdItem);
            
            if(window.renderMasterProdukTable) window.renderMasterProdukTable();
            if(window.populateProductDropdowns) window.populateProductDropdowns();
            
            // Set newly created product in dropdown and init
            var sel = document.getElementById('hppSelProduk');
            if(sel) {
                if(typeof window.initTambahHpp === 'function') window.initTambahHpp();
                sel.value = res.produkId;
                if(typeof window.initTambahHpp === 'function') window.initTambahHpp();
            }
            
            window.renderDaftarHPP();
            
            // Reset Form
            if(namaEl) namaEl.value = '';
            if(skuEl) skuEl.value = '';
            if(hargaEl) hargaEl.value = '';
            
            var modal = document.getElementById('modalTambahJenisHpp');
            if(modal) modal.style.display = 'none';
            if(window.showToast) window.showToast('Produk Makanan Baru berhasil ditambahkan ke Master Produk!', 'success');
        }, function(err) {
            if(window.showToast) window.showToast('Gagal menyimpan produk: ' + (err.message || 'Error koneksi'), 'error');
        });
    }
};
