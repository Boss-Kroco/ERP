/**
 * ============================================================================
 * BOS KROCO ERP - KEUANGAN & KAS MODULE
 * File: js/modules/keuangan.js
 * ============================================================================
 */

var allKeuanganKas = [];
var currentFilteredKas = [];

var escapeHtml = function (text) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(text);
    if (!text && text !== 0) return '';
    return String(text).replace(/[&<>"']/g, function (m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
};

function parseKasDate(dateStr) {
    if (!dateStr) return null;
    var clean = String(dateStr).trim().split(' ')[0];
    var parts = clean.split('/');
    if (parts.length === 3) {
        var d = parseInt(parts[0], 10);
        var m = parseInt(parts[1], 10) - 1;
        var y = parseInt(parts[2], 10);
        return new Date(y, m, d);
    }
    var parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function initKeuanganPage() {
    fetchKeuanganKas();
}

function fetchKeuanganKas() {
    var tbody = document.getElementById('tblKeuanganKas');
    if (tbody && allKeuanganKas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--text-muted);">'
            + '<div class="sync-spinner-ring" style="display:inline-block; margin-right:8px; vertical-align:middle; width:16px; height:16px;"></div>'
            + 'Memuat data mutasi kas...</td></tr>';
    }

    runBackend('apiGetKeuanganKas', [window.currentUser], function (res) {
        if (!res.success) {
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--coral-pink); font-weight:700;">'
                    + escapeHtml(res.message || 'Gagal mengambil data buku kas.') + '</td></tr>';
            }
            return;
        }

        allKeuanganKas = res.data || [];

        // Perbarui saldo kas riil dari transaksi mutasi terbaru jika ada
        if (allKeuanganKas.length > 0) {
            var latestKas = allKeuanganKas[0];
            var elSaldo = document.getElementById('keuanganSaldoKas');
            if (elSaldo && latestKas.saldoBerjalan !== undefined && latestKas.saldoBerjalan !== null) {
                elSaldo.textContent = formatRupiah(latestKas.saldoBerjalan);
            }
        }

        filterKeuanganKas();
    });
}

function filterKeuanganKas() {
    var qInput = document.getElementById('searchKasTable');
    var q = (qInput ? qInput.value : '').toLowerCase().trim();

    var tipeSelect = document.getElementById('filterKasTipe');
    var filterTipe = (tipeSelect && tipeSelect.value) ? tipeSelect.value : 'all';

    var periodeSelect = document.getElementById('filterKasPeriode');
    var filterPeriode = (periodeSelect && periodeSelect.value) ? periodeSelect.value : 'all';

    var now = new Date();
    var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    var thisMonth = now.getMonth();
    var thisYear = now.getFullYear();

    var filtered = (allKeuanganKas || []).filter(function (item) {
        // Filter Tipe
        if (filterTipe !== 'all' && item.tipe !== filterTipe) {
            return false;
        }

        // Filter Periode Tanggal
        if (filterPeriode !== 'all') {
            var itemDate = parseKasDate(item.tanggal);
            if (itemDate) {
                if (filterPeriode === 'today') {
                    if (itemDate.toDateString() !== now.toDateString()) return false;
                } else if (filterPeriode === 'last7') {
                    if (itemDate < sevenDaysAgo || itemDate > now) return false;
                } else if (filterPeriode === 'thisMonth') {
                    if (itemDate.getMonth() !== thisMonth || itemDate.getFullYear() !== thisYear) return false;
                }
            }
        }

        // Filter Pencarian Query
        if (q) {
            var hay = (
                (item.kasId || '') + ' ' +
                (item.refId || '') + ' ' +
                (item.kategori || '') + ' ' +
                (item.keterangan || '') + ' ' +
                (item.dicatatOleh || '') + ' ' +
                (item.nominal || '')
            ).toLowerCase();
            if (hay.indexOf(q) === -1) return false;
        }

        return true;
    });

    currentFilteredKas = filtered;
    renderKeuanganTable(filtered);
    updateKeuanganMetrics(filtered);
}

