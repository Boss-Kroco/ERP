/**
 * ============================================================================
 * BOS KROCO ERP - MODUL HPP PRODUK
 * File: js/modules/produksi.js (repurposed for HPP)
 * ============================================================================
 */

window.hppRincian = window.hppRincian || {};

window.hppRiwayatData = [
    { tanggal: '2026-09-01', produk: 'Kue Kacang Original', hppLama: 180, hppBaru: 192.46, penyebab: 'Kenaikan harga kacang' }
];

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
            <td style="text-align: right; font-weight: bold; color: var(--text-dark);">${window.formatRupiah ? window.formatRupiah(hpp) : ('Rp ' + hpp)}</td>
            <td style="text-align: right;">${window.formatRupiah ? window.formatRupiah(jual) : ('Rp ' + jual)}</td>
            <td style="text-align: right; color: var(--emerald); font-weight: bold;">${window.formatRupiah ? window.formatRupiah(laba) : ('Rp ' + laba)}</td>
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
    document.getElementById('detHppNilai').textContent = window.formatRupiah ? window.formatRupiah(hpp) : ('Rp ' + hpp);
    document.getElementById('detHppJual').textContent = window.formatRupiah ? window.formatRupiah(jual) : ('Rp ' + jual);
    document.getElementById('detHppLaba').textContent = window.formatRupiah ? window.formatRupiah(laba) : ('Rp ' + laba);
    document.getElementById('detHppMargin').textContent = margin.toFixed(2) + '%';

    window.hppRincian = window.hppRincian || {};
    var r = window.hppRincian[id] || { bahan: hpp };
    document.getElementById('detRincianBahan').textContent = window.formatRupiah ? window.formatRupiah(r.bahan || 0) : ('Rp ' + r.bahan);
    document.getElementById('detRincianTk').textContent = window.formatRupiah ? window.formatRupiah(r.tk || 0) : ('Rp ' + r.tk);
    document.getElementById('detRincianGas').textContent = window.formatRupiah ? window.formatRupiah(r.gas || 0) : ('Rp ' + r.gas);
    document.getElementById('detRincianKemasan').textContent = window.formatRupiah ? window.formatRupiah(r.kemasan || 0) : ('Rp ' + r.kemasan);
    document.getElementById('detRincianOverhead').textContent = window.formatRupiah ? window.formatRupiah((r.overhead || 0) + (r.listrik || 0) + (r.lainnya || 0)) : ('Rp ' + ((r.overhead || 0) + (r.listrik || 0) + (r.lainnya || 0)));

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
            <td style="text-align: right;">${window.formatRupiah ? window.formatRupiah(item.hppLama) : ('Rp ' + item.hppLama)}</td>
            <td style="text-align: right; font-weight: bold;">${window.formatRupiah ? window.formatRupiah(item.hppBaru) : ('Rp ' + item.hppBaru)}</td>
            <td style="text-align: right; color: ${selisihWarna}; font-weight: bold;">${selisihTanda} ${window.formatRupiah ? window.formatRupiah(Math.abs(selisih)) : ('Rp ' + Math.abs(selisih))}</td>
            <td>${item.penyebab}</td>
        `;
        tbody.appendChild(tr);
    });
};

window.initTambahHpp = function() {
    var sel = document.getElementById('hppSelProduk');
    if(sel && sel.options.length === 0) {
        var optHtml = '<option value="">-- Pilih Produk --</option>';
        (window.catalogProducts || []).forEach(function(p) {
            optHtml += '<option value="' + p.produkId + '">' + p.namaProduk + ' (' + p.produkId + ')</option>';
        });
        sel.innerHTML = optHtml;
    }
    
    // Auto-fill Harga Jual if selected
    if (sel && sel.value) {
        var prd = (window.catalogProducts || []).find(function(p) { return p.produkId === sel.value; });
        if (prd) {
            var elHj = document.getElementById('hppHargaJual');
            if (elHj && !elHj.dataset.modified) {
                elHj.value = prd.hargaJual || 0;
            }
        }
    }

    window.renderHppBahanBaku();
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
            <td><input type="text" class="hpp-clean-input" value="${item.nama}" onchange="window.updateHppBahan(${idx}, 'nama', this.value)"></td>
            <td><input type="number" step="any" class="hpp-clean-input" style="text-align: center;" value="${item.qty}" oninput="window.updateHppBahan(${idx}, 'qty', this.value)"></td>
            <td><input type="number" step="any" class="hpp-clean-input" style="text-align: right;" value="${item.harga}" oninput="window.updateHppBahan(${idx}, 'harga', this.value)"></td>
            <td style="font-weight: 700; text-align: right; color: var(--text-dark);">${window.formatRupiah ? window.formatRupiah(sub) : ('Rp ' + sub)}</td>
            <td style="text-align: center;">
                <button style="border: none; background: #fff1f2; color: #e11d48; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center;" onclick="window.hapusHppBahan(${idx})">
                    <svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('lblHppTotalBahan').textContent = window.formatRupiah ? window.formatRupiah(totalBahan) : ('Rp ' + totalBahan);
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
    var totalBahan = parseFloat(document.getElementById('lblHppTotalBahan').dataset.val || 0);
    
    var bTk = parseFloat(document.getElementById('hppBiayaTk').value) || 0;
    var bGas = parseFloat(document.getElementById('hppBiayaGas').value) || 0;
    var bListrik = parseFloat(document.getElementById('hppBiayaListrik').value) || 0;
    var bKemasan = parseFloat(document.getElementById('hppBiayaKemasan').value) || 0;
    var bOverhead = parseFloat(document.getElementById('hppBiayaOverhead').value) || 0;
    var bLain = parseFloat(document.getElementById('hppBiayaLain').value) || 0;
    
    var totalProduksi = bTk + bGas + bListrik + bKemasan + bOverhead + bLain;
    document.getElementById('lblHppTotalProduksi').textContent = window.formatRupiah ? window.formatRupiah(totalProduksi) : ('Rp ' + totalProduksi);
    
    var grandTotal = totalBahan + totalProduksi;
    document.getElementById('lblHppGrandTotal').textContent = window.formatRupiah ? window.formatRupiah(grandTotal) : ('Rp ' + grandTotal);
    
    var jmlProd = parseFloat(document.getElementById('hppJmlProduksi').value) || 1;
    var hppItem = grandTotal / jmlProd;
    
    document.getElementById('lblHppPerItem').textContent = window.formatRupiah ? window.formatRupiah(hppItem) : ('Rp ' + hppItem);
    
    window.tempHppResult = {
        totalBahan: totalBahan,
        bTk: bTk, bGas: bGas, bListrik: bListrik, bKemasan: bKemasan, bOverhead: bOverhead, bLain: bLain,
        grandTotal: grandTotal,
        jmlProd: jmlProd,
        hppItem: hppItem
    };
};

window.simpanHppBaru = function() {
    var selId = document.getElementById('hppSelProduk').value;
    var prd = (window.catalogProducts || []).find(function(p) { return p.produkId === selId; });
    
    if(!prd) {
        if(window.showToast) window.showToast('Pilih produk terlebih dahulu!', 'error');
        return;
    }
    
    var oldHpp = prd.hargaBeliHPP;
    var res = window.tempHppResult;
    
    var hargaJualInput = document.getElementById('hppHargaJual');
    var hargaJualValue = hargaJualInput ? (parseFloat(hargaJualInput.value) || prd.hargaJual) : prd.hargaJual;

    // Update locally
    prd.hargaBeliHPP = res.hppItem;
    prd.hargaJual = hargaJualValue;
    
    window.hppRincian = window.hppRincian || {};
    window.hppRincian[selId] = {
        bahan: res.totalBahan / res.jmlProd,
        tk: res.bTk / res.jmlProd,
        gas: res.bGas / res.jmlProd,
        listrik: res.bListrik / res.jmlProd,
        kemasan: res.bKemasan / res.jmlProd,
        overhead: res.bOverhead / res.jmlProd,
        lainnya: res.bLain / res.jmlProd
    };
    
    var payload = {
        produkId: prd.produkId,
        namaProduk: prd.namaProduk,
        satuan: prd.satuan,
        hargaBeliHPP: prd.hargaBeliHPP,
        hargaJual: prd.hargaJual,
        status: prd.status
    };
    
    if (window.runBackend) {
        window.runBackend('apiUpdateProduct', [payload, window.currentUser], function(apiRes) {
            if(window.populateProductDropdowns) window.populateProductDropdowns();
            if(window.renderMasterProdukTable) window.renderMasterProdukTable();
        });
    }
    
    var today = new Date().toISOString().split('T')[0];
    window.hppRiwayatData.unshift({
        tanggal: today,
        produk: prd.namaProduk,
        hppLama: oldHpp,
        hppBaru: res.hppItem,
        penyebab: 'Kalkulasi ulang via form HPP'
    });
    
    if(window.showToast) window.showToast('HPP dan Harga Jual berhasil diperbarui!', 'success');
    window.switchHppTab('daftar');
};

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        window.renderDaftarHPP();
    }, 500);
});

window.simpanProdukBaruHpp = function() {
    var nama = document.getElementById('newProdNama').value.trim();
    var sku = document.getElementById('newProdSku').value.trim();
    var satuan = document.getElementById('newProdSatuan').value.trim();
    var harga = parseFloat(document.getElementById('newProdHarga').value) || 0;

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
            
            // Optimistic update
            if (!window.catalogProducts) window.catalogProducts = [];
            window.catalogProducts.unshift({
                produkId: res.produkId,
                namaProduk: payload.namaProduk,
                satuan: payload.satuan,
                hargaBeliHPP: payload.hargaBeliHPP,
                hargaJual: payload.hargaJual,
                stokEtalase: 0,
                stokGudang: 0,
                status: 'Aktif'
            });
            
            if(window.renderMasterProdukTable) window.renderMasterProdukTable();
            if(window.populateProductDropdowns) window.populateProductDropdowns();
            
            // Clear dropdown to force repopulation next time 'Tambah' tab is opened
            var sel = document.getElementById('hppSelProduk');
            if(sel) sel.innerHTML = '';
            
            window.renderDaftarHPP();
            
            // Reset Form
            document.getElementById('newProdNama').value = '';
            document.getElementById('newProdSku').value = '';
            document.getElementById('newProdHarga').value = '';
            
            document.getElementById('modalTambahJenisHpp').style.display = 'none';
            if(window.showToast) window.showToast('Produk Makanan Baru berhasil ditambahkan ke Master Produk!', 'success');
        });
    }
};
