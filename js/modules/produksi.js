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
        fetchProductionBatches();
        if (typeof window.fetchMasterProducts === 'function') window.fetchMasterProducts();
        if (typeof window.loadDashboardData === 'function') window.loadDashboardData();
    });
}

var productionBatches = [];

function fetchProductionBatches() {
    runBackend('apiGetProductionBatches', [], function (res) {
        if (res.success && res.data) {
            productionBatches = res.data;
            renderProductionBatchesTable();
        }
    });
}

function renderProductionBatchesTable() {
    var tbody = document.getElementById('tblProduksiBatchBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!productionBatches || productionBatches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12px;">'
            + 'Belum ada riwayat batch produksi. Silakan bukukan batch baru di atas.</td></tr>';
        return;
    }

    productionBatches.forEach(function (b) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + escapeHtml(b.tanggal || '-') + '</td>'
            + '<td><b>' + escapeHtml(b.batchId || '-') + '</b></td>'
            + '<td>' + escapeHtml(b.namaProduk || '-') + '</td>'
            + '<td><span style="font-size: 11px; font-weight: 600; background: #f1f5f9; padding: 2px 8px; border-radius: 6px;">' + escapeHtml(b.tipeTenagaKerja || '-') + '</span></td>'
            + '<td style="text-align: right;">' + (b.jmlRencana || 0) + '</td>'
            + '<td style="text-align: right; color: #dc2626;">' + (b.jmlRusak || 0) + '</td>'
            + '<td style="text-align: right; font-weight: 700; color: var(--emerald);">' + (b.jmlBersih || 0) + '</td>'
            + '<td style="text-align: right; font-weight: 700;">' + formatRupiah(b.totalHpp || 0) + '</td>'
            + '<td style="text-align: right; font-weight: 800; color: var(--violet-main);">' + formatRupiah(b.hppUnit || 0) + '</td>'
            + '<td style="text-align: center; white-space: nowrap;">'
            + '<button class="btn-pill-action btn-pill-secondary" style="padding: 2px 8px;" onclick="openModalEditProduksi(\'' + escapeHtml(b.batchId) + '\')" title="Edit Batch">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit'
            + '</button>'
            + '</td>';
        tbody.appendChild(tr);
    });
}

function hitungEditHppPreview() {
    var rencana = parseFloat((document.getElementById('editProdBatchRencana') || {}).value) || 0;
    var rusak = parseFloat((document.getElementById('editProdBatchRusak') || {}).value) || 0;
    var bersih = Math.max(0, rencana - rusak);

    var bBahan = parseFloat((document.getElementById('editProdBiayaBahan') || {}).value) || 0;
    var bKemasan = parseFloat((document.getElementById('editProdBiayaKemasan') || {}).value) || 0;
    var bOps = parseFloat((document.getElementById('editProdBiayaOperasional') || {}).value) || 0;
    var bUpah = parseFloat((document.getElementById('editProdBiayaUpah') || {}).value) || 0;
    var totalHpp = bBahan + bKemasan + bOps + bUpah;
    var hppUnit = bersih > 0 ? Math.round(totalHpp / bersih) : 0;

    var elBersih = document.getElementById('editProdBersihLbl');
    var elTotal = document.getElementById('editProdTotalHppLbl');
    var elUnit = document.getElementById('editProdHppUnitLbl');
    if (elBersih) elBersih.textContent = bersih + ' Pcs';
    if (elTotal) elTotal.textContent = formatRupiah(totalHpp);
    if (elUnit) elUnit.textContent = formatRupiah(hppUnit) + ' / pcs';
}

