/**
 * ============================================================================
 * BOS KROCO ERP - TENAGA KERJA & UPAH MODULE
 * File: js/modules/tenagakerja.js
 * ============================================================================
 */

function hitungLiveUpahPreview() {
    var elJam = document.getElementById('tkTotalJam');
    var elRate = document.getElementById('tkRate');
    var elBonus = document.getElementById('tkBonus');
    var elPot = document.getElementById('tkPotongan');

    var jam = elJam ? (parseFloat(elJam.value) || 0) : 0;
    var rate = elRate ? (parseFloat(elRate.value) || 0) : 0;
    var bonus = elBonus ? (parseFloat(elBonus.value) || 0) : 0;
    var pot = elPot ? (parseFloat(elPot.value) || 0) : 0;
    var total = Math.max(0, (jam * rate) + bonus - pot);

    var elLbl = document.getElementById('lblLiveTotalUpah');
    if (elLbl) elLbl.textContent = formatRupiah(total);
    return total;
}

function submitPresensiUpah() {
    var elNama = document.getElementById('tkNama');
    var nama = elNama ? elNama.value.trim() : '';
    if (!nama) {
        return showToast('Nama pekerja harus diisi.', 'error');
    }

    var elJam = document.getElementById('tkTotalJam');
    var elRate = document.getElementById('tkRate');
    var elBonus = document.getElementById('tkBonus');
    var elPot = document.getElementById('tkPotongan');
    var elTipe = document.getElementById('tkTipe');

    var jam = elJam ? (parseFloat(elJam.value) || 8) : 8;
    var rate = elRate ? (parseFloat(elRate.value) || 12000) : 12000;
    var bonus = elBonus ? (parseFloat(elBonus.value) || 0) : 0;
    var pot = elPot ? (parseFloat(elPot.value) || 0) : 0;
    var totalBayar = Math.max(0, (jam * rate) + bonus - pot);

    var payload = {
        namaPekerja: nama,
        tipePekerja: elTipe ? elTipe.value : 'Pekerja harian',
        totalJam: jam,
        upahRate: rate,
        bonus: bonus,
        potongan: pot,
        totalBayar: totalBayar
    };

    showToast('Mencatat data upah kerja...', 'success');
    runBackend('apiSaveTenagaKerja', [payload, window.currentUser], function (res) {
        if (!res.success) {
            showToast(res.message || 'Gagal menyimpan data tenaga kerja.', 'error');
            return;
        }
        showToast(res.message, 'success');
        if (elNama) elNama.value = '';
        hitungLiveUpahPreview();
        fetchTenagaKerjaLogs();
    });
}

var tenagaKerjaLogs = [];

function fetchTenagaKerjaLogs() {
    runBackend('apiGetTenagaKerjaLogs', [], function (res) {
        if (res.success && res.data) {
            tenagaKerjaLogs = res.data;
            renderTenagaKerjaTable();
        }
    });
}

function renderTenagaKerjaTable() {
    var tbody = document.getElementById('tblTenagaKerjaBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!tenagaKerjaLogs || tenagaKerjaLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 12px;">'
            + 'Belum ada catatan upah kerja. Silakan input di formulir atas.</td></tr>';
        return;
    }

    tenagaKerjaLogs.forEach(function (t) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + escapeHtml(t.tanggal || '-') + '</td>'
            + '<td><b>' + escapeHtml(t.pekerjaId || '-') + '</b></td>'
            + '<td><b>' + escapeHtml(t.namaPekerja || '-') + '</b></td>'
            + '<td><span style="font-size: 11px; font-weight: 600; background: #f1f5f9; padding: 2px 8px; border-radius: 6px;">' + escapeHtml(t.tipePekerja || '-') + '</span></td>'
            + '<td style="text-align: right;">' + (t.totalJam || 0) + ' Jam</td>'
            + '<td style="text-align: right;">' + formatRupiah(t.upahRate || 0) + '</td>'
            + '<td style="text-align: right; color: var(--emerald); font-weight: 600;">+ ' + formatRupiah(t.bonus || 0) + '</td>'
            + '<td style="text-align: right; color: #dc2626; font-weight: 600;">- ' + formatRupiah(t.potongan || 0) + '</td>'
            + '<td style="text-align: right; font-weight: 800; color: var(--violet-main);">' + formatRupiah(t.totalBayar || 0) + '</td>'
            + '<td style="text-align: center;"><span class="prog-status-pill green">' + escapeHtml(t.statusBayar || 'Lunas') + '</span></td>'
            + '<td style="text-align: center; white-space: nowrap;">'
            + '<button class="btn-pill-action btn-pill-secondary" style="padding: 2px 8px;" onclick="openModalEditTenagaKerja(\'' + escapeHtml(t.pekerjaId) + '\')" title="Edit Data Upah">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit'
            + '</button>'
            + '</td>';
        tbody.appendChild(tr);
    });
}

