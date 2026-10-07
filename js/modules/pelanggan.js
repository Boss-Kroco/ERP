/**
 * Module Pelanggan & Piutang
 */

window._pelangganDataList = [];
window.allPelanggan = window._pelangganDataList;
window.TABUNGAN_STORAGE_KEY = 'bos_kroco_tabungan_map';

window.getPelangganTabunganMap = function() {
    try {
        var raw = localStorage.getItem(window.TABUNGAN_STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.warn('Gagal membaca tabungan map:', e);
        return {};
    }
};

window.savePelangganTabunganMap = function(map) {
    try {
        localStorage.setItem(window.TABUNGAN_STORAGE_KEY, JSON.stringify(map || {}));
    } catch (e) {
        console.warn('Gagal menyimpan tabungan map:', e);
    }
};

window.updateCustomerTabungan = function(pelangganId, amount) {
    if (!pelangganId) return;
    var map = window.getPelangganTabunganMap();
    map[pelangganId] = Math.max(0, Number(amount || 0));
    window.savePelangganTabunganMap(map);

    // Update in-memory lists
    if (window._pelangganDataList) {
        var found = window._pelangganDataList.find(function(p) {
            return p.pelanggan_id === pelangganId || p.id === pelangganId;
        });
        if (found) {
            found.tabungan = map[pelangganId];
            found.id = found.pelanggan_id;
        }
    }
    window.allPelanggan = window._pelangganDataList;

    if (typeof window.renderPelangganTable === 'function') window.renderPelangganTable();
    if (typeof window.updatePelangganMetrics === 'function') window.updatePelangganMetrics();
    if (typeof window.populatePosCustomers === 'function') window.populatePosCustomers();
    if (typeof window.updatePosKembalian === 'function') window.updatePosKembalian();
    if (typeof window.updateKeuanganMetrics === 'function') window.updateKeuanganMetrics();
};

window.loadPelangganData = function() {
    var tbl = document.getElementById('tblPelangganLogs');

    var finishLoading = function(list) {
        var tabMap = window.getPelangganTabunganMap();
        window._pelangganDataList = (list || []).map(function(p) {
            p.id = p.pelanggan_id;
            if (tabMap[p.pelanggan_id] !== undefined) {
                p.tabungan = Number(tabMap[p.pelanggan_id] || 0);
            } else {
                p.tabungan = Number(p.tabungan || 0);
            }
            return p;
        });
        window.allPelanggan = window._pelangganDataList;
        window.renderPelangganTable();
        window.updatePelangganMetrics();
        if (typeof window.populatePosCustomers === 'function') window.populatePosCustomers();
        if (typeof window.updateKeuanganMetrics === 'function') window.updateKeuanganMetrics();
    };

    if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.isConfigured()) {
        if (tbl) tbl.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">Sistem Offline. Konfigurasi database belum tersedia.</td></tr>';
        return;
    }

    var sb = window.supabaseClient;
    sb.from('pelanggan_toko').select('*').order('nama_toko', { ascending: true })
      .then(function(res) {
          if (res.error) {
              console.error(res.error);
              if (tbl) tbl.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px; color: red;">Gagal memuat data pelanggan.</td></tr>';
              return;
          }
          finishLoading(res.data || []);
      })
      .catch(function(err) {
          console.error(err);
      });
};

