
var escapeHtml = function (str) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(str);
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Manajemen Kategori Kustom & Tier Harga
window.getCustomCategories = function() {
    var defaults = ['Makanan Ringan', 'Kue Kering', 'Sambal & Saus', 'Minuman', 'Bahan Pokok'];
    try {
        var saved = localStorage.getItem('bos_kroco_custom_categories');
        if (saved) {
            var arr = JSON.parse(saved);
            if (Array.isArray(arr) && arr.length > 0) return arr;
        }
    } catch(e) {}
    return defaults;
};

window.saveCustomCategory = function(catName) {
    if (!catName || !catName.trim()) return;
    var cats = window.getCustomCategories();
    if (!cats.includes(catName.trim())) {
        cats.push(catName.trim());
        try { localStorage.setItem('bos_kroco_custom_categories', JSON.stringify(cats)); } catch(e){}
    }
    window.refreshCategoryDropdowns();
};

window.refreshCategoryDropdowns = function() {
    var cats = window.getCustomCategories();
    var prods = (window.catalogProducts && window.catalogProducts.length) ? window.catalogProducts : (typeof catalogProducts !== 'undefined' && catalogProducts ? catalogProducts : []);
    prods.forEach(function(p) {
        if (p && p.kategori && p.kategori.trim() && !cats.includes(p.kategori.trim())) {
            cats.push(p.kategori.trim());
        }
    });

    var filterSel = document.getElementById('filterKategoriMasterProduk');
    if (filterSel) {
        var curVal = filterSel.value;
        filterSel.innerHTML = '<option value="">Semua Kategori</option>' + cats.map(function(c) {
            return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
        }).join('');
        if (curVal) filterSel.value = curVal;
    }
    var hppFilterSel = document.getElementById('filterKategoriDaftarHpp');
    if (hppFilterSel) {
        var curValHpp = hppFilterSel.value;
        hppFilterSel.innerHTML = '<option value="">Semua Kategori</option>' + cats.map(function(c) {
            return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
        }).join('');
        if (curValHpp) hppFilterSel.value = curValHpp;
    }
    var editSel = document.getElementById('editProdKategori');
    if (editSel) {
        var curValEdit = editSel.value;
        editSel.innerHTML = cats.map(function(c) {
            return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
        }).join('');
        if (curValEdit) editSel.value = curValEdit;
    }
    var newProdSel = document.getElementById('newProdKategori');
    if (newProdSel) {
        var curValNew = newProdSel.value;
        newProdSel.innerHTML = cats.map(function(c) {
            return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
        }).join('');
        if (curValNew) newProdSel.value = curValNew;
    }
};

window.tambahKategoriBaruPrompt = function(targetSelectId) {
    var input = window.prompt('Masukkan nama kategori baru:');
    if (!input || !input.trim()) return;
    var cat = input.trim();
    window.saveCustomCategory(cat);
    if (targetSelectId) {
        var el = document.getElementById(targetSelectId);
        if (el) el.value = cat;
    }
    if (typeof showToast === 'function') showToast('Kategori "' + cat + '" berhasil ditambahkan.', 'success');
};

// Multi-Tier Harga Helpers
window.tambahRowTierHarga = function(containerId, labelVal, priceVal) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var row = document.createElement('div');
    row.className = 'tier-price-row';
    row.style.cssText = 'display: flex; gap: 8px; align-items: center;';
    row.innerHTML = '<input type="text" class="search-filter-input tier-label" placeholder="Nama Tingkat (cth: Harga A)" value="' + (labelVal || '') + '" style="flex: 1; border-radius: 10px; font-size: 11.5px; padding: 5px 8px;">' +
        '<input type="number" step="any" class="search-filter-input tier-price" placeholder="Harga" value="' + (priceVal !== undefined ? priceVal : '') + '" style="width: 120px; border-radius: 10px; font-size: 11.5px; padding: 5px 8px;">' +
        '<button type="button" class="btn-pill-action" style="background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; padding: 4px 8px; border-radius: 8px; font-size: 11px;" onclick="this.parentElement.remove()">X</button>';
    container.appendChild(row);
};

