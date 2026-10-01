/**
 * ============================================================================
 * BOS KROCO ERP - AUDIT TRAIL MODULE
 * File: js/modules/audit.js
 * ============================================================================
 */

var allAuditLogs = [];

function fetchAuditLogs() {
    runBackend('apiGetAuditTrail', [window.currentUser], function (res) {
        var tbody = document.getElementById('tblAuditLogs');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!res.success) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--coral-pink); font-weight:700;">' + escapeHtml(res.message || 'Akses ditolak.') + '</td></tr>';
            return;
        }
        allAuditLogs = res.data || [];
        if (allAuditLogs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:16px;">Belum ada log audit.</td></tr>';
            return;
        }
        renderAuditLogRows(allAuditLogs);
    });
}

function filterAuditLogs() {
    var input = document.getElementById('searchAuditTable');
    var q = (input ? input.value : '').toLowerCase().trim();
    if (!q) {
        renderAuditLogRows(allAuditLogs);
        return;
    }
    var filtered = (allAuditLogs || []).filter(function (l) {
        return (l.logId && l.logId.toLowerCase().indexOf(q) !== -1)
            || (l.namaUser && l.namaUser.toLowerCase().indexOf(q) !== -1)
            || (l.userId && l.userId.toLowerCase().indexOf(q) !== -1)
            || (l.modul && l.modul.toLowerCase().indexOf(q) !== -1)
            || (l.aksi && l.aksi.toLowerCase().indexOf(q) !== -1)
            || (l.keterangan && l.keterangan.toLowerCase().indexOf(q) !== -1);
    });
    var tbody = document.getElementById('tblAuditLogs');
    if (!tbody) return;
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:16px;">Tidak ada catatan log audit yang cocok.</td></tr>';
        return;
    }
    renderAuditLogRows(filtered);
}

function renderAuditLogRows(logs) {
    var tbody = document.getElementById('tblAuditLogs');
    if (!tbody) return;
    tbody.innerHTML = '';
    (logs || []).forEach(function (l) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td><b>' + escapeHtml(l.logId || l.id || '-') + '</b></td>'
            + '<td>' + escapeHtml(l.waktu || '-') + '</td>'
            + '<td>' + escapeHtml(l.namaUser || '-') + '</td>'
            + '<td><span class="badge-pill">' + escapeHtml(l.modul || '-') + '</span></td>'
            + '<td><b>' + escapeHtml(l.aksi || '-') + '</b></td>'
            + '<td>' + escapeHtml(l.nilaiLama || '-') + '</td>'
            + '<td>' + escapeHtml(l.nilaiBaru || '-') + '</td>'
            + '<td>' + escapeHtml(l.keterangan || '-') + '</td>';
        tbody.appendChild(tr);
    });
}

// Export audit functions to window
window.fetchAuditLogs = fetchAuditLogs;
window.filterAuditLogs = filterAuditLogs;
window.renderAuditLogRows = renderAuditLogRows;
