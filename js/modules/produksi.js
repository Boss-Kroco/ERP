/**
 * ============================================================================
 * BOS KROCO ERP - PRODUKSI & HPP BATCH MODULE
 * File: js/modules/produksi.js
 * ============================================================================
 */

function hitungLiveHppPreview() {
    var elRencana = document.getElementById('prodBatchRencana');
    if (!elRencana) return;
    var rencana = parseFloat(elRencana.value) || 0;
    var elRusak = document.getElementById('prodBatchRusak');
    var rusak = elRusak ? (parseFloat(elRusak.value) || 0) : 0;
    var bersih = Math.max(0, rencana - rusak);

    var elBahan = document.getElementById('prodBiayaBahan');
    var elKemasan = document.getElementById('prodBiayaKemasan');
    var elOps = document.getElementById('prodBiayaOperasional');
    var elUpah = document.getElementById('prodBiayaUpah');

    var bBahan = elBahan ? (parseFloat(elBahan.value) || 0) : 0;
    var bKemasan = elKemasan ? (parseFloat(elKemasan.value) || 0) : 0;
    var bOps = elOps ? (parseFloat(elOps.value) || 0) : 0;
    var bUpah = elUpah ? (parseFloat(elUpah.value) || 0) : 0;

    var totalHpp = bBahan + bKemasan + bOps + bUpah;
    var hppUnit = bersih > 0 ? Math.round(totalHpp / bersih) : 0;

    var elBersih = document.getElementById('prevJmlBersih');
    var elTotalHpp = document.getElementById('prevTotalHpp');
    var elHppPcs = document.getElementById('prevHppPcs');

    if (elBersih) elBersih.textContent = bersih + ' Pcs';
    if (elTotalHpp) elTotalHpp.textContent = formatRupiah(totalHpp);
    if (elHppPcs) elHppPcs.textContent = formatRupiah(hppUnit) + ' / pcs';
}

function submitBatchProduksi() {
    var sel = document.getElementById('prodBatchProdukId');
    if (!sel || !sel.value) return showToast('Pilih produk produksi.', 'error');
    var pid = sel.value;
    var opt = (sel.selectedIndex >= 0 && sel.options[sel.selectedIndex]) ? sel.options[sel.selectedIndex] : null;
    var namaPrd = opt ? (opt.getAttribute('data-nama') || opt.text) : 'Produk';
    var elTk = document.getElementById('prodBatchTenagaKerja');
    var tipeTk = elTk ? elTk.value : 'Pekerja harian';

    var elRencana = document.getElementById('prodBatchRencana');
    var elRusak = document.getElementById('prodBatchRusak');
    var rencana = elRencana ? (parseFloat(elRencana.value) || 0) : 0;
    var rusak = elRusak ? (parseFloat(elRusak.value) || 0) : 0;
    var bersih = Math.max(0, rencana - rusak);

    var bBahan = parseFloat((document.getElementById('prodBiayaBahan') || {}).value) || 0;
    var bKemasan = parseFloat((document.getElementById('prodBiayaKemasan') || {}).value) || 0;
    var bOps = parseFloat((document.getElementById('prodBiayaOperasional') || {}).value) || 0;
    var bUpah = parseFloat((document.getElementById('prodBiayaUpah') || {}).value) || 0;
    var totalHpp = bBahan + bKemasan + bOps + bUpah;
    var hppUnit = bersih > 0 ? Math.round(totalHpp / bersih) : 0;

    var payload = {
        produkId: pid,
        namaProduk: namaPrd,
        tipeTenagaKerja: tipeTk,
        jmlRencana: rencana,
        jumlahRencana: rencana,
        jmlRusak: rusak,
        jumlahRusak: rusak,
        jmlBersih: bersih,
        jumlahBersih: bersih,
        biayaBahan: bBahan,
        biayaKemasan: bKemasan,
        biayaOperasional: bOps,
        biayaUpah: bUpah,
        totalHpp: totalHpp,
        totalHppBatch: totalHpp,
        hppUnit: hppUnit
    };

    showToast('Membukukan batch produksi & memperbarui HPP...', 'success');
    runBackend('apiCreateProductionBatch', [payload, window.currentUser], function (res) {
        if (!res.success) {
            showToast(res.message || 'Gagal membukukan batch produksi.', 'error');
            return;
        }
        showToast(res.message, 'success');
        if (typeof window.fetchMasterProducts === 'function') window.fetchMasterProducts();
        if (typeof window.loadDashboardData === 'function') window.loadDashboardData();
    });
}

// Export produksi functions to window
window.hitungLiveHppPreview = hitungLiveHppPreview;
window.submitBatchProduksi = submitBatchProduksi;
