/**
 * ============================================================================
 * BOS KROCO ERP - STOCK OPNAME & AUDIT FISIK MODULE
 * File: js/modules/opname.js
 * ============================================================================
 */

function submitStockOpname() {
    var sel = document.getElementById('opnameProdukId');
    if (!sel || !sel.value) return showToast('Pilih produk audit.', 'error');
    var pid = sel.value;
    var opt = (sel.selectedIndex >= 0 && sel.options[sel.selectedIndex]) ? sel.options[sel.selectedIndex] : null;
    var namaPrd = opt ? (opt.getAttribute('data-nama') || opt.text) : 'Produk';
    var elLokasi = document.getElementById('opnameLokasi');
    var lokasi = elLokasi ? elLokasi.value : 'Gudang Produksi';
    var elStokFisik = document.getElementById('opnameStokFisik');
    var stokFisik = elStokFisik ? (parseFloat(elStokFisik.value) || 0) : 0;
    var elKet = document.getElementById('opnameKet');
    var ket = elKet ? elKet.value.trim() : '';

    // Ambil stok sistem dari katalog produk jika tersedia
    var stokSistem = 0;
    var catalog = window.catalogProducts || [];
    var pItem = catalog.find(function (p) { return p.produkId === pid; });
    if (pItem) {
        stokSistem = (lokasi === 'Gudang Produksi') ? Number(pItem.stokGudang || 0) : Number(pItem.stokEtalase || 0);
    }
    var selisih = stokFisik - stokSistem;

    var payload = {
        produkId: pid,
        namaProduk: namaPrd,
        lokasi: lokasi,
        stokSistem: stokSistem,
        stokFisik: stokFisik,
        selisih: selisih,
        keterangan: ket
    };

    showToast('Menyimpan hasil audit fisik stock opname...', 'success');
    runBackend('apiSubmitStockOpname', [payload, window.currentUser], function (res) {
        if (!res.success) {
            showToast(res.message || 'Gagal menyimpan stock opname.', 'error');
            return;
        }
        showToast(res.message, 'success');
        if (elStokFisik) elStokFisik.value = '';
        if (elKet) elKet.value = '';
        if (typeof window.fetchMasterProducts === 'function') window.fetchMasterProducts();
        if (typeof window.loadDashboardData === 'function') window.loadDashboardData();
    });
}

// Export functions to window
window.submitStockOpname = submitStockOpname;
