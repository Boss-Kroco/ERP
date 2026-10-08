/**
 * ============================================================================
 * BOS KROCO ERP - MODUL DAFTAR SEMUA TRANSAKSI
 * File: js/modules/transaksi.js
 * ============================================================================
 */

window._semuaTransaksiList = [];
window._transaksiFilteredList = [];
window._trxCurrentPage = 1;
window._trxPageSize = 25;

window.loadTransaksiPage = async function() {
    await window.refreshAllTransactions();
};

window.refreshAllTransactions = async function() {
    var tbody = document.getElementById('tblSemuaTransaksiBody');
    if (tbody && (!window._semuaTransaksiList || window._semuaTransaksiList.length === 0)) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 36px; color: var(--text-muted); font-size: 13px;">'
            + '<div class="sync-spinner-ring" style="display:inline-block; margin-right:8px; vertical-align:middle; width:18px; height:18px;"></div>'
            + 'Mengambil data transaksi dari server...</td></tr>';
    }

    var list = [];
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
        try {
            var sb = window.supabaseClient;
            var res = await sb.from('penjualan').select('*').order('created_at', { ascending: false }).limit(500);
            if (!res.error && res.data && res.data.length > 0) {
                list = res.data.map(function(p) {
                    var items = [];
                    if (Array.isArray(p.item_list_json)) items = p.item_list_json;
                    else if (typeof p.item_list_json === 'string') {
                        try { items = JSON.parse(p.item_list_json); } catch(e){}
                    }
                    var cat = items.length > 0 ? (items[0].namaProduk || items[0].nama || 'Produk Retail') : 'Penjualan POS';
                    if (items.length > 1) cat += ' +' + (items.length - 1);

                    var st = (p.status_bayar === 'Belum Lunas' || p.metode_bayar === 'Tempo') ? 'await' : 'delivered';

                    return {
                        id: p.trx_id,
                        orderNum: 'Nº' + (p.trx_id.replace(/\D/g, '').slice(-6) || Math.floor(600000 + Math.random() * 90000)),
                        customer: p.nama_pelanggan || 'Pelanggan Umum',
                        phone: p.kasir ? ('Kasir: ' + p.kasir) : 'Kasir Walk-in',
                        category: cat,
                        price: Number(p.total_net || p.total_gross || 0),
                        date: p.tanggal,
                        payment: p.metode_bayar || 'Tunai',
                        status: st,
                        statusBayar: p.status_bayar || (p.metode_bayar === 'Tempo' ? 'Belum Lunas' : 'Lunas'),
                        items: items,
                        kasir: p.kasir || 'Kasir',
                        totalGross: Number(p.total_gross || p.total_net || 0),
                        diskon: Number(p.diskon || 0),
                        createdAt: p.created_at
                    };
                });
            }
        } catch (err) {
            console.warn('Gagal memuat transaksi dari Supabase:', err);
        }
    }

    // Gabungkan dengan transaksi in-memory POS jika belum masuk server
    if (window.orderTransactions && Array.isArray(window.orderTransactions)) {
        window.orderTransactions.forEach(function(memTrx) {
            var exists = list.some(function(item) { return item.id === memTrx.id; });
            if (!exists) {
                list.unshift(memTrx);
            }
        });
    }

    if (list.length === 0 && window.orderTransactions) {
        list = window.orderTransactions.slice();
    }

    window._semuaTransaksiList = list;
    window.orderTransactions = list;

    // Render tabel dan metrik
    window.applyTransaksiFilters();
    
    // Sinkronkan juga tabel di dashboard
    if (typeof window.renderOrderTable === 'function') {
        window.renderOrderTable();
    }
};

