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

window.initTambahHpp = function() {
    var sel = document.getElementById('hppSelProduk');
    var currentProds = (window.catalogProducts && window.catalogProducts.length) ? window.catalogProducts : (window.catalogProducts || []);
    if(sel) {
        var curVal = sel.value;
        if(sel.options.length <= 1 || sel.options.length !== (currentProds.length + 1)) {
            var optHtml = '<option value="">-- Pilih Produk --</option>';
            currentProds.forEach(function(p) {
                optHtml += '<option value="' + p.produkId + '">' + p.namaProduk + ' (' + p.produkId + ')</option>';
            });
            sel.innerHTML = optHtml;
            if(curVal) sel.value = curVal;
        }
    }
    
    // Auto-fill Harga Jual and Restore saved recipe if selected
    if (sel && sel.value) {
        var prdId = sel.value;
        var prd = (window.catalogProducts || []).find(function(p) { return p.produkId === prdId; });
        if (prd) {
            var elHj = document.getElementById('hppHargaJual');
            if (elHj && !elHj.dataset.modified) elHj.value = prd.hargaJual || 0;
            var elHmg = document.getElementById('hppMinGrosir');
            if (elHmg) elHmg.value = prd.minQtyGrosir || '';
            var elHhg = document.getElementById('hppHargaGrosir');
            if (elHhg) elHhg.value = prd.hargaGrosir || '';
        }

        window.hppRincian = window.hppRincian || {};
        var savedState = window.hppRincian[prdId];
        
        if (savedState && savedState.bahanList) {
            window.tempBahanBaku = JSON.parse(JSON.stringify(savedState.bahanList));
            if (savedState.rawBiaya) {
                if (document.getElementById('hppBiayaTk')) document.getElementById('hppBiayaTk').value = savedState.rawBiaya.tk || '';
                if (document.getElementById('hppBiayaGas')) document.getElementById('hppBiayaGas').value = savedState.rawBiaya.gas || '';
                if (document.getElementById('hppBiayaListrik')) document.getElementById('hppBiayaListrik').value = savedState.rawBiaya.listrik || '';
                if (document.getElementById('hppBiayaKemasan')) document.getElementById('hppBiayaKemasan').value = savedState.rawBiaya.kemasan || '';
                if (document.getElementById('hppBiayaOverhead')) document.getElementById('hppBiayaOverhead').value = savedState.rawBiaya.overhead || '';
                if (document.getElementById('hppBiayaLain')) document.getElementById('hppBiayaLain').value = savedState.rawBiaya.lainnya || '';
                if (document.getElementById('hppJmlProduksi')) document.getElementById('hppJmlProduksi').value = savedState.rawBiaya.jmlProd || 1;
            }
        } else {
            // Reset to defaults
            window.tempBahanBaku = [{ nama: 'Bahan Baku 1', qty: 1, harga: 0 }];
            ['hppBiayaTk', 'hppBiayaGas', 'hppBiayaListrik', 'hppBiayaKemasan', 'hppBiayaOverhead', 'hppBiayaLain'].forEach(function(id) {
                if (document.getElementById(id)) document.getElementById(id).value = '';
            });
            if (document.getElementById('hppJmlProduksi')) document.getElementById('hppJmlProduksi').value = 1;
        }
    } else {
        // Clear if no selection
        window.tempBahanBaku = [];
    }

    window.renderHppBahanBaku();
    if(typeof window.kalkulasiTotalHpp === 'function') window.kalkulasiTotalHpp();
};