function renderKeuanganTable(items) {
    var tbody = document.getElementById('tblKeuanganKas');
    var countBadge = document.getElementById('kasCountBadge');
    if (countBadge) {
        countBadge.textContent = items.length + ' Transaksi';
    }

    if (!tbody) return;
    tbody.innerHTML = '';

    if (!items || items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 32px; color: var(--text-muted); font-size: 12.5px;">'
            + '<svg class="svg-icon" viewBox="0 0 24 24" style="color: var(--text-muted); opacity: 0.5; width: 32px; height: 32px; margin-bottom: 8px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><br>'
            + 'Tidak ada data transaksi kas yang sesuai filter.</td></tr>';
        return;
    }

    items.forEach(function (k) {
        var isMasuk = (k.tipe === 'Masuk');
        var tr = document.createElement('tr');

        var nominalMasukHtml = isMasuk
            ? '<span style="color: #059669; font-weight: 800;">+ ' + formatRupiah(k.nominal || 0) + '</span>'
            : '<span style="color: var(--text-muted);">-</span>';

        var nominalKeluarHtml = !isMasuk
            ? '<span style="color: #dc2626; font-weight: 800;">- ' + formatRupiah(k.nominal || 0) + '</span>'
            : '<span style="color: var(--text-muted);">-</span>';

        var tipePill = isMasuk
            ? '<span class="prog-status-pill green">MASUK</span>'
            : '<span class="prog-status-pill coral">KELUAR</span>';

        var refBadge = (k.refId && k.refId !== '-' && k.refId !== 'MANUAL')
            ? '<br><small style="color: var(--text-muted); font-size: 10px; font-family: monospace;">Ref: ' + escapeHtml(k.refId) + '</small>'
            : '';

        tr.innerHTML = '<td>' + escapeHtml(k.tanggal || '-') + '</td>'
            + '<td><b>' + escapeHtml(k.kasId || '-') + '</b>' + refBadge + '</td>'
            + '<td style="text-align: center;">' + tipePill + '</td>'
            + '<td><span style="background: #f1f5f9; color: var(--text-main); font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">' + escapeHtml(k.kategori || '-') + '</span></td>'
            + '<td style="font-size: 12px; color: var(--text-main); max-width: 240px; word-break: break-word;">' + escapeHtml(k.keterangan || '-') + '</td>'
            + '<td style="text-align: right;">' + nominalMasukHtml + '</td>'
            + '<td style="text-align: right;">' + nominalKeluarHtml + '</td>'
            + '<td style="text-align: right; font-weight: 800; color: var(--violet-main);">' + formatRupiah(k.saldoBerjalan || 0) + '</td>'
            + '<td><small style="font-weight: 600; color: var(--text-main);">' + escapeHtml(k.dicatatOleh || '-') + '</small></td>'
            + '<td style="text-align: center; white-space: nowrap;">'
            + '<button class="btn-pill-action btn-pill-secondary" style="padding: 2px 8px;" onclick="openModalEditKas(\'' + escapeHtml(k.kasId) + '\')" title="Edit Transaksi Kas">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit'
            + '</button>'
            + '</td>';

        tbody.appendChild(tr);
    });
}

function updateKeuanganMetrics(items) {
    var totalMasuk = 0;
    var totalKeluar = 0;
    var countMasuk = 0;
    var countKeluar = 0;

    (items || []).forEach(function (k) {
        var nom = Number(k.nominal || 0);
        if (k.tipe === 'Masuk') {
            totalMasuk += nom;
            countMasuk++;
        } else if (k.tipe === 'Keluar') {
            totalKeluar += nom;
            countKeluar++;
        }
    });

    var netFlow = totalMasuk - totalKeluar;

    var elTotalMasuk = document.getElementById('keuanganTotalMasuk');
    var elSubMasuk = document.getElementById('keuanganSubMasuk');
    var elTotalKeluar = document.getElementById('keuanganTotalKeluar');
    var elSubKeluar = document.getElementById('keuanganSubKeluar');
    var elNetFlow = document.getElementById('keuanganNetFlow');

    if (elTotalMasuk) elTotalMasuk.textContent = formatRupiah(totalMasuk);
    if (elSubMasuk) elSubMasuk.textContent = countMasuk + ' transaksi masuk';

    if (elTotalKeluar) elTotalKeluar.textContent = formatRupiah(totalKeluar);
    if (elSubKeluar) elSubKeluar.textContent = countKeluar + ' transaksi keluar';

    if (elNetFlow) {
        if (netFlow > 0) {
            elNetFlow.textContent = '+' + formatRupiah(netFlow);
            elNetFlow.style.color = '#059669';
        } else if (netFlow < 0) {
            elNetFlow.textContent = '-' + formatRupiah(Math.abs(netFlow));
            elNetFlow.style.color = '#dc2626';
        } else {
            elNetFlow.textContent = 'Rp 0';
            elNetFlow.style.color = 'var(--text-main)';
        }
    }
}