window.renderPelangganTable = function() {
    var tbl = document.getElementById('tblPelangganLogs');
    if (!tbl) return;
    
    var q = (document.getElementById('searchPelangganTable') ? document.getElementById('searchPelangganTable').value : '').toLowerCase();
    
    var html = '';
    var count = 0;
    
    window._pelangganDataList.forEach(function(p) {
        if (q) {
            var nama = (p.nama_toko || '').toLowerCase();
            var id = (p.pelanggan_id || '').toLowerCase();
            if (nama.indexOf(q) === -1 && id.indexOf(q) === -1) return;
        }
        
        var isPiutang = p.total_piutang > 0;
        var statusBadge = isPiutang 
            ? '<span style="background: #fef2f2; color: #ef4444; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Ada Piutang</span>'
            : '<span style="background: #f0fdf4; color: #16a34a; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600;">Aman Lunas</span>';
            
        html += '<tr style="border-bottom: 1px solid var(--border-soft); transition: background 0.2s;">';
        html += '  <td style="padding: 14px 16px; font-size: 12.5px; font-weight: 600; color: var(--text-dark);">' + (window.escapeHtml ? window.escapeHtml(p.pelanggan_id) : p.pelanggan_id) + '</td>';
        html += '  <td style="padding: 14px 16px; font-size: 13px; font-weight: 700; color: var(--violet-main);">' + (window.escapeHtml ? window.escapeHtml(p.nama_toko) : p.nama_toko) + '</td>';
        html += '  <td style="padding: 14px 16px; font-size: 12.5px; color: var(--text-muted);">' + (window.escapeHtml ? window.escapeHtml(p.kontak || '-') : p.kontak || '-') + '</td>';
        html += '  <td style="padding: 14px 16px; font-size: 12.5px; color: var(--text-muted); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="'+(window.escapeHtml ? window.escapeHtml(p.alamat||'') : p.alamat||'')+'">' + (window.escapeHtml ? window.escapeHtml(p.alamat || '-') : p.alamat || '-') + '</td>';
        html += '  <td style="padding: 14px 16px; font-size: 13px; font-weight: 700; color: ' + (isPiutang ? '#e11d48' : 'var(--text-dark)') + ';">' + window.formatAppCurrency(p.total_piutang) + '</td>';
        html += '  <td style="padding: 14px 16px; font-size: 13px; font-weight: 700; color: var(--emerald);">' + window.formatAppCurrency(p.tabungan || 0) + '</td>';
        html += '  <td style="padding: 14px 16px;">' + statusBadge + '</td>';
        
        // Aksi
        html += '  <td style="padding: 14px 16px; text-align: right;">';
        html += '    <button onclick="window.editPelanggan(\'' + p.pelanggan_id + '\')" style="background: transparent; border: none; cursor: pointer; color: var(--violet-main); padding: 4px;" title="Edit Data"><svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>';
        html += '  </td>';
        
        html += '</tr>';
        count++;
    });
    
    if (count === 0) {
        html = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">Tidak ada data pelanggan ditemukan.</td></tr>';
    }
    
    tbl.innerHTML = html;
};

window.filterPelanggan = function() {
    window.renderPelangganTable();
};

window.updatePelangganMetrics = function() {
    var total = window._pelangganDataList.length;
    var totalPiutang = 0;
    var totalTabungan = 0;
    window._pelangganDataList.forEach(function(p) {
        totalPiutang += Number(p.total_piutang || 0);
        totalTabungan += Number(p.tabungan || 0);
    });
    
    if (document.getElementById('lblTotalPelanggan')) {
        document.getElementById('lblTotalPelanggan').textContent = total;
    }
    if (document.getElementById('lblTotalPiutangPelanggan')) {
        document.getElementById('lblTotalPiutangPelanggan').textContent = window.formatAppCurrency(totalPiutang);
    }
    if (document.getElementById('lblTotalTabunganPelanggan')) {
        document.getElementById('lblTotalTabunganPelanggan').textContent = window.formatAppCurrency(totalTabungan);
    }
};

window.openPelangganModal = function() {
    document.getElementById('inpPelangganIdMode').value = 'NEW';
    document.getElementById('inpPelangganId').value = '';
    document.getElementById('inpPelangganNama').value = '';
    document.getElementById('inpPelangganKontak').value = '';
    document.getElementById('inpPelangganAlamat').value = '';
    var elTab = document.getElementById('inpPelangganTabungan');
    if (elTab) elTab.value = '';
    document.getElementById('modalPelangganTitle').textContent = 'Tambah Pelanggan Baru';
    
    var modal = document.getElementById('modalFormPelanggan');
    var content = document.getElementById('modalFormPelangganContent');
    modal.style.display = 'flex';
    // Animasi masuk
    setTimeout(function() {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }, 10);
};

window.closePelangganModal = function() {
    var modal = document.getElementById('modalFormPelanggan');
    var content = document.getElementById('modalFormPelangganContent');
    content.style.opacity = '0';
    content.style.transform = 'translateY(20px)';
    setTimeout(function() {
        modal.style.display = 'none';
    }, 300);
};

