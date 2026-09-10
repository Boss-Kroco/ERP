/**
 * ============================================================================
 * BOS KROCO ERP - MULTILOKASI & TRANSFER STOK MODULE
 * File: js/modules/multilokasi.js
 * ============================================================================
 */

function submitTransferStok() {
    var sel = document.getElementById('tfProdukId');
    if (!sel || !sel.value) return showToast('Pilih produk transfer.', 'error');
    var pid = sel.value;
    var opt = (sel.selectedIndex >= 0 && sel.options[sel.selectedIndex]) ? sel.options[sel.selectedIndex] : null;
    var namaPrd = opt ? (opt.getAttribute('data-nama') || opt.text) : 'Produk';
    var elAsal = document.getElementById('tfLokasiAsal');
    var elTujuan = document.getElementById('tfLokasiTujuan');
    var asal = elAsal ? elAsal.value : 'Gudang Produksi';
    var tujuan = elTujuan ? elTujuan.value : 'Etalase Toko';
    var elJumlah = document.getElementById('tfJumlah');
    var jumlah = elJumlah ? (parseFloat(elJumlah.value) || 0) : 0;

    if (jumlah <= 0) return showToast('Jumlah unit transfer harus lebih dari 0.', 'error');
    if (asal === tujuan) return showToast('Lokasi asal dan tujuan tidak boleh sama!', 'error');

    var payload = {
        produkId: pid,
        namaProduk: namaPrd,
        jumlah: jumlah,
        lokasiAsal: asal,
        lokasiTujuan: tujuan
    };

    showToast('Memproses transfer ' + jumlah + ' unit...', 'success');
    runBackend('apiTransferStok', [payload, window.currentUser], function (res) {
        if (!res.success) {
            showToast(res.message || 'Gagal transfer stok.', 'error');
            return;
        }
        showToast(res.message, 'success');
        if (typeof window.fetchMasterProducts === 'function') window.fetchMasterProducts();
        if (typeof window.loadDashboardData === 'function') window.loadDashboardData();
    });
}

// Export functions to window
window.submitTransferStok = submitTransferStok;