window.applyTransaksiFilters = function() {
    var qInput = document.getElementById('trxSearchInput');
    var q = qInput ? qInput.value.toLowerCase().trim() : '';

    var fMetode = document.getElementById('trxFilterMetode') ? document.getElementById('trxFilterMetode').value : 'ALL';
    var fStatus = document.getElementById('trxFilterStatus') ? document.getElementById('trxFilterStatus').value : 'ALL';
    var fWaktu = document.getElementById('trxFilterWaktu') ? document.getElementById('trxFilterWaktu').value : 'ALL';

    var now = new Date();
    var filtered = (window._semuaTransaksiList || []).filter(function(item) {
        // Query search
        if (q) {
            var matchId = (item.id || '').toLowerCase().indexOf(q) !== -1;
            var matchOrderNum = (item.orderNum || '').toLowerCase().indexOf(q) !== -1;
            var matchCust = (item.customer || '').toLowerCase().indexOf(q) !== -1;
            var matchCat = (item.category || '').toLowerCase().indexOf(q) !== -1;
            var matchKasir = (item.kasir || '').toLowerCase().indexOf(q) !== -1;
            if (!matchId && !matchOrderNum && !matchCust && !matchCat && !matchKasir) {
                return false;
            }
        }

        // Metode Pembayaran
        if (fMetode !== 'ALL') {
            if ((item.payment || '').toLowerCase() !== fMetode.toLowerCase()) {
                return false;
            }
        }

        // Status Pembayaran
        if (fStatus !== 'ALL') {
            var stBayar = (item.statusBayar || '').toLowerCase();
            var stOrder = (item.status || '').toLowerCase();
            var target = fStatus.toLowerCase();
            if (stBayar !== target && stOrder !== target) {
                return false;
            }
        }

        // Filter Waktu
        if (fWaktu !== 'ALL' && item.date) {
            var parts = String(item.date).split('/');
            if (parts.length === 3) {
                var d = parseInt(parts[0], 10);
                var m = parseInt(parts[1], 10) - 1;
                var y = parseInt(parts[2], 10);
                var trxDate = new Date(y, m, d);

                if (fWaktu === 'TODAY') {
                    if (trxDate.toDateString() !== now.toDateString()) return false;
                } else if (fWaktu === '7DAYS') {
                    var diffDays = (now.getTime() - trxDate.getTime()) / (1000 * 3600 * 24);
                    if (diffDays > 7 || diffDays < 0) return false;
                } else if (fWaktu === 'MONTH') {
                    if (trxDate.getMonth() !== now.getMonth() || trxDate.getFullYear() !== now.getFullYear()) return false;
                }
            }
        }

        return true;
    });

    window._transaksiFilteredList = filtered;
    window._trxCurrentPage = 1;
    window.updateTransaksiMetrics(filtered);
    window.renderSemuaTransaksiTable();
};

window.updateTransaksiMetrics = function(data) {
    data = data || window._transaksiFilteredList || [];
    var totalCount = data.length;
    var totalOmzet = 0;
    var tunaiNominal = 0;
    var tunaiCount = 0;
    var tempoNominal = 0;
    var tempoCount = 0;
    var tabunganNominal = 0;
    var tabunganCount = 0;

    data.forEach(function(item) {
        var p = Number(item.price || 0);
        totalOmzet += p;
        var m = String(item.payment || '').toLowerCase();
        if (m === 'tunai') {
            tunaiNominal += p;
            tunaiCount++;
        } else if (m === 'tempo') {
            tempoNominal += p;
            tempoCount++;
        } else if (m === 'tabungan') {
            tabunganNominal += p;
            tabunganCount++;
        }
    });

    var elCount = document.getElementById('trxMetricTotalCount');
    var elOmzet = document.getElementById('trxMetricTotalOmzet');
    var elTunaiNom = document.getElementById('trxMetricTunaiNominal');
    var elTunaiCnt = document.getElementById('trxMetricTunaiCount');
    var elTempoNom = document.getElementById('trxMetricTempoNominal');
    var elTempoCnt = document.getElementById('trxMetricTempoCount');
    var elTabNom = document.getElementById('trxMetricTabunganNominal');
    var elTabCnt = document.getElementById('trxMetricTabunganCount');

    if (elCount) elCount.textContent = totalCount.toLocaleString('id-ID');
    if (elOmzet) elOmzet.textContent = window.formatAppCurrency(totalOmzet);
    if (elTunaiNom) elTunaiNom.textContent = window.formatAppCurrency(tunaiNominal);
    if (elTunaiCnt) elTunaiCnt.textContent = tunaiCount + ' transaksi';
    if (elTempoNom) elTempoNom.textContent = window.formatAppCurrency(tempoNominal);
    if (elTempoCnt) elTempoCnt.textContent = tempoCount + ' transaksi';
    if (elTabNom) elTabNom.textContent = window.formatAppCurrency(tabunganNominal);
    if (elTabCnt) elTabCnt.textContent = tabunganCount + ' transaksi';
};

window.setTransaksiQuickFilter = function(type) {
    var selectMetode = document.getElementById('trxFilterMetode');
    if (!selectMetode) return;

    if (type === 'all') {
        selectMetode.value = 'ALL';
    } else if (type === 'tunai') {
        selectMetode.value = 'Tunai';
    } else if (type === 'tempo') {
        selectMetode.value = 'Tempo';
    } else if (type === 'tabungan') {
        selectMetode.value = 'Tabungan';
    }
    window.applyTransaksiFilters();
};