function toggleKasFormCollapse() {
    var body = document.getElementById('kasFormCollapseBody');
    var lbl = document.getElementById('lblToggleKasForm');
    if (!body) return;

    if (body.style.display === 'none') {
        body.style.display = 'block';
        if (lbl) lbl.textContent = 'Sembunyikan Form';
    } else {
        body.style.display = 'none';
        if (lbl) lbl.textContent = 'Buka Form Input';
    }
}

function resetKasForm() {
    var nominalInput = document.getElementById('kasNominal');
    var kategoriInput = document.getElementById('kasKategori');
    var keteranganInput = document.getElementById('kasKeterangan');
    var tipeSelect = document.getElementById('kasTipe');

    if (nominalInput) nominalInput.value = '';
    if (kategoriInput) kategoriInput.value = '';
    if (keteranganInput) keteranganInput.value = '';
    if (tipeSelect) tipeSelect.value = 'Keluar';
}

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

    showToast('Menyimpan transaksi kas...', 'success');

    runBackend('apiSaveKasManual', [payload, currentUser], function (res) {
        if (!res.success) {
            showToast(res.message || 'Gagal mencatat kas.', 'error');
            return;
        }
        showToast(res.message, 'success');
        resetKasForm();

        // Refresh tabel mutasi kas dan metrik
        fetchKeuanganKas();

        // Refresh data dashboard jika modul aktif
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

function exportKeuanganCSV() {
    var dataToExport = currentFilteredKas && currentFilteredKas.length > 0 ? currentFilteredKas : allKeuanganKas;
    if (!dataToExport || dataToExport.length === 0) {
        return showToast('Tidak ada data transaksi kas untuk diekspor.', 'error');
    }

    var headers = ['Tanggal', 'No Kas', 'Referensi', 'Tipe', 'Kategori', 'Keterangan', 'Kas Masuk (Rp)', 'Kas Keluar (Rp)', 'Saldo Berjalan (Rp)', 'Dicatat Oleh'];
    var csvRows = [];

    // Header dengan delimiter titik koma (;) ramah Microsoft Excel Indonesia
    csvRows.push(headers.map(function (h) { return '"' + h + '"'; }).join(';'));

    dataToExport.forEach(function (item) {
        var isMasuk = (item.tipe === 'Masuk');
        var nom = Number(item.nominal || 0);
        var masukVal = isMasuk ? nom : 0;
        var keluarVal = !isMasuk ? nom : 0;

        var cleanKet = String(item.keterangan || '-').replace(/"/g, '""');
        var cleanKat = String(item.kategori || '-').replace(/"/g, '""');

        var row = [
            '"' + (item.tanggal || '-') + '"',
            '"' + (item.kasId || '-') + '"',
            '"' + (item.refId || '-') + '"',
            '"' + (item.tipe || '-') + '"',
            '"' + cleanKat + '"',
            '"' + cleanKet + '"',
            masukVal,
            keluarVal,
            Number(item.saldoBerjalan || 0),
            '"' + (item.dicatatOleh || '-') + '"'
        ];
        csvRows.push(row.join(';'));
    });

    var csvString = '\uFEFF' + csvRows.join('\r\n'); // \uFEFF BOM UTF-8
    var blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    var now = new Date();
    var dateStamp = now.getFullYear() + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2);
    var filename = 'Laporan_Mutasi_Kas_BosKroco_' + dateStamp + '.csv';

    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement('a');
        var url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showToast('Laporan mutasi kas berhasil diunduh (CSV).', 'success');
}

function openModalEditKas(kasId) {
    var item = (currentRawKasList || []).find(function (k) { return k.kasId === kasId; });
    if (!item) {
        showToast('Data transaksi kas tidak ditemukan.', 'error');
        return;
    }

    var elId = document.getElementById('editKasId');
    if (elId) elId.value = item.kasId;
    var elBadge = document.getElementById('editKasIdBadge');
    if (elBadge) elBadge.textContent = item.kasId;
    var elRef = document.getElementById('editKasRefBadge');
    if (elRef) elRef.textContent = 'Ref: ' + (item.refId || '-');
    var elTgl = document.getElementById('editKasTanggal');
    if (elTgl) elTgl.value = item.tanggal || '';
    var elTipe = document.getElementById('editKasTipe');
    if (elTipe) elTipe.value = item.tipe || 'Masuk';
    var elKat = document.getElementById('editKasKategori');
    if (elKat) elKat.value = item.kategori || '';
    var elNom = document.getElementById('editKasNominal');
    if (elNom) elNom.value = item.nominal || 0;
    var elKet = document.getElementById('editKasKeterangan');
    if (elKet) elKet.value = item.keterangan || '';
    var elOleh = document.getElementById('editKasDicatatOleh');
    if (elOleh) elOleh.value = item.dicatatOleh || '';

    var modal = document.getElementById('modalEditKas');
    if (modal) modal.classList.add('active');
}

function closeModalEditKas() {
    var modal = document.getElementById('modalEditKas');
    if (modal) modal.classList.remove('active');
}

function submitEditKas() {
    var kasId = document.getElementById('editKasId').value;
    var payload = {
        kasId: kasId,
        tanggal: document.getElementById('editKasTanggal').value.trim(),
        tipe: document.getElementById('editKasTipe').value,
        kategori: document.getElementById('editKasKategori').value.trim(),
        nominal: parseFloat(document.getElementById('editKasNominal').value) || 0,
        keterangan: document.getElementById('editKasKeterangan').value.trim(),
        dicatatOleh: document.getElementById('editKasDicatatOleh').value.trim()
    };

    showToast('Menyimpan perubahan kas ' + kasId + '...', 'success');

    runBackend('apiUpdateKasManual', [payload, window.currentUser], function (res) {
        if (!res.success) {
            showToast(res.message || 'Gagal memperbarui mutasi kas.', 'error');
            return;
        }

        // Update di currentRawKasList
        for (var i = 0; i < currentRawKasList.length; i++) {
            if (currentRawKasList[i].kasId === kasId) {
                currentRawKasList[i].tanggal = payload.tanggal;
                currentRawKasList[i].tipe = payload.tipe;
                currentRawKasList[i].kategori = payload.kategori;
                currentRawKasList[i].nominal = payload.nominal;
                currentRawKasList[i].keterangan = payload.keterangan;
                currentRawKasList[i].dicatatOleh = payload.dicatatOleh;
                break;
            }
        }

        closeModalEditKas();
        filterKeuanganKas();
        showToast(res.message || 'Mutasi kas berhasil diperbarui.', 'success');

        // Muat ulang ringkasan keuangan dashboard jika ada
        if (typeof window.loadDashboardData === 'function') {
            window.loadDashboardData();
        }
    }, function (err) {
        showToast('Gagal update kas: ' + (err.message || 'Koneksi terganggu'), 'error');
    });
}

// Export functions to global window
window.initKeuanganPage = initKeuanganPage;
window.fetchKeuanganKas = fetchKeuanganKas;
window.filterKeuanganKas = filterKeuanganKas;
window.renderKeuanganTable = renderKeuanganTable;
window.updateKeuanganMetrics = updateKeuanganMetrics;
window.toggleKasFormCollapse = toggleKasFormCollapse;
window.resetKasForm = resetKasForm;
window.submitKasManual = submitKasManual;
window.exportKeuanganCSV = exportKeuanganCSV;
window.openModalEditKas = openModalEditKas;
window.closeModalEditKas = closeModalEditKas;
window.submitEditKas = submitEditKas;