function hitungEditUpahPreview() {
    var jam = parseFloat((document.getElementById('editTkTotalJam') || {}).value) || 0;
    var rate = parseFloat((document.getElementById('editTkRate') || {}).value) || 0;
    var bonus = parseFloat((document.getElementById('editTkBonus') || {}).value) || 0;
    var pot = parseFloat((document.getElementById('editTkPotongan') || {}).value) || 0;
    var total = Math.max(0, (jam * rate) + bonus - pot);

    var elLbl = document.getElementById('editTkTotalBayarLbl');
    if (elLbl) elLbl.textContent = formatRupiah(total);
}

function openModalEditTenagaKerja(pekerjaId) {
    var item = (tenagaKerjaLogs || []).find(function (t) { return t.pekerjaId === pekerjaId; });
    if (!item) {
        showToast('Data pekerja ' + pekerjaId + ' tidak ditemukan.', 'error');
        return;
    }

    var elId = document.getElementById('editTkId');
    if (elId) elId.value = item.pekerjaId;
    var elBadge = document.getElementById('editTkIdBadge');
    if (elBadge) elBadge.textContent = item.pekerjaId + ' • ' + (item.tanggal || '');
    var elNama = document.getElementById('editTkNama');
    if (elNama) elNama.value = item.namaPekerja || '';
    var elTipe = document.getElementById('editTkTipe');
    if (elTipe) elTipe.value = item.tipePekerja || 'Pekerja harian';
    var elJam = document.getElementById('editTkTotalJam');
    if (elJam) elJam.value = item.totalJam || 8;
    var elRate = document.getElementById('editTkRate');
    if (elRate) elRate.value = item.upahRate || 12000;
    var elBonus = document.getElementById('editTkBonus');
    if (elBonus) elBonus.value = item.bonus || 0;
    var elPot = document.getElementById('editTkPotongan');
    if (elPot) elPot.value = item.potongan || 0;

    hitungEditUpahPreview();

    var modal = document.getElementById('modalEditTenagaKerja');
    if (modal) modal.classList.add('active');
}

function closeModalEditTenagaKerja() {
    var modal = document.getElementById('modalEditTenagaKerja');
    if (modal) modal.classList.remove('active');
}

function submitEditTenagaKerja() {
    var tkId = document.getElementById('editTkId').value;
    var payload = {
        pekerjaId: tkId,
        namaPekerja: document.getElementById('editTkNama').value.trim(),
        tipePekerja: document.getElementById('editTkTipe').value,
        totalJam: parseFloat(document.getElementById('editTkTotalJam').value) || 0,
        upahRate: parseFloat(document.getElementById('editTkRate').value) || 0,
        bonus: parseFloat(document.getElementById('editTkBonus').value) || 0,
        potongan: parseFloat(document.getElementById('editTkPotongan').value) || 0
    };

    showToast('Menyimpan perubahan upah ' + payload.namaPekerja + '...', 'success');

    runBackend('apiUpdateTenagaKerja', [payload, window.currentUser], function (res) {
        if (!res.success) {
            showToast(res.message || 'Gagal memperbarui data upah.', 'error');
            return;
        }

        // Update lokal
        for (var i = 0; i < tenagaKerjaLogs.length; i++) {
            if (tenagaKerjaLogs[i].pekerjaId === tkId) {
                tenagaKerjaLogs[i].namaPekerja = payload.namaPekerja;
                tenagaKerjaLogs[i].tipePekerja = payload.tipePekerja;
                tenagaKerjaLogs[i].totalJam = payload.totalJam;
                tenagaKerjaLogs[i].upahRate = payload.upahRate;
                tenagaKerjaLogs[i].bonus = payload.bonus;
                tenagaKerjaLogs[i].potongan = payload.potongan;
                tenagaKerjaLogs[i].totalBayar = Math.max(0, (payload.totalJam * payload.upahRate) + payload.bonus - payload.potongan);
                break;
            }
        }

        renderTenagaKerjaTable();
        closeModalEditTenagaKerja();
        showToast(res.message || 'Data upah berhasil diperbarui.', 'success');
    }, function (err) {
        showToast('Gagal update upah: ' + (err.message || 'Koneksi terganggu'), 'error');
    });
}

// Auto-fetch saat modul siap
if (typeof document !== 'undefined') {
    setTimeout(fetchTenagaKerjaLogs, 300);
}

// Export functions to window
window.hitungLiveUpahPreview = hitungLiveUpahPreview;
window.submitPresensiUpah = submitPresensiUpah;
window.fetchTenagaKerjaLogs = fetchTenagaKerjaLogs;
window.renderTenagaKerjaTable = renderTenagaKerjaTable;
window.hitungEditUpahPreview = hitungEditUpahPreview;
window.openModalEditTenagaKerja = openModalEditTenagaKerja;
window.closeModalEditTenagaKerja = closeModalEditTenagaKerja;
window.submitEditTenagaKerja = submitEditTenagaKerja;