window.getTierPricesFromContainer = function(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return [];
    var rows = container.querySelectorAll('.tier-price-row');
    var tiers = [];
    rows.forEach(function(r) {
        var lbl = (r.querySelector('.tier-label') ? r.querySelector('.tier-label').value : '').trim();
        var prc = parseFloat(r.querySelector('.tier-price') ? r.querySelector('.tier-price').value : 0) || 0;
        if (lbl && prc > 0) {
            tiers.push({ label: lbl, harga: prc });
        }
    });
    return tiers;
};

// Real-time filtering and default A-Z sorting
window.filterMasterProdukRealtime = function() {
    var tbody = document.getElementById('tblMasterProduk');
    if (!tbody) return;

    var filterSel = document.getElementById('filterKategoriMasterProduk');
    if (filterSel && filterSel.options.length <= 1) {
        window.refreshCategoryDropdowns();
    }

    var q = (document.getElementById('searchMasterProduk') ? document.getElementById('searchMasterProduk').value : '').toLowerCase().trim();
    var cat = (document.getElementById('filterKategoriMasterProduk') ? document.getElementById('filterKategoriMasterProduk').value : '').trim();
    var sort = (document.getElementById('sortMasterProduk') ? document.getElementById('sortMasterProduk').value : 'az') || 'az';

    if (localStorage.getItem('mafaza_production_mode') === 'true' && (!window.catalogProducts || window.catalogProducts.length === 0)) {
        catalogProducts = [];
        window.catalogProducts = [];
    }

    var source = (window.catalogProducts && window.catalogProducts.length) ? window.catalogProducts : (catalogProducts || []);
    catalogProducts = source;
    window.catalogProducts = source;

    tbody.innerHTML = '';
    if (!source || source.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 36px 16px; color: #94a3b8; font-size: 13px;">' +
            '<div style="font-weight: 700; color: #64748b; margin-bottom: 4px;">Belum Ada Master Produk</div>' +
            'Klik tombol <b>+ Tambah Produk</b> di atas untuk mulai memasukkan produk jualan toko Anda.' +
            '</td></tr>';
        return;
    }

    var filtered = source.filter(function(p) {
        if (!p) return false;
        var pNama = (p.namaProduk || '').toLowerCase();
        var pId = (p.produkId || '').toLowerCase();
        var pSatuan = (p.satuan || '').toLowerCase();
        var pKat = (p.kategori || '').toLowerCase();
        var matchQ = !q || pNama.includes(q) || pId.includes(q) || pSatuan.includes(q) || pKat.includes(q);
        var matchCat = !cat || p.kategori === cat;
        return matchQ && matchCat;
    });

    if (sort === 'az') {
        filtered.sort(function(a, b) { return (a.namaProduk || '').trim().localeCompare((b.namaProduk || '').trim(), 'id', { sensitivity: 'base' }); });
    } else if (sort === 'za') {
        filtered.sort(function(a, b) { return (b.namaProduk || '').trim().localeCompare((a.namaProduk || '').trim(), 'id', { sensitivity: 'base' }); });
    } else if (sort === 'stok_desc') {
        filtered.sort(function(a, b) {
            var stkB = (parseFloat(b.stokEtalase) || 0) + (parseFloat(b.stokGudang) || 0);
            var stkA = (parseFloat(a.stokEtalase) || 0) + (parseFloat(a.stokGudang) || 0);
            return stkB - stkA;
        });
    } else if (sort === 'stok_asc') {
        filtered.sort(function(a, b) {
            var stkA = (parseFloat(a.stokEtalase) || 0) + (parseFloat(a.stokGudang) || 0);
            var stkB = (parseFloat(b.stokEtalase) || 0) + (parseFloat(b.stokGudang) || 0);
            return stkA - stkB;
        });
    } else if (sort === 'harga_desc') {
        filtered.sort(function(a, b) {
            return (parseFloat(b.hargaJual) || 0) - (parseFloat(a.hargaJual) || 0);
        });
    } else if (sort === 'harga_asc') {
        filtered.sort(function(a, b) {
            return (parseFloat(a.hargaJual) || 0) - (parseFloat(b.hargaJual) || 0);
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 36px 16px; color: #94a3b8; font-size: 13px;">' +
            '<div style="font-weight: 700; color: #64748b; margin-bottom: 4px;">Produk Tidak Ditemukan</div>' +
            'Tidak ada produk yang cocok dengan pencarian atau filter kategori saat ini.' +
            '</td></tr>';
        return;
    }

    filtered.forEach(function (p) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td><b>' + escapeHtml(p.produkId) + '</b></td>'
            + '<td>' + escapeHtml(p.namaProduk) + '</td>'
            + '<td>' + escapeHtml(p.satuan || 'Pcs') + '</td>'
            + '<td>' + window.formatAppCurrency(p.hargaBeliHPP) + '</td>'
            + '<td><b>' + window.formatAppCurrency(p.hargaJual) + '</b></td>'
            + '<td><span style="color:var(--emerald); font-weight:800;">' + escapeHtml(String(p.stokEtalase || 0)) + '</span></td>'
            + '<td>' + escapeHtml(String(p.stokGudang || 0)) + '</td>'
            + '<td><span class="prog-status-pill ' + (p.status === 'Aktif' ? 'green' : 'coral') + '">' + escapeHtml(p.status || 'Aktif') + '</span></td>'
            + '<td style="text-align: center; white-space: nowrap;">'
            + '<button class="btn-pill-action btn-pill-secondary" style="padding: 2px 8px; margin-right: 4px; color: var(--violet-main); border-color: #c7d2fe; background: #eef2ff; font-weight: 700;" onclick="window.openModalAdjustStok(\'' + escapeHtml(p.produkId) + '\')" title="Koreksi / Tambah / Kurang Stok">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 2px;"><path d="M12 5v14M5 12h14"/></svg> +/- Stok'
            + '</button>'
            + '<button class="btn-pill-action btn-pill-secondary" style="padding: 2px 8px;" onclick="openModalEditProduk(\'' + escapeHtml(p.produkId) + '\')" title="Edit Produk">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit'
            + '</button>'
            + '</td>';
        tbody.appendChild(tr);
    });
};

/**
 * ============================================================================
 * MAFAZA GROUP ERP - MASTER PRODUK MODULE
 * File: js/modules/produk.js
 * ============================================================================
 */

var catalogProducts = [];
        var selectedOrderIds = [];
        var dueAlertsData = [];

        // Master 10 Synchronized Transactions matching Foto 1
        // orderTransactions moved to dashboard.js

function fetchMasterProducts() {
    runBackend('apiGetProductsPaginated', [{ page: 1, limit: 30 }], function (res) {
        if (res.success) {
            catalogProducts = res.data || [];
            window.catalogProducts = catalogProducts;
            renderMasterProdukTable();
            populateProductDropdowns();
            if (typeof window.renderDaftarHPP === 'function') {
                window.renderDaftarHPP();
            }
        }
    });
}

function renderMasterProdukTable() {
    window.filterMasterProdukRealtime();
}

function populateProductDropdowns() {
    var posSelect = document.getElementById('posSelectProduk');
    var prodSelect = document.getElementById('prodBatchProdukId');
    var tfSelect = document.getElementById('tfProdukId');
    var opnameSelect = document.getElementById('opnameProdukId');
    var hppSelect = document.getElementById('hppSelProduk');

    var currentProds = (window.catalogProducts && window.catalogProducts.length) ? window.catalogProducts : (catalogProducts || []);
    catalogProducts = currentProds;
    window.catalogProducts = currentProds;

    var optHtml = '<option value="">-- Pilih Produk --</option>';
    currentProds.forEach(function (p) {
        var safeNama = escapeHtml(p.namaProduk);
        var safeId = escapeHtml(p.produkId);
        var safeSatuan = escapeHtml(p.satuan || 'Pcs');
        optHtml += '<option value="' + safeId + '" data-nama="' + safeNama + '" data-harga="' + Number(p.hargaJual || 0) + '" data-hpp="' + Number(p.hargaBeliHPP || 0) + '">' + safeNama + ' (Etalase: ' + escapeHtml(String(p.stokEtalase || 0)) + ' ' + safeSatuan + ')</option>';
    });

    if (posSelect) posSelect.innerHTML = optHtml;
    if (prodSelect) prodSelect.innerHTML = optHtml;
    if (tfSelect) tfSelect.innerHTML = optHtml;
    if (opnameSelect) opnameSelect.innerHTML = optHtml;

    if (hppSelect) {
        var prevVal = hppSelect.value;
        var hppOptHtml = '<option value="">-- Pilih Produk --</option>';
        currentProds.forEach(function (p) {
            var safeNama = escapeHtml(p.namaProduk);
            var safeId = escapeHtml(p.produkId);
            hppOptHtml += '<option value="' + safeId + '">' + safeNama + ' (' + safeId + ')</option>';
        });
        hppSelect.innerHTML = hppOptHtml;
        if (prevVal) hppSelect.value = prevVal;
    }

    if (typeof window.hitungLiveHppPreview === 'function') {
        window.hitungLiveHppPreview();
    }
    if (typeof window.renderPosProductGrid === 'function') {
        window.renderPosProductGrid();
    }
}

function openModalTambahProduk() { document.getElementById('modalTambahProduk').classList.add('active'); }

function closeModalTambahProduk() { document.getElementById('modalTambahProduk').classList.remove('active'); }

function submitTambahProduk() {
    var nama = (document.getElementById('newProdNama').value || '').trim();
    if (!nama) {
        showToast('Nama produk wajib diisi.', 'error');
        return;
    }
    var stokEtalaseVal = parseFloat((document.getElementById('newProdStokEtalase') || {}).value) || 0;
    var stokGudangVal = parseFloat((document.getElementById('newProdStokGudang') || {}).value) || 0;

    var rawNewHpp = parseFloat(document.getElementById('newProdHpp').value) || 0;
    var rawNewJual = parseFloat(document.getElementById('newProdHargaJual').value) || 0;
    var rawNewGrosir = parseFloat(document.getElementById('newProdHargaGrosir').value) || 0;

    var baseNewHpp = Math.round((typeof window.fromAppCurrency === 'function') ? window.fromAppCurrency(rawNewHpp) : rawNewHpp);
    var baseNewJual = Math.round((typeof window.fromAppCurrency === 'function') ? window.fromAppCurrency(rawNewJual) : rawNewJual);
    var baseNewGrosir = Math.round((typeof window.fromAppCurrency === 'function') ? window.fromAppCurrency(rawNewGrosir) : rawNewGrosir);

    var payload = {
        namaProduk: nama,
        satuan: (document.getElementById('newProdSatuan').value || 'Pcs').trim(),
        hargaBeliHPP: baseNewHpp,
        hargaJual: baseNewJual,
        minQtyGrosir: parseFloat(document.getElementById('newProdMinQtyGrosir').value) || 0,
        hargaGrosir: baseNewGrosir,
        stokEtalase: stokEtalaseVal,
        stokGudang: stokGudangVal
    };

    showToast('Menyimpan data produk baru...', 'info');

    runBackend('apiSaveProduct', [payload, window.currentUser], function (res) {
        if (!res || !res.success) {
            showToast((res && res.message) || 'Gagal menyimpan produk.', 'error');
            return;
        }
        showToast(res.message || 'Produk berhasil didaftarkan.', 'success');
        closeModalTambahProduk();
        
        var generatedId = res.produkId || ('PRD-' + Date.now().toString().slice(-4));
        var newProd = {
            produkId: generatedId,
            namaProduk: payload.namaProduk,
            satuan: payload.satuan,
            hargaBeliHPP: payload.hargaBeliHPP,
            hargaJual: payload.hargaJual,
            minQtyGrosir: payload.minQtyGrosir,
            hargaGrosir: payload.hargaGrosir,
            stokEtalase: payload.stokEtalase,
            stokGudang: payload.stokGudang,
            status: 'Aktif'
        };

        catalogProducts.unshift(newProd);
        window.catalogProducts = catalogProducts;
        try {
            localStorage.setItem('bos_kroco_catalog_products', JSON.stringify(catalogProducts));
        } catch (e) {}

        // Reset form inputs
        document.getElementById('newProdNama').value = '';
        document.getElementById('newProdSatuan').value = 'Pcs';
        document.getElementById('newProdHpp').value = '';
        document.getElementById('newProdHargaJual').value = '';
        document.getElementById('newProdMinQtyGrosir').value = '';
        document.getElementById('newProdHargaGrosir').value = '';
        if (document.getElementById('newProdStokEtalase')) document.getElementById('newProdStokEtalase').value = '0';
        if (document.getElementById('newProdStokGudang')) document.getElementById('newProdStokGudang').value = '0';

        renderMasterProdukTable();
        populateProductDropdowns();
        if (typeof window.renderPosProductGrid === 'function') window.renderPosProductGrid();
        if (typeof window.renderDaftarHPP === 'function') window.renderDaftarHPP();
    }, function(err) {
        showToast('Gagal menyimpan produk: ' + (err.message || 'Koneksi terganggu'), 'error');
    });
}

function openModalEditProduk(produkId) {
            var item = (catalogProducts || []).find(function (p) { return p.produkId === produkId; });
            if (!item) {
                showToast('Data produk ' + produkId + ' tidak ditemukan.', 'error');
                return;
            }

            var elId = document.getElementById('editProdId');
            if (elId) elId.value = item.produkId;
            var elBadge = document.getElementById('editProdIdBadge');
            if (elBadge) elBadge.textContent = item.produkId;
            var elNama = document.getElementById('editProdNama');
            if (elNama) elNama.value = item.namaProduk || '';
            var elSat = document.getElementById('editProdSatuan');
            if (elSat) elSat.value = item.satuan || 'Pcs';
            var hppInCurr = (typeof window.toAppCurrency === 'function') ? window.toAppCurrency(item.hargaBeliHPP || 0) : (item.hargaBeliHPP || 0);
            var jualInCurr = (typeof window.toAppCurrency === 'function') ? window.toAppCurrency(item.hargaJual || 0) : (item.hargaJual || 0);
            var grosirInCurr = (typeof window.toAppCurrency === 'function') ? window.toAppCurrency(item.hargaGrosir || 0) : (item.hargaGrosir || 0);

            var elHpp = document.getElementById('editProdHpp');
            if (elHpp) elHpp.value = Number(hppInCurr.toFixed(2));
            var elJual = document.getElementById('editProdHargaJual');
            if (elJual) elJual.value = Number(jualInCurr.toFixed(2));
            var elStat = document.getElementById('editProdStatus');
            if (elStat) elStat.value = item.status || 'Aktif';
            
            var elMinQty = document.getElementById('editProdMinQtyGrosir');
            if (elMinQty) elMinQty.value = item.minQtyGrosir || '';
            var elHargaGrosir = document.getElementById('editProdHargaGrosir');
            if (elHargaGrosir) elHargaGrosir.value = (item.hargaGrosir !== undefined && item.hargaGrosir !== '') ? Number(grosirInCurr.toFixed(2)) : '';

            var elStokEtalase = document.getElementById('editProdStokEtalase');
            if (elStokEtalase) elStokEtalase.value = Number(item.stokEtalase !== undefined ? item.stokEtalase : 0);
            var elStokGudang = document.getElementById('editProdStokGudang');
            if (elStokGudang) elStokGudang.value = Number(item.stokGudang !== undefined ? item.stokGudang : 0);

            var modal = document.getElementById('modalEditProduk');
            if (modal) modal.classList.add('active');
        }

function closeModalEditProduk() {
            var modal = document.getElementById('modalEditProduk');
            if (modal) modal.classList.remove('active');
        }

function submitEditProduk() {
    var prodId = document.getElementById('editProdId').value;
    var rawHpp = parseFloat(document.getElementById('editProdHpp').value) || 0;
    var rawJual = parseFloat(document.getElementById('editProdHargaJual').value) || 0;
    var rawGrosir = parseFloat(document.getElementById('editProdHargaGrosir').value) || 0;

    var baseHpp = Math.round((typeof window.fromAppCurrency === 'function') ? window.fromAppCurrency(rawHpp) : rawHpp);
    var baseJual = Math.round((typeof window.fromAppCurrency === 'function') ? window.fromAppCurrency(rawJual) : rawJual);
    var baseGrosir = Math.round((typeof window.fromAppCurrency === 'function') ? window.fromAppCurrency(rawGrosir) : rawGrosir);

    var sEtalase = Math.max(0, parseFloat((document.getElementById('editProdStokEtalase') || {}).value) || 0);
    var sGudang = Math.max(0, parseFloat((document.getElementById('editProdStokGudang') || {}).value) || 0);

    var payload = {
        produkId: prodId,
        namaProduk: document.getElementById('editProdNama').value.trim(),
        satuan: document.getElementById('editProdSatuan').value.trim(),
        hargaBeliHPP: baseHpp,
        hargaJual: baseJual,
        minQtyGrosir: parseFloat(document.getElementById('editProdMinQtyGrosir').value) || 0,
        hargaGrosir: baseGrosir,
        stokEtalase: sEtalase,
        stokGudang: sGudang,
        status: document.getElementById('editProdStatus').value
    };

    showToast('Menyimpan perubahan produk ' + prodId + '...', 'info');

    runBackend('apiUpdateProduct', [payload, window.currentUser], function (res) {
        if (!res.success) {
            showToast(res.message || 'Gagal memperbarui produk.', 'error');
            return;
        }

        // Update lokal catalogProducts
        for (var i = 0; i < catalogProducts.length; i++) {
            if (catalogProducts[i].produkId === prodId) {
                catalogProducts[i].namaProduk = payload.namaProduk;
                catalogProducts[i].satuan = payload.satuan;
                catalogProducts[i].hargaBeliHPP = payload.hargaBeliHPP;
                catalogProducts[i].hargaJual = payload.hargaJual;
                catalogProducts[i].minQtyGrosir = payload.minQtyGrosir;
                catalogProducts[i].hargaGrosir = payload.hargaGrosir;
                catalogProducts[i].stokEtalase = payload.stokEtalase;
                catalogProducts[i].stokGudang = payload.stokGudang;
                catalogProducts[i].status = payload.status;
                break;
            }
        }

        window.catalogProducts = catalogProducts;
        try {
            localStorage.setItem('bos_kroco_catalog_products', JSON.stringify(catalogProducts));
        } catch (e) {}

        renderMasterProdukTable();
        populateProductDropdowns();
        if (typeof window.renderPosProductGrid === 'function') window.renderPosProductGrid();
        if (typeof window.renderDaftarHPP === 'function') window.renderDaftarHPP();
        closeModalEditProduk();
        showToast(res.message || 'Produk berhasil diperbarui.', 'success');
    }, function (err) {
        showToast('Gagal update produk: ' + (err.message || 'Koneksi terganggu'), 'error');
    });
}

// Export functions to window
window.fetchMasterProducts = fetchMasterProducts;
window.renderMasterProdukTable = renderMasterProdukTable;
window.populateProductDropdowns = populateProductDropdowns;
window.openModalTambahProduk = openModalTambahProduk;
window.closeModalTambahProduk = closeModalTambahProduk;
window.submitTambahProduk = submitTambahProduk;
window.openModalEditProduk = openModalEditProduk;
window.closeModalEditProduk = closeModalEditProduk;
window.submitEditProduk = submitEditProduk;

/**
 * Hapus Produk dari Master Produk & Database Supabase
 */
window.hapusProduk = function (produkId, namaProduk) {
    var label = namaProduk || produkId;
    var confirmMsg = 'Apakah Anda yakin ingin MENGHAPUS produk makanan:\n\n"' + label + '" (' + produkId + ')\n\nData akan dihapus dari Master Produk, Kalkulasi HPP, dan Etalase Toko.\nTindakan ini tidak dapat dibatalkan.';
    if (!window.confirm(confirmMsg)) return;

    if (window.runBackend) {
        if (window.showToast) window.showToast('Menghapus ' + label + '...', 'info');
        window.runBackend('apiDeleteProduct', [produkId, window.currentUser], function (res) {
            if (res && res.success) {
                // Update in-memory catalog
                if (window.catalogProducts) {
                    window.catalogProducts = window.catalogProducts.filter(function (p) { return p.produkId !== produkId; });
                    try {
                        localStorage.setItem('bos_kroco_catalog_products', JSON.stringify(window.catalogProducts));
                    } catch(e) {}
                }
                if (typeof window.renderMasterProdukTable === 'function') window.renderMasterProdukTable();
                if (typeof window.populateProductDropdowns === 'function') window.populateProductDropdowns();
                if (typeof window.renderDaftarHPP === 'function') window.renderDaftarHPP();
                if (typeof window.renderPosProductGrid === 'function') window.renderPosProductGrid();
                if (typeof window.closeModalEditProduk === 'function') window.closeModalEditProduk();
                if (window.showToast) window.showToast('Produk "' + label + '" berhasil dihapus!', 'success');
            } else {
                if (window.showToast) window.showToast((res && res.message) || 'Gagal menghapus produk.', 'error');
            }
        });
    }
};


// ============================================================================
// FITUR KOREKSI / PENYESUAIAN STOK (TAMBAH & KURANG) & RESET KE 0
// ============================================================================
window.openModalAdjustStok = function(produkId) {
    var prods = (window.catalogProducts && window.catalogProducts.length) ? window.catalogProducts : (catalogProducts || []);
    var item = prods.find(function(p) { return p.produkId === produkId; });
    if (!item) {
        if (window.showToast) window.showToast('Produk tidak ditemukan.', 'error');
        return;
    }

    var modal = document.getElementById('modalAdjustStok');
    if (!modal) return;

    document.getElementById('adjustProdId').value = item.produkId;
    document.getElementById('adjustProdSku').textContent = 'ID: ' + item.produkId + ' (' + (item.satuan || 'Pcs') + ')';
    document.getElementById('adjustProdNama').textContent = item.namaProduk || '-';
    document.getElementById('adjustCurEtalase').textContent = Number(item.stokEtalase !== undefined ? item.stokEtalase : 0);
    document.getElementById('adjustCurGudang').textContent = Number(item.stokGudang !== undefined ? item.stokGudang : 0);

    document.getElementById('adjustLokasi').value = 'etalase';
    document.getElementById('adjustAksi').value = 'kurang';
    document.getElementById('adjustQty').value = '1';
    document.getElementById('adjustCatatan').value = '';

    window.updateAdjustPreview();
    modal.classList.add('active');
};

window.closeModalAdjustStok = function() {
    var modal = document.getElementById('modalAdjustStok');
    if (modal) modal.classList.remove('active');
};

window.setAdjustQuickQty = function(n) {
    var inp = document.getElementById('adjustQty');
    if (inp) {
        inp.value = n;
        window.updateAdjustPreview();
    }
};

window.setAdjustQuickZero = function() {
    var selAksi = document.getElementById('adjustAksi');
    var inp = document.getElementById('adjustQty');
    if (selAksi) selAksi.value = 'set';
    if (inp) inp.value = 0;
    window.updateAdjustPreview();
};

window.updateAdjustPreview = function() {
    var prodId = document.getElementById('adjustProdId').value;
    var prods = (window.catalogProducts && window.catalogProducts.length) ? window.catalogProducts : (catalogProducts || []);
    var item = prods.find(function(p) { return p.produkId === prodId; });
    if (!item) return;

    var lokasi = document.getElementById('adjustLokasi').value;
    var aksi = document.getElementById('adjustAksi').value;
    var qty = Math.max(0, parseFloat(document.getElementById('adjustQty').value) || 0);

    var curVal = (lokasi === 'etalase') ? Number(item.stokEtalase || 0) : Number(item.stokGudang || 0);
    var newVal = curVal;

    if (aksi === 'kurang') {
        newVal = Math.max(0, curVal - qty);
    } else if (aksi === 'tambah') {
        newVal = curVal + qty;
    } else if (aksi === 'set') {
        newVal = qty;
    }

    var lokasiLabel = (lokasi === 'etalase') ? 'Stok Etalase' : 'Stok Gudang';
    var box = document.getElementById('adjustPreviewBox');
    if (box) {
        var diff = newVal - curVal;
        var diffText = diff > 0 ? ('(+' + diff + ')') : (diff < 0 ? ('(' + diff + ')') : '(Tidak Berubah)');
        var diffColor = diff > 0 ? '#16a34a' : (diff < 0 ? '#dc2626' : '#64748b');

        box.innerHTML = lokasiLabel + ': <span style="text-decoration: line-through; color: #94a3b8;">' + curVal + '</span> &rarr; '
            + '<b style="color: #4f46e5; font-size: 14px;">' + newVal + '</b> '
            + '<span style="color: ' + diffColor + '; font-weight: 800; font-size: 11px; margin-left: 6px;">' + diffText + '</span>';
    }
};

window.submitAdjustStok = function() {
    var prodId = document.getElementById('adjustProdId').value;
    var prods = (window.catalogProducts && window.catalogProducts.length) ? window.catalogProducts : (catalogProducts || []);
    var item = prods.find(function(p) { return p.produkId === prodId; });
    if (!item) {
        if (window.showToast) window.showToast('Produk tidak ditemukan.', 'error');
        return;
    }

    var lokasi = document.getElementById('adjustLokasi').value;
    var aksi = document.getElementById('adjustAksi').value;
    var qty = Math.max(0, parseFloat(document.getElementById('adjustQty').value) || 0);
    var alasan = document.getElementById('adjustAlasan').value;
    var catatan = (document.getElementById('adjustCatatan').value || '').trim();

    var curEtalase = Number(item.stokEtalase || 0);
    var curGudang = Number(item.stokGudang || 0);

    var newEtalase = curEtalase;
    var newGudang = curGudang;

    if (lokasi === 'etalase') {
        if (aksi === 'kurang') newEtalase = Math.max(0, curEtalase - qty);
        else if (aksi === 'tambah') newEtalase = curEtalase + qty;
        else if (aksi === 'set') newEtalase = qty;
    } else {
        if (aksi === 'kurang') newGudang = Math.max(0, curGudang - qty);
        else if (aksi === 'tambah') newGudang = curGudang + qty;
        else if (aksi === 'set') newGudang = qty;
    }

    item.stokEtalase = newEtalase;
    item.stokGudang = newGudang;

    try {
        localStorage.setItem('bos_kroco_catalog_products', JSON.stringify(prods));
    } catch(e) {}

    var payload = {
        produkId: prodId,
        namaProduk: item.namaProduk,
        satuan: item.satuan,
        hargaBeliHPP: item.hargaBeliHPP,
        hargaJual: item.hargaJual,
        minQtyGrosir: item.minQtyGrosir,
        hargaGrosir: item.hargaGrosir,
        stokEtalase: newEtalase,
        stokGudang: newGudang,
        status: item.status
    };

    if (window.runBackend) {
        window.runBackend('apiUpdateProduct', [payload, window.currentUser], function(res) {
            console.log('[Stok Adjust] Response server:', res);
        });
    }

    if (typeof window.addMockAuditLog === 'function') {
        var logDetail = 'Koreksi Stok ' + (lokasi === 'etalase' ? 'Etalase' : 'Gudang') + ' ' + item.namaProduk + ': ' 
            + (lokasi === 'etalase' ? curEtalase + ' -> ' + newEtalase : curGudang + ' -> ' + newGudang) 
            + ' [Alasan: ' + alasan + (catatan ? ' - ' + catatan : '') + ']';
        window.addMockAuditLog('MasterProduk', 'ADJUST_STOK', prodId, '-', logDetail, window.currentUser);
    }

    window.closeModalAdjustStok();
    if (typeof window.filterMasterProdukRealtime === 'function') window.filterMasterProdukRealtime();
    if (typeof window.populateProductDropdowns === 'function') window.populateProductDropdowns();
    if (typeof window.loadDashboardData === 'function') window.loadDashboardData();

    if (window.showToast) {
        window.showToast('Stok ' + item.namaProduk + ' berhasil disesuaikan!', 'success');
    }
};

window.resetSemuaStokKeNol = function() {
    var prods = (window.catalogProducts && window.catalogProducts.length) ? window.catalogProducts : (catalogProducts || []);
    if (!prods || prods.length === 0) {
        if (window.showToast) window.showToast('Tidak ada produk untuk direset.', 'info');
        return;
    }

    if (!confirm('Apakah Anda yakin ingin mengatur stok etalase dan gudang SEMUA produk menjadi 0? Tindakan ini dapat disesuaikan kembali nanti.')) {
        return;
    }

    prods.forEach(function(p) {
        p.stokEtalase = 0;
        p.stokGudang = 0;
    });

    try {
        localStorage.setItem('bos_kroco_catalog_products', JSON.stringify(prods));
    } catch(e) {}

    if (window.runBackend) {
        window.runBackend('apiResetAllStockToZero', [window.currentUser], function() {});
    }

    if (typeof window.filterMasterProdukRealtime === 'function') window.filterMasterProdukRealtime();
    if (typeof window.populateProductDropdowns === 'function') window.populateProductDropdowns();
    if (typeof window.loadDashboardData === 'function') window.loadDashboardData();

    if (window.showToast) {
        window.showToast('Semua stok etalase & gudang produk telah diatur menjadi 0!', 'success');
    }
};