window.renderSemuaTransaksiTable = function() {
    var tbody = document.getElementById('tblSemuaTransaksiBody');
    if (!tbody) return;

    var data = window._transaksiFilteredList || [];
    var totalData = data.length;

    if (totalData === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 48px 20px; color: var(--text-muted);">'
            + '<div style="font-size: 32px; margin-bottom: 8px;">🧾</div>'
            + '<div style="font-size: 14px; font-weight: 700; color: var(--text-dark);">Tidak ada data transaksi ditemukan</div>'
            + '<div style="font-size: 12px; margin-top: 4px;">Coba sesuaikan kata kunci pencarian atau filter status transaksi.</div>'
            + '</td></tr>';
        window.renderTransaksiPagination(0, 0);
        return;
    }

    var pageSize = window._trxPageSize;
    var page = window._trxCurrentPage;
    var startIdx = 0;
    var endIdx = totalData;

    if (pageSize !== 'ALL') {
        pageSize = parseInt(pageSize, 10) || 25;
        startIdx = (page - 1) * pageSize;
        endIdx = Math.min(startIdx + pageSize, totalData);
    }

    var pagedData = data.slice(startIdx, endIdx);
    var html = '';

    pagedData.forEach(function(item) {
        // Metode Pill
        var metode = item.payment || 'Tunai';
        var metodeClass = 'trx-method-tunai';
        var metodeIcon = '💵';
        if (metode === 'Tempo') {
            metodeClass = 'trx-method-tempo';
            metodeIcon = '⏳';
        } else if (metode === 'Tabungan') {
            metodeClass = 'trx-method-tabungan';
            metodeIcon = '🏦';
        } else if (metode === 'Transfer' || metode === 'QRIS') {
            metodeClass = 'trx-method-transfer';
            metodeIcon = '💳';
        }

        // Status Badge
        var isLunas = item.statusBayar === 'Lunas' || item.status === 'delivered';
        var statusBadgeHtml = isLunas
            ? '<span class="trx-status-badge trx-status-lunas"><svg style="width:12px;height:12px;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Lunas</span>'
            : '<span class="trx-status-badge trx-status-belum"><svg style="width:12px;height:12px;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>Belum Lunas</span>';

        // Items preview
        var itemsRinci = item.category || 'Belanja Kasir';
        if (item.items && Array.isArray(item.items) && item.items.length > 0) {
            var itemNames = item.items.map(function(i) { return (i.namaProduk || i.nama || 'Item') + ' (' + (i.qty || 1) + 'x)'; }).join(', ');
            itemsRinci = '<span title="' + window.escapeHtml(itemNames) + '" style="cursor:help;">' + window.escapeHtml(item.category) + '</span>';
        }

        html += '<tr style="border-bottom: 1px solid var(--border-soft); transition: background 0.15s ease;" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'transparent\'">';
        html += '  <td style="padding: 13px 16px; font-size: 12.5px;"><b>' + window.escapeHtml(item.orderNum || item.id) + '</b><br><small style="color:var(--text-muted); font-family:monospace; font-size:10.5px;">' + window.escapeHtml(item.id) + '</small></td>';
        html += '  <td style="padding: 13px 16px; font-size: 12px; color: #475569; white-space: nowrap;">' + window.escapeHtml(item.date || '-') + '</td>';
        html += '  <td style="padding: 13px 16px; font-size: 13px; font-weight: 700; color: var(--text-dark);">' + window.escapeHtml(item.customer || 'Pelanggan Umum') + '</td>';
        html += '  <td style="padding: 13px 16px; font-size: 12.5px; color: #334155; max-width: 220px; word-break: break-word;">' + itemsRinci + '</td>';
        html += '  <td style="padding: 13px 16px; font-size: 13.5px; font-weight: 800; text-align: right; color: var(--violet-main);">' + window.formatAppCurrency(item.price) + '</td>';
        html += '  <td style="padding: 13px 16px; text-align: center;"><span class="trx-method-pill ' + metodeClass + '">' + metodeIcon + ' ' + window.escapeHtml(metode) + '</span></td>';
        html += '  <td style="padding: 13px 16px; text-align: center;">' + statusBadgeHtml + '</td>';
        html += '  <td style="padding: 13px 16px; font-size: 12px; color: var(--text-muted);">' + window.escapeHtml(item.kasir || 'Kasir') + '</td>';
        html += '  <td style="padding: 13px 16px; text-align: center; white-space: nowrap;">';
        html += '    <button class="btn-pill-action btn-pill-secondary" style="padding: 4px 8px; margin-right: 4px;" onclick="window.openPreviewStruk(\'' + window.escapeHtml(item.id) + '\')" title="Cetak / Preview Struk Nota"><svg style="width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2;" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg> Struk</button>';
        html += '    <button class="btn-pill-action btn-pill-secondary" style="padding: 4px 8px;" onclick="window.detailTransaksi(\'' + window.escapeHtml(item.id) + '\')" title="Rincian & Aksi Transaksi">&middot;&middot;&middot;</button>';
        html += '  </td>';
        html += '</tr>';
    });

    tbody.innerHTML = html;
    window.renderTransaksiPagination(startIdx + 1, endIdx, totalData);
};

