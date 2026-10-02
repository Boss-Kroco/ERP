/**
 * ============================================================================
 * BOS KROCO ERP - MODUL HPP PRODUK
 * File: js/modules/produksi.js (repurposed for HPP)
 * ============================================================================
 */

window.hppMasterData = [
    {
        id: 'PRD-001',
        nama: 'Kue Kacang Original',
        sku: 'KK-ORG',
        satuan: 'Pcs',
        hppItem: 192.46,
        hargaJual: 500,
        status: 'Aktif',
        rincian: {
            bahan: 100,
            tk: 30,
            gas: 20,
            listrik: 5,
            kemasan: 25,
            overhead: 10,
            lainnya: 2.46
        }
    }
];

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
                btn.classList.remove('btn-pill-secondary');
                btn.classList.add('btn-pill-primary');
            } else {
                btn.classList.remove('btn-pill-primary');
                btn.classList.add('btn-pill-secondary');
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

    window.hppMasterData.forEach(function(item) {
        var tr = document.createElement('tr');
        var laba = item.hargaJual - item.hppItem;
        var margin = item.hargaJual > 0 ? (laba / item.hargaJual) * 100 : 0;
        
        tr.innerHTML = `
            <td style="font-weight: 600;">${item.nama}</td>
            <td>${item.sku}</td>
            <td>${item.satuan}</td>
            <td style="text-align: right; font-weight: bold; color: var(--text-dark);">Rp ${window.formatRupiah ? window.formatRupiah(item.hppItem) : item.hppItem}</td>
            <td style="text-align: right;">Rp ${window.formatRupiah ? window.formatRupiah(item.hargaJual) : item.hargaJual}</td>
            <td style="text-align: right; color: var(--emerald); font-weight: bold;">Rp ${window.formatRupiah ? window.formatRupiah(laba) : laba}</td>
            <td style="text-align: right; color: var(--violet-main); font-weight: bold;">${margin.toFixed(2)}%</td>
            <td><span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${item.status}</span></td>
            <td style="text-align: center;">
                <button class="btn-pill-action btn-pill-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="window.lihatDetailHpp('${item.id}')">Lihat Detail</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.lihatDetailHpp = function(id) {
    var item = window.hppMasterData.find(function(i) { return i.id === id; });
    if(!item) return;

    var laba = item.hargaJual - item.hppItem;
    var margin = item.hargaJual > 0 ? (laba / item.hargaJual) * 100 : 0;

    document.getElementById('detHppNamaProduk').textContent = item.nama;
    document.getElementById('detHppNilai').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(item.hppItem) : item.hppItem);
    document.getElementById('detHppJual').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(item.hargaJual) : item.hargaJual);
    document.getElementById('detHppLaba').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(laba) : laba);
    document.getElementById('detHppMargin').textContent = margin.toFixed(2) + '%';

    var r = item.rincian || {};
    document.getElementById('detRincianBahan').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(r.bahan || 0) : r.bahan);
    document.getElementById('detRincianTk').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(r.tk || 0) : r.tk);
    document.getElementById('detRincianGas').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(r.gas || 0) : r.gas);
    document.getElementById('detRincianKemasan').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(r.kemasan || 0) : r.kemasan);
    document.getElementById('detRincianOverhead').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah((r.overhead || 0) + (r.listrik || 0) + (r.lainnya || 0)) : ((r.overhead || 0) + (r.listrik || 0) + (r.lainnya || 0)));

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
            <td style="text-align: right;">Rp ${window.formatRupiah ? window.formatRupiah(item.hppLama) : item.hppLama}</td>
            <td style="text-align: right; font-weight: bold;">Rp ${window.formatRupiah ? window.formatRupiah(item.hppBaru) : item.hppBaru}</td>
            <td style="text-align: right; color: ${selisihWarna}; font-weight: bold;">${selisihTanda} Rp ${window.formatRupiah ? window.formatRupiah(Math.abs(selisih)) : Math.abs(selisih)}</td>
            <td>${item.penyebab}</td>
        `;
        tbody.appendChild(tr);
    });
};

window.initTambahHpp = function() {
    var sel = document.getElementById('hppSelProduk');
    if(sel && sel.options.length === 0) {
        // Populate
        window.hppMasterData.forEach(function(p) {
            var opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.nama + ' (' + p.sku + ')';
            sel.appendChild(opt);
        });
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
            <td><input type="text" class="search-filter-input" style="width: 100%; padding: 4px;" value="${item.nama}" onchange="window.updateHppBahan(${idx}, 'nama', this.value)"></td>
            <td><input type="number" class="search-filter-input" style="width: 100%; padding: 4px;" value="${item.qty}" oninput="window.updateHppBahan(${idx}, 'qty', this.value)"></td>
            <td><input type="number" class="search-filter-input" style="width: 100%; padding: 4px;" value="${item.harga}" oninput="window.updateHppBahan(${idx}, 'harga', this.value)"></td>
            <td style="font-weight: bold;">Rp ${window.formatRupiah ? window.formatRupiah(sub) : sub}</td>
            <td><button style="border: none; background: transparent; color: red; cursor: pointer; font-weight: bold;" onclick="window.hapusHppBahan(${idx})">X</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('lblHppTotalBahan').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(totalBahan) : totalBahan);
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
    document.getElementById('lblHppTotalProduksi').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(totalProduksi) : totalProduksi);
    
    var grandTotal = totalBahan + totalProduksi;
    document.getElementById('lblHppGrandTotal').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(grandTotal) : grandTotal);
    
    var jmlProd = parseFloat(document.getElementById('hppJmlProduksi').value) || 1;
    var hppItem = grandTotal / jmlProd;
    
    document.getElementById('lblHppPerItem').textContent = 'Rp ' + (window.formatRupiah ? window.formatRupiah(hppItem) : hppItem);
    
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
    var prd = window.hppMasterData.find(function(p) { return p.id === selId; });
    
    if(!prd) {
        if(window.showToast) window.showToast('Pilih produk terlebih dahulu!', 'error');
        return;
    }
    
    var oldHpp = prd.hppItem;
    var res = window.tempHppResult;
    
    prd.hppItem = res.hppItem;
    prd.rincian = {
        bahan: res.totalBahan / res.jmlProd,
        tk: res.bTk / res.jmlProd,
        gas: res.bGas / res.jmlProd,
        listrik: res.bListrik / res.jmlProd,
        kemasan: res.bKemasan / res.jmlProd,
        overhead: res.bOverhead / res.jmlProd,
        lainnya: res.bLain / res.jmlProd
    };
    
    var today = new Date().toISOString().split('T')[0];
    window.hppRiwayatData.unshift({
        tanggal: today,
        produk: prd.nama,
        hppLama: oldHpp,
        hppBaru: res.hppItem,
        penyebab: 'Kalkulasi ulang via form HPP'
    });
    
    if(window.showToast) window.showToast('HPP berhasil disimpan dan diperbarui!', 'success');
    window.switchHppTab('daftar');
};

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        window.renderDaftarHPP();
    }, 500);
});