function openModalEditProduksi(batchId) {
    var item = (productionBatches || []).find(function (b) { return b.batchId === batchId; });
    if (!item) {
        showToast('Data batch produksi ' + batchId + ' tidak ditemukan.', 'error');
        return;
    }

    var elId = document.getElementById('editProdBatchId');
    if (elId) elId.value = item.batchId;
    var elBadge = document.getElementById('editProdBatchIdBadge');
    if (elBadge) elBadge.textContent = item.batchId;
    var elProdBadge = document.getElementById('editProdBatchProdukBadge');
    if (elProdBadge) elProdBadge.textContent = item.namaProduk;

    var elRencana = document.getElementById('editProdBatchRencana');
    if (elRencana) elRencana.value = item.jmlRencana || 0;
    var elRusak = document.getElementById('editProdBatchRusak');
    if (elRusak) elRusak.value = item.jmlRusak || 0;
    var elBahan = document.getElementById('editProdBiayaBahan');
    if (elBahan) elBahan.value = item.biayaBahan || 0;
    var elKemasan = document.getElementById('editProdBiayaKemasan');
    if (elKemasan) elKemasan.value = item.biayaKemasan || 0;
    var elOps = document.getElementById('editProdBiayaOperasional');
    if (elOps) elOps.value = item.biayaOperasional || 0;
    var elUpah = document.getElementById('editProdBiayaUpah');
    if (elUpah) elUpah.value = item.biayaUpah || 0;

    hitungEditHppPreview();

    var modal = document.getElementById('modalEditProduksi');
    if (modal) modal.classList.add('active');
}

function closeModalEditProduksi() {
    var modal = document.getElementById('modalEditProduksi');
    if (modal) modal.classList.remove('active');
}

function submitEditProduksi() {
    var bId = document.getElementById('editProdBatchId').value;
    var payload = {
        batchId: bId,
        jmlRencana: parseFloat(document.getElementById('editProdBatchRencana').value) || 0,
        jmlRusak: parseFloat(document.getElementById('editProdBatchRusak').value) || 0,
        biayaBahan: parseFloat(document.getElementById('editProdBiayaBahan').value) || 0,
        biayaKemasan: parseFloat(document.getElementById('editProdBiayaKemasan').value) || 0,
        biayaOperasional: parseFloat(document.getElementById('editProdBiayaOperasional').value) || 0,
        biayaUpah: parseFloat(document.getElementById('editProdBiayaUpah').value) || 0
    };

    showToast('Menyimpan perubahan batch ' + bId + '...', 'success');

    runBackend('apiUpdateProductionBatch', [payload, window.currentUser], function (res) {
        if (!res.success) {
            showToast(res.message || 'Gagal memperbarui batch.', 'error');
            return;
        }

        // Update lokal
        for (var i = 0; i < productionBatches.length; i++) {
            if (productionBatches[i].batchId === bId) {
                productionBatches[i].jmlRencana = payload.jmlRencana;
                productionBatches[i].jmlRusak = payload.jmlRusak;
                productionBatches[i].jmlBersih = Math.max(0, payload.jmlRencana - payload.jmlRusak);
                productionBatches[i].biayaBahan = payload.biayaBahan;
                productionBatches[i].biayaKemasan = payload.biayaKemasan;
                productionBatches[i].biayaOperasional = payload.biayaOperasional;
                productionBatches[i].biayaUpah = payload.biayaUpah;
                productionBatches[i].totalHpp = payload.biayaBahan + payload.biayaKemasan + payload.biayaOperasional + payload.biayaUpah;
                productionBatches[i].hppUnit = productionBatches[i].jmlBersih > 0 ? Math.round(productionBatches[i].totalHpp / productionBatches[i].jmlBersih) : 0;
                break;
            }
        }

        renderProductionBatchesTable();
        closeModalEditProduksi();
        showToast(res.message || 'Batch produksi berhasil diperbarui.', 'success');
    }, function (err) {
        showToast('Gagal update batch: ' + (err.message || 'Koneksi terganggu'), 'error');
    });
}

// Auto-fetch saat modul siap
if (typeof document !== 'undefined') {
    setTimeout(fetchProductionBatches, 300);
}

// Export produksi functions to window
window.hitungLiveHppPreview = hitungLiveHppPreview;
window.submitBatchProduksi = submitBatchProduksi;
window.fetchProductionBatches = fetchProductionBatches;
window.renderProductionBatchesTable = renderProductionBatchesTable;
window.hitungEditHppPreview = hitungEditHppPreview;
window.openModalEditProduksi = openModalEditProduksi;
window.closeModalEditProduksi = closeModalEditProduksi;
window.submitEditProduksi = submitEditProduksi;