window.renderTransaksiPagination = function(start, end, total) {
    var info = document.getElementById('trxPaginationInfo');
    var btns = document.getElementById('trxPaginationButtons');
    if (!info || !btns) return;

    if (!total || total === 0) {
        info.textContent = 'Menampilkan 0 dari 0 transaksi';
        btns.innerHTML = '';
        return;
    }

    info.textContent = 'Menampilkan ' + start + ' - ' + end + ' dari ' + total + ' transaksi';

    var pageSize = window._trxPageSize;
    if (pageSize === 'ALL') {
        btns.innerHTML = '';
        return;
    }

    pageSize = parseInt(pageSize, 10) || 25;
    var totalPages = Math.ceil(total / pageSize);
    var currentPage = window._trxCurrentPage;

    var html = '';
    // Prev Button
    html += '<button class="btn-pill-action btn-pill-secondary" style="padding: 4px 10px; font-size: 11px;" ' + (currentPage <= 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : 'onclick="window.goToTransaksiPage(' + (currentPage - 1) + ')"') + '>&laquo; Prev</button>';

    // Page numbers
    var startP = Math.max(1, currentPage - 2);
    var endP = Math.min(totalPages, currentPage + 2);
    for (var p = startP; p <= endP; p++) {
        var isActive = p === currentPage;
        var btnStyle = isActive
            ? 'background: var(--violet-main); color: white; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: none; font-size: 11px; cursor: pointer;'
            : 'background: transparent; color: var(--text-dark); padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border-soft); font-size: 11px; cursor: pointer;';
        html += '<button style="' + btnStyle + '" onclick="window.goToTransaksiPage(' + p + ')">' + p + '</button>';
    }

    // Next Button
    html += '<button class="btn-pill-action btn-pill-secondary" style="padding: 4px 10px; font-size: 11px;" ' + (currentPage >= totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : 'onclick="window.goToTransaksiPage(' + (currentPage + 1) + ')"') + '>Next &raquo;</button>';

    btns.innerHTML = html;
};

window.goToTransaksiPage = function(page) {
    window._trxCurrentPage = page;
    window.renderSemuaTransaksiTable();
};

window.changeTransaksiPageSize = function(size) {
    window._trxPageSize = size;
    window._trxCurrentPage = 1;
    window.renderSemuaTransaksiTable();
};

window.exportTransaksiCSV = function() {
    var data = window._transaksiFilteredList || window._semuaTransaksiList || [];
    if (data.length === 0) {
        if (typeof showToast === 'function') showToast('Tidak ada data transaksi untuk diekspor.', 'warning');
        return;
    }

    var csvRows = [];
    csvRows.push(['No Pesanan', 'ID Transaksi', 'Tanggal', 'Nama Pelanggan', 'Kategori/Item', 'Nominal (Rp)', 'Metode Bayar', 'Status Bayar', 'Petugas Kasir'].join(','));

    data.forEach(function(item) {
        var row = [
            '"' + (item.orderNum || '').replace(/"/g, '""') + '"',
            '"' + (item.id || '').replace(/"/g, '""') + '"',
            '"' + (item.date || '').replace(/"/g, '""') + '"',
            '"' + (item.customer || '').replace(/"/g, '""') + '"',
            '"' + (item.category || '').replace(/"/g, '""') + '"',
            Number(item.price || 0),
            '"' + (item.payment || '').replace(/"/g, '""') + '"',
            '"' + (item.statusBayar || item.status || '').replace(/"/g, '""') + '"',
            '"' + (item.kasir || '').replace(/"/g, '""') + '"'
        ];
        csvRows.push(row.join(','));
    });

    var csvContent = '\uFEFF' + csvRows.join('\r\n');
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Laporan_Semua_Transaksi_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (typeof showToast === 'function') showToast('Berhasil mengekspor ' + data.length + ' transaksi ke file CSV.', 'success');
};