window.editPelanggan = function(id) {
    var p = window._pelangganDataList.find(function(x) { return x.pelanggan_id === id; });
    if (!p) return;
    
    document.getElementById('inpPelangganIdMode').value = 'EDIT';
    document.getElementById('inpPelangganId').value = p.pelanggan_id;
    document.getElementById('inpPelangganNama').value = p.nama_toko || '';
    document.getElementById('inpPelangganKontak').value = p.kontak || '';
    document.getElementById('inpPelangganAlamat').value = p.alamat || '';
    var elTab = document.getElementById('inpPelangganTabungan');
    if (elTab) elTab.value = p.tabungan || 0;
    document.getElementById('modalPelangganTitle').textContent = 'Edit Data Pelanggan';
    
    var modal = document.getElementById('modalFormPelanggan');
    var content = document.getElementById('modalFormPelangganContent');
    modal.style.display = 'flex';
    setTimeout(function() {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }, 10);
};

window.savePelanggan = function() {
    var mode = document.getElementById('inpPelangganIdMode').value;
    var id = document.getElementById('inpPelangganId').value;
    var nama = (document.getElementById('inpPelangganNama').value || '').trim();
    var kontak = (document.getElementById('inpPelangganKontak').value || '').trim();
    var alamat = (document.getElementById('inpPelangganAlamat').value || '').trim();
    var elTab = document.getElementById('inpPelangganTabungan');
    var tabungan = elTab ? (parseFloat(elTab.value) || 0) : 0;
    
    if (!nama) {
        if(window.showToast) window.showToast('Nama pelanggan wajib diisi', 'error');
        return;
    }
    
    if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.isConfigured()) {
        if(window.showToast) window.showToast('Sistem offline, tidak bisa menyimpan data', 'error');
        return;
    }
    
    var sb = window.supabaseClient;
    
    if (mode === 'NEW') {
        var newId = 'CUST-' + Date.now().toString().slice(-6);
        var insertPayload = {
            pelanggan_id: newId,
            nama_toko: nama,
            kontak: kontak || '-',
            alamat: alamat || '-',
            total_beli: 0,
            total_piutang: 0,
            status: 'Aktif'
        };
        sb.from('pelanggan_toko').insert([insertPayload]).then(function(res) {
            if (res.error) {
                console.error(res.error);
                if(window.showToast) window.showToast('Gagal menyimpan pelanggan: ' + res.error.message, 'error');
            } else {
                window.updateCustomerTabungan(newId, tabungan);
                if(window.showToast) window.showToast('Pelanggan berhasil ditambahkan!', 'success');
                window.closePelangganModal();
                window.loadPelangganData();
            }
        });
    } else {
        var updatePayload = {
            nama_toko: nama,
            kontak: kontak || '-',
            alamat: alamat || '-'
        };
        sb.from('pelanggan_toko').update(updatePayload).eq('pelanggan_id', id).then(function(res) {
            if (res.error) {
                console.error(res.error);
                if(window.showToast) window.showToast('Gagal memperbarui pelanggan: ' + res.error.message, 'error');
            } else {
                window.updateCustomerTabungan(id, tabungan);
                if(window.showToast) window.showToast('Data pelanggan diperbarui!', 'success');
                window.closePelangganModal();
                window.loadPelangganData();
            }
        });
    }
};

// Override navigatePage dari app.js untuk intercept saat membuka view pelanggan
// Karena JS ini dimuat sebelum DOM di app.js full (atau bisa juga dimuat setelahnya), 
// kita hook saja saat document re-rendered atau saat tab diklik.

if (typeof window.originalNavigatePage === 'undefined') {
    // Simpan referensi navigatePage asli jika sudah ada, atau kita hook
    if (typeof window.navigatePage === 'function') {
        window.originalNavigatePage = window.navigatePage;
        window.navigatePage = function(viewId) {
            window.originalNavigatePage(viewId);
            if (viewId === 'pelanggan') {
                document.getElementById('pageHeaderTitle').textContent = 'Pelanggan & Piutang';
                if (window.loadPelangganData) window.loadPelangganData();
            }
        };
    }
}
