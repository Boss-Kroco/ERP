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
    });
}

// Export functions to window
window.hitungLiveUpahPreview = hitungLiveUpahPreview;
window.submitPresensiUpah = submitPresensiUpah;
