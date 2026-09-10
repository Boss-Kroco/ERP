/**
 * ============================================================================
 * BOS KROCO ERP - KEUANGAN & KAS MODULE
 * File: js/modules/keuangan.js
 * ============================================================================
 */

function submitKasManual() {
    var tipe = document.getElementById('kasTipe').value;
    var nominal = parseFloat(document.getElementById('kasNominal').value) || 0;
    var payload = {
        tipe: tipe,
        kategori: document.getElementById('kasKategori').value,
        nominal: nominal,
        keterangan: document.getElementById('kasKeterangan').value
    };

    if (nominal <= 0) return showToast('Nominal kas harus lebih dari 0.', 'error');

    runBackend('apiSaveKasManual', [payload, currentUser], function (res) {
        if (!res.success) {
            showToast(res.message || 'Gagal mencatat kas.', 'error');
            return;
        }
        showToast(res.message, 'success');
        document.getElementById('kasNominal').value = '';
        document.getElementById('kasKategori').value = '';
        document.getElementById('kasKeterangan').value = '';
        if (typeof loadDashboardData === 'function') loadDashboardData();

        // Notifikasi Telegram untuk pencatatan kas
        if (typeof window.sendTelegramNotification === 'function') {
            var userNama = (window.currentUser && (window.currentUser.namaLengkap || window.currentUser.username)) || 'Petugas Kas';
            var icon = tipe === 'Masuk' ? '🟢' : '🔴';
            var teleMsg = icon + ' *TRANSAKSI KAS ' + tipe.toUpperCase() + ' - BOS KROCO ERP*\n'
                + '━━━━━━━━━━━━━━━━━━━━\n'
                + '📂 *Kategori:* ' + payload.kategori + '\n'
                + '💰 *Nominal:* ' + (window.formatRupiah ? window.formatRupiah(nominal) : ('Rp ' + nominal)) + '\n'
                + '📝 *Keterangan:* ' + (payload.keterangan || '-') + '\n'
                + '👨‍💼 *Petugas:* ' + userNama + '\n'
                + '📅 *Waktu:* ' + new Date().toLocaleString('id-ID');
            window.sendTelegramNotification(teleMsg);
        }
    });
}