window.renderHppBahanBaku = function() {
    var tbody = document.getElementById('bodyHppBahanBaku');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    var totalBahan = 0;
    window.tempBahanBaku.forEach(function(item, idx) {
        var sub = item.qty * item.harga;
        totalBahan += sub;
        var tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="hpp-clean-input" style="width: 100%; min-width: 120px;" value="${item.nama}" onchange="window.updateHppBahan(${idx}, 'nama', this.value)"></td>
            <td><input type="number" step="any" class="hpp-clean-input" style="text-align: center; width: 90px; padding: 4px;" value="${item.qty}" onchange="window.updateHppBahan(${idx}, 'qty', this.value)"></td>
            <td><input type="number" step="any" class="hpp-clean-input" style="text-align: right; width: 100px; padding: 4px;" value="${item.harga}" onchange="window.updateHppBahan(${idx}, 'harga', this.value)"></td>
            <td style="font-weight: 700; text-align: right; color: var(--text-dark);">${window.formatAppCurrency(sub)}</td>
            <td style="text-align: center;">
                <button style="border: none; background: #fff1f2; color: #e11d48; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center;" onclick="window.hapusHppBahan(${idx})">
                    <svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('lblHppTotalBahan').textContent = window.formatAppCurrency(totalBahan);
    document.getElementById('lblHppTotalBahan').dataset.val = totalBahan;
    window.kalkulasiTotalHpp();
};

window.updateHppBahan = function(idx, field, value) {
    if(field === 'qty' || field === 'harga') value = parseFloat(value) || 0;
    window.tempBahanBaku[idx][field] = value;
    window.renderHppBahanBaku();
};

window.addHppBahanBaku = function() {
    window.tempBahanBaku.push({ nama: '', qty: 1, harga: 0 });
    window.renderHppBahanBaku();
};

window.hapusHppBahan = function(idx) {
    window.tempBahanBaku.splice(idx, 1);
    window.renderHppBahanBaku();
};

window.kalkulasiTotalHpp = function() {
    var lblTotalBahan = document.getElementById('lblHppTotalBahan');
    var totalBahan = lblTotalBahan ? parseFloat(lblTotalBahan.dataset.val || 0) : 0;
    
    var bTk = parseFloat((document.getElementById('hppBiayaTk') || {}).value) || 0;
    var bGas = parseFloat((document.getElementById('hppBiayaGas') || {}).value) || 0;
    var bListrik = parseFloat((document.getElementById('hppBiayaListrik') || {}).value) || 0;
    var bKemasan = parseFloat((document.getElementById('hppBiayaKemasan') || {}).value) || 0;
    var bOverhead = parseFloat((document.getElementById('hppBiayaOverhead') || {}).value) || 0;
    var bLain = parseFloat((document.getElementById('hppBiayaLain') || {}).value) || 0;
    
    var totalProduksi = bTk + bGas + bListrik + bKemasan + bOverhead + bLain;
    var lblTotalProd = document.getElementById('lblHppTotalProduksi');
    if (lblTotalProd) lblTotalProd.textContent = window.formatAppCurrency(totalProduksi);
    
    var grandTotal = totalBahan + totalProduksi;
    var lblGrandTotal = document.getElementById('lblHppGrandTotal');
    if (lblGrandTotal) lblGrandTotal.textContent = window.formatAppCurrency(grandTotal);
    
    var jmlProd = parseFloat((document.getElementById('hppJmlProduksi') || {}).value) || 1;
    var hppItem = grandTotal / jmlProd;
    
    var lblPerItem = document.getElementById('lblHppPerItem');
    if (lblPerItem) lblPerItem.textContent = window.formatAppCurrency(hppItem);
    
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
        return;
    }
    var selId = sel.value;
    var prd = (window.catalogProducts || []).find(function(p) { return p.produkId === selId; });
    
    if(!prd) {
        if(window.showToast) window.showToast('Pilih produk terlebih dahulu!', 'error');
        return;
    }
    
    var oldHpp = prd.hargaBeliHPP || 0;
    var res = window.tempHppResult;
    
    if (!res || res.hppItem === undefined) {
        if(window.showToast) window.showToast('Silakan lengkapi tabel bahan baku terlebih dahulu!', 'error');
        return;
    }
    
    var hargaJualInput = document.getElementById('hppHargaJual');
    var hargaJualValue = hargaJualInput ? (parseFloat(hargaJualInput.value) || prd.hargaJual) : prd.hargaJual;

    var minGrosirInput = document.getElementById('hppMinGrosir');
    var minGrosirValue = (minGrosirInput && minGrosirInput.value !== '') ? parseFloat(minGrosirInput.value) : (prd.minQtyGrosir || 0);
    
    var hargaGrosirInput = document.getElementById('hppHargaGrosir');
    var hargaGrosirValue = (hargaGrosirInput && hargaGrosirInput.value !== '') ? parseFloat(hargaGrosirInput.value) : (prd.hargaGrosir || 0);

    // Save recipe details in memory and localStorage
    window.hppRincian = window.hppRincian || {};
    window.hppRincian[selId] = {
        bahan: res.totalBahan / res.jmlProd,
        tk: res.bTk / res.jmlProd,
        gas: res.bGas / res.jmlProd,
        listrik: res.bListrik / res.jmlProd,
        kemasan: res.bKemasan / res.jmlProd,
        overhead: res.bOverhead / res.jmlProd,
        lainnya: res.bLain / res.jmlProd,
        bahanList: JSON.parse(JSON.stringify(window.tempBahanBaku)),
        rawBiaya: {
            tk: res.bTk,
            gas: res.bGas,
            listrik: res.bListrik,
            kemasan: res.bKemasan,
            overhead: res.bOverhead,
            lainnya: res.bLain,
            jmlProd: res.jmlProd
        }
    };
    try {
        localStorage.setItem('bos_kroco_hpp_rincian', JSON.stringify(window.hppRincian));
    } catch(e) {}
    
    var payload = {
        produkId: prd.produkId,
        namaProduk: prd.namaProduk,
        satuan: prd.satuan,
        hargaBeliHPP: res.hppItem || 0,
        hargaJual: hargaJualValue || 0,
        minQtyGrosir: minGrosirValue,
        hargaGrosir: hargaGrosirValue,
        status: prd.status
    };

    if (window.showToast) window.showToast('Menyimpan HPP produk ke database...', 'info');

    if (window.runBackend) {
        window.runBackend('apiUpdateProduct', [payload, window.currentUser], function(apiRes) {
            // Update local memory
            prd.hargaBeliHPP = res.hppItem || 0;
            prd.hargaJual = hargaJualValue || 0;
            prd.minQtyGrosir = minGrosirValue;
            prd.hargaGrosir = hargaGrosirValue;

            if (window.catalogProducts) {
                var cPrd = window.catalogProducts.find(function(p) { return p.produkId === selId; });
                if (cPrd) {
                    cPrd.hargaBeliHPP = prd.hargaBeliHPP;
                    cPrd.hargaJual = prd.hargaJual;
                    cPrd.minQtyGrosir = prd.minQtyGrosir;
                    cPrd.hargaGrosir = prd.hargaGrosir;
                }
            }

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
            if(window.showToast) window.showToast('HPP dan Harga Jual berhasil disimpan ke database!', 'success');
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
