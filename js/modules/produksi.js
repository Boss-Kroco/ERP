/**
 * ============================================================================
 * MAFAZA GROUP ERP - MODUL HPP PRODUK
 * File: js/modules/produksi.js (repurposed for HPP)
 * ============================================================================
 */

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

window.hppRincian = {};
try {
    var storedRincian = localStorage.getItem('bos_kroco_hpp_rincian');
    if (storedRincian) window.hppRincian = JSON.parse(storedRincian);
} catch (e) {}

window.hppRiwayatData = [];
try {
    var storedRiwayat = localStorage.getItem('bos_kroco_hpp_riwayat');
    if (storedRiwayat) window.hppRiwayatData = JSON.parse(storedRiwayat);
} catch (e) {}
if (!window.hppRiwayatData || !window.hppRiwayatData.length) {
    window.hppRiwayatData = [
        { tanggal: '2026-09-01', produk: 'Kue Kacang Original', hppLama: 180, hppBaru: 192.46, penyebab: 'Kenaikan harga kacang' }
    ];
}

window.tempBahanBaku = [
    { nama: 'Kacang Tanah', qty: 1, harga: 25000 }
];

window.switchHppTab = function(tabId) {
    var tabs = ['daftar', 'tambah', 'riwayat', 'pengaturan'];
    tabs.forEach(function(t) {
        document.getElementById('hpp-tab-' + t).style.display = (t === tabId) ? 'block' : 'none';
        var btnId = 'btnTabHpp' + t.charAt(0).toUpperCase() + t.slice(1);
        var btn = document.getElementById(btnId);
        if(btn) {
            if(t === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });

    if(tabId === 'daftar') window.renderDaftarHPP();
    if(tabId === 'riwayat') window.renderRiwayatHPP();
    if(tabId === 'tambah') window.initTambahHpp();
};

window.filterDaftarHppRealtime = function() {
    var tbody = document.getElementById('tblDaftarHPP');
    if (!tbody) return;

    var filterCatEl = document.getElementById('filterKategoriDaftarHpp');
    if (filterCatEl && filterCatEl.options.length <= 1 && typeof window.getCustomCategories === 'function') {
        var cats = window.getCustomCategories();
        var curValHpp = filterCatEl.value;
        filterCatEl.innerHTML = '<option value="">Semua Kategori</option>' + cats.map(function(c) {
            return '<option value="' + escapeHtml(c) + '">' + escapeHtml(c) + '</option>';
        }).join('');
        if (curValHpp) filterCatEl.value = curValHpp;
    }

    var q = (document.getElementById('searchDaftarHpp') ? document.getElementById('searchDaftarHpp').value : '').toLowerCase().trim();
    var cat = (document.getElementById('filterKategoriDaftarHpp') ? document.getElementById('filterKategoriDaftarHpp').value : '').trim();
    var sort = (document.getElementById('sortDaftarHpp') ? document.getElementById('sortDaftarHpp').value : 'az') || 'az';

    var source = (window.catalogProducts && window.catalogProducts.length) 
        ? window.catalogProducts 
        : (typeof catalogProducts !== 'undefined' && catalogProducts && catalogProducts.length ? catalogProducts : []);
    if (!source || source.length === 0) {
        try {
            var rawSaved = localStorage.getItem('bos_kroco_catalog_products');
            if (rawSaved) {
                var parsedSaved = JSON.parse(rawSaved);
                if (Array.isArray(parsedSaved) && parsedSaved.length) {
                    source = parsedSaved;
                    window.catalogProducts = parsedSaved;
                }
            }
        } catch(e) {}
    }

    tbody.innerHTML = '';
    if (!source || source.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 36px 16px; color: #94a3b8; font-size: 13px;">' +
            '<div style="font-weight: 700; color: #64748b; margin-bottom: 4px;">Belum Ada Data HPP Produk</div>' +
            'Klik tombol <b>+ Tambah Jenis Makanan</b> di atas untuk mulai mencatat HPP.' +
            '</td></tr>';
        return;
    }

    var filtered = source.filter(function(item) {
        if (!item) return false;
        var pNama = (item.namaProduk || '').toLowerCase();
        var pId = (item.produkId || '').toLowerCase();
        var pSatuan = (item.satuan || '').toLowerCase();
        var pKat = (item.kategori || '').toLowerCase();
        var matchQ = !q || pNama.includes(q) || pId.includes(q) || pSatuan.includes(q) || pKat.includes(q);
        var matchCat = !cat || item.kategori === cat;
        return matchQ && matchCat;
    });

    if (sort === 'az') {
        filtered.sort(function(a, b) { return (a.namaProduk || '').trim().localeCompare((b.namaProduk || '').trim(), 'id', { sensitivity: 'base' }); });
    } else if (sort === 'za') {
        filtered.sort(function(a, b) { return (b.namaProduk || '').trim().localeCompare((a.namaProduk || '').trim(), 'id', { sensitivity: 'base' }); });
    } else if (sort === 'hpp_asc') {
        filtered.sort(function(a, b) {
            return (parseFloat(a.hargaBeliHPP) || 0) - (parseFloat(b.hargaBeliHPP) || 0);
        });
    } else if (sort === 'hpp_desc') {
        filtered.sort(function(a, b) {
            return (parseFloat(b.hargaBeliHPP) || 0) - (parseFloat(a.hargaBeliHPP) || 0);
        });
    } else if (sort === 'laba_desc') {
        filtered.sort(function(a, b) {
            var labaA = (parseFloat(a.hargaJual) || 0) - (parseFloat(a.hargaBeliHPP) || 0);
            var labaB = (parseFloat(b.hargaJual) || 0) - (parseFloat(b.hargaBeliHPP) || 0);
            return labaB - labaA;
        });
    } else if (sort === 'margin_desc') {
        filtered.sort(function(a, b) {
            var hjA = parseFloat(a.hargaJual) || 0;
            var hppA = parseFloat(a.hargaBeliHPP) || 0;
            var marginA = hjA > 0 ? ((hjA - hppA) / hjA) : -1;

            var hjB = parseFloat(b.hargaJual) || 0;
            var hppB = parseFloat(b.hargaBeliHPP) || 0;
            var marginB = hjB > 0 ? ((hjB - hppB) / hjB) : -1;

            return marginB - marginA;
        });
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 36px 16px; color: #94a3b8; font-size: 13px;">' +
            '<div style="font-weight: 700; color: #64748b; margin-bottom: 4px;">Produk HPP Tidak Ditemukan</div>' +
            'Tidak ada produk HPP yang sesuai dengan pencarian atau filter kategori saat ini.' +
            '</td></tr>';
        return;
    }

    filtered.forEach(function(item) {
        var tr = document.createElement('tr');
        var hpp = item.hargaBeliHPP || 0;
        var jual = item.hargaJual || 0;
        var laba = jual - hpp;
        var margin = jual > 0 ? (laba / jual) * 100 : 0;
        var statusLabel = item.status || 'Aktif';
        var statusBg = statusLabel === 'Aktif' ? '#dcfce7' : '#fee2e2';
        var statusColor = statusLabel === 'Aktif' ? '#166534' : '#991b1b';

        tr.innerHTML = '<td><b>' + escapeHtml(item.namaProduk) + '</b></td>'
            + '<td>' + escapeHtml(item.produkId) + '</td>'
            + '<td>' + escapeHtml(item.satuan || 'Pcs') + '</td>'
            + '<td style="text-align: right; font-weight: bold; color: var(--text-dark);">' + window.formatAppCurrency(hpp) + '</td>'
            + '<td style="text-align: right;">' + window.formatAppCurrency(jual) + '</td>'
            + '<td style="text-align: right; color: var(--emerald); font-weight: bold;">' + window.formatAppCurrency(laba) + '</td>'
            + '<td style="text-align: right; color: var(--violet-main); font-weight: bold;">' + margin.toFixed(2) + '%</td>'
            + '<td><span style="background: ' + statusBg + '; color: ' + statusColor + '; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">' + escapeHtml(statusLabel) + '</span></td>'
            + '<td style="text-align: center; white-space: nowrap;">'
            + '<button class="btn-pill-action btn-pill-secondary" style="padding: 4px 8px; font-size: 11px; margin-right: 4px;" onclick="window.lihatDetailHpp(\'' + escapeHtml(item.produkId) + '\')">Lihat Detail</button>'
            + '<button class="btn-pill-action" style="padding: 4px 8px; font-size: 11px; background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; border-radius: 8px; font-weight: 700;" onclick="window.hapusProduk(\'' + escapeHtml(item.produkId) + '\', \'' + escapeHtml(item.namaProduk) + '\')" title="Hapus Produk">Hapus</button>'
            + '</td>';
        tbody.appendChild(tr);
    });
};

window.renderDaftarHPP = function() {
    window.filterDaftarHppRealtime();
};

window.lihatDetailHpp = function(id) {
    var item = (window.catalogProducts || []).find(function(i) { return i.produkId === id; });
    if(!item) return;

    var hpp = item.hargaBeliHPP || 0;
    var jual = item.hargaJual || 0;
    var laba = jual - hpp;
    var margin = jual > 0 ? (laba / jual) * 100 : 0;

    document.getElementById('detHppNamaProduk').textContent = item.namaProduk;
    document.getElementById('detHppNilai').textContent = window.formatAppCurrency(hpp);
    document.getElementById('detHppJual').textContent = window.formatAppCurrency(jual);
    document.getElementById('detHppLaba').textContent = window.formatAppCurrency(laba);
    document.getElementById('detHppMargin').textContent = margin.toFixed(2) + '%';

    window.hppRincian = window.hppRincian || {};
    var r = window.hppRincian[id] || { bahan: hpp };
    document.getElementById('detRincianBahan').textContent = window.formatAppCurrency(r.bahan || 0);
    document.getElementById('detRincianTk').textContent = window.formatAppCurrency(r.tk || 0);
    document.getElementById('detRincianGas').textContent = window.formatAppCurrency(r.gas || 0);
    document.getElementById('detRincianKemasan').textContent = window.formatAppCurrency(r.kemasan || 0);
    document.getElementById('detRincianOverhead').textContent = window.formatAppCurrency ? window.formatAppCurrency((r.overhead || 0) + (r.listrik || 0) + (r.lainnya || 0)) : ('Rp ' + ((r.overhead || 0) + (r.listrik || 0) + (r.lainnya || 0)));

    document.getElementById('modalDetailHpp').style.display = 'flex';
};

window.renderRiwayatHPP = function() {
    var tbody = document.getElementById('tblRiwayatHPP');
    if(!tbody) return;
    tbody.innerHTML = '';

    window.hppRiwayatData.forEach(function(item) {
        var tr = document.createElement('tr');
        var hppLama = Number(item.hppLama || 0);
        var hppBaru = Number(item.hppBaru || 0);
        var selisih = hppBaru - hppLama;
        var selisihWarna = selisih > 0 ? '#ef4444' : (selisih < 0 ? '#10b981' : 'var(--text-main)');
        var selisihTanda = selisih > 0 ? '+ ' : (selisih < 0 ? '- ' : '');
        
        tr.innerHTML = `
            <td>${item.tanggal}</td>
            <td>${item.produk}</td>
            <td style="text-align: right;">${window.formatAppCurrency(hppLama)}</td>
            <td style="text-align: right; font-weight: bold;">${window.formatAppCurrency(hppBaru)}</td>
            <td style="text-align: right; color: ${selisihWarna}; font-weight: bold;">${selisihTanda}${window.formatAppCurrency ? window.formatAppCurrency(Math.abs(selisih)) : ('Rp ' + Math.abs(selisih))}</td>
            <td>${item.penyebab}</td>
        `;
        tbody.appendChild(tr);
    });
};

window.initTambahHpp = function(isProductChange) {
    var sel = document.getElementById('hppSelProduk');
    var currentProds = (window.catalogProducts && window.catalogProducts.length) ? window.catalogProducts : (window.catalogProducts || []);
    if(sel) {
        var curVal = sel.value;
        if(sel.options.length <= 1 || sel.options.length !== (currentProds.length + 1)) {
            var optHtml = '<option value="">-- Pilih Produk --</option>';
            currentProds.forEach(function(p) {
                optHtml += '<option value="' + p.produkId + '">' + (p.namaProduk || '') + ' (' + p.produkId + ')</option>';
            });
            sel.innerHTML = optHtml;
            if(curVal) sel.value = curVal;
        }
    }
    
    var resetFormKeKosong = function() {
        window.tempBahanBaku = [{ nama: '', qty: 1, harga: 0 }];
        ['hppBiayaTk', 'hppBiayaGas', 'hppBiayaListrik', 'hppBiayaKemasan', 'hppBiayaOverhead', 'hppBiayaLain'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.value = 0;
        });
        var elJml = document.getElementById('hppJmlProduksi');
        if (elJml) elJml.value = 1;
        var elMinG = document.getElementById('hppMinGrosir');
        if (elMinG) elMinG.value = '';
        var elHgG = document.getElementById('hppHargaGrosir');
        if (elHgG) elHgG.value = '';
    };

    // Auto-fill Harga Jual and Restore saved recipe if selected
    if (sel && sel.value) {
        var prdId = sel.value;
        var prd = (window.catalogProducts || []).find(function(p) { return p.produkId === prdId; });
        var cfg = window.getAppCurrencyConfig ? window.getAppCurrencyConfig() : { exchangeRate: 1 };
        
        var elHj = document.getElementById('hppHargaJual');
        if (isProductChange && elHj) {
            delete elHj.dataset.modified;
        }

        if (prd) {
            if (elHj && !elHj.dataset.modified) {
                var hjCurr = window.toAppCurrency ? window.toAppCurrency(prd.hargaJual || 0) : (prd.hargaJual || 0);
                elHj.value = parseFloat(hjCurr.toFixed(2));
            }
            var elHmg = document.getElementById('hppMinGrosir');
            if (elHmg) elHmg.value = prd.minQtyGrosir || '';
            var elHhg = document.getElementById('hppHargaGrosir');
            if (elHhg) {
                var hgCurr = prd.hargaGrosir ? (window.toAppCurrency ? window.toAppCurrency(prd.hargaGrosir) : prd.hargaGrosir) : '';
                elHhg.value = hgCurr ? parseFloat(Number(hgCurr).toFixed(2)) : '';
            }
        }

        window.hppRincian = window.hppRincian || {};
        var savedState = window.hppRincian[prdId];
        
        if (savedState && savedState.bahanList && savedState.bahanList.length) {
            // Produk sudah memiliki resep tersimpan: muat bahan baku dan biaya operasionalnya
            window.tempBahanBaku = JSON.parse(JSON.stringify(savedState.bahanList));
            // Konversi nilai tersimpan ke mata uang aktif saat ini jika berbeda
            var savedRate = savedState.exchangeRate || 1;
            var currentRate = cfg.exchangeRate || 1;
            var rateMultiplier = savedRate / currentRate;
            
            if (Math.abs(rateMultiplier - 1) > 0.001) {
                window.tempBahanBaku.forEach(function(b) {
                    b.harga = parseFloat((Number(b.harga || 0) * rateMultiplier).toFixed(2));
                });
            }

            if (savedState.rawBiaya) {
                var rb = savedState.rawBiaya;
                ['tk', 'gas', 'listrik', 'kemasan', 'overhead', 'lainnya'].forEach(function(k) {
                    var inputId = 'hppBiaya' + k.charAt(0).toUpperCase() + k.slice(1);
                    var el = document.getElementById(inputId);
                    if (el) {
                        var rawVal = Number(rb[k] || 0);
                        var convertedVal = Math.abs(rateMultiplier - 1) > 0.001 ? (rawVal * rateMultiplier) : rawVal;
                        el.value = convertedVal ? parseFloat(convertedVal.toFixed(2)) : 0;
                    }
                });
                if (document.getElementById('hppJmlProduksi')) {
                    document.getElementById('hppJmlProduksi').value = savedState.rawBiaya.jmlProd || 1;
                }
            }
        } else {
            // Produk baru atau produk yang belum memiliki resep tersimpan: otomatis kosongkan tabel bahan baku & biaya
            resetFormKeKosong();
        }
    } else {
        // Belum ada produk yang dipilih: kosongkan form
        resetFormKeKosong();
        var elHjEmpty = document.getElementById('hppHargaJual');
        if (elHjEmpty) elHjEmpty.value = 0;
    }

    if (typeof window.updateAppCurrencyUI === 'function') window.updateAppCurrencyUI();
    window.renderHppBahanBaku();
    if(typeof window.kalkulasiTotalHpp === 'function') window.kalkulasiTotalHpp();
};

window.syncHppBahanFromDOM = function() {
    var tbody = document.getElementById('bodyHppBahanBaku');
    if(!tbody) return window.tempBahanBaku || [];
    var rows = tbody.querySelectorAll('tr');
    if(!rows.length) return window.tempBahanBaku || [];

    var list = [];
    rows.forEach(function(r) {
        var nEl = r.querySelector('.input-hpp-nama');
        var qEl = r.querySelector('.input-hpp-qty');
        var hEl = r.querySelector('.input-hpp-harga');
        list.push({
            nama: nEl ? nEl.value.trim() : '',
            qty: qEl ? (parseFloat(qEl.value) || 0) : 1,
            harga: hEl ? (parseFloat(hEl.value) || 0) : 0
        });
    });
    window.tempBahanBaku = list;
    return list;
};

window.onHppBahanInput = function(idx) {
    var tbody = document.getElementById('bodyHppBahanBaku');
    if (!tbody) return;
    var rows = tbody.querySelectorAll('tr');
    var targetRow = rows[idx];
    if (!targetRow) return;

    var namaEl = targetRow.querySelector('.input-hpp-nama');
    var qtyEl = targetRow.querySelector('.input-hpp-qty');
    var hargaEl = targetRow.querySelector('.input-hpp-harga');
    var subEl = targetRow.querySelector('.cell-hpp-subtotal');

    var nama = namaEl ? namaEl.value : '';
    var qty = qtyEl ? (parseFloat(qtyEl.value) || 0) : 0;
    var harga = hargaEl ? (parseFloat(hargaEl.value) || 0) : 0;
    var sub = qty * harga;

    if (!window.tempBahanBaku[idx]) window.tempBahanBaku[idx] = {};
    window.tempBahanBaku[idx].nama = nama;
    window.tempBahanBaku[idx].qty = qtyEl && qtyEl.value !== '' ? qtyEl.value : 0;
    window.tempBahanBaku[idx].harga = hargaEl && hargaEl.value !== '' ? hargaEl.value : 0;

    if (subEl) {
        subEl.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(sub) : window.formatAppCurrency(sub);
    }

    // Hitung total dari seluruh baris aktif di DOM
    var totalBahan = 0;
    rows.forEach(function(r) {
        var q = parseFloat((r.querySelector('.input-hpp-qty') || {}).value) || 0;
        var h = parseFloat((r.querySelector('.input-hpp-harga') || {}).value) || 0;
        totalBahan += (q * h);
    });

    var lblTotalBahan = document.getElementById('lblHppTotalBahan');
    if (lblTotalBahan) {
        lblTotalBahan.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(totalBahan) : window.formatAppCurrency(totalBahan);
        lblTotalBahan.dataset.val = totalBahan;
    }

    window.kalkulasiTotalHpp();
};

window.renderHppBahanBaku = function() {
    var tbody = document.getElementById('bodyHppBahanBaku');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    if (!window.tempBahanBaku || !window.tempBahanBaku.length) {
        window.tempBahanBaku = [{ nama: 'Bahan Baku 1', qty: 1, harga: 0 }];
    }

    var totalBahan = 0;
    window.tempBahanBaku.forEach(function(item, idx) {
        var qVal = item.qty !== undefined && item.qty !== '' ? item.qty : 1;
        var hVal = item.harga !== undefined && item.harga !== '' ? item.harga : 0;
        var sub = (parseFloat(qVal) || 0) * (parseFloat(hVal) || 0);
        totalBahan += sub;
        var safeNama = (item.nama || '').replace(/"/g, '&quot;');
        
        var tr = document.createElement('tr');
        tr.dataset.idx = idx;
        tr.innerHTML = `
            <td><input type="text" class="hpp-clean-input input-hpp-nama" style="width: 100%; min-width: 120px;" placeholder="Nama bahan..." value="${safeNama}" oninput="window.onHppBahanInput(${idx})"></td>
            <td><input type="number" step="any" min="0" class="hpp-clean-input input-hpp-qty" style="text-align: center; width: 90px; padding: 4px;" value="${qVal}" oninput="window.onHppBahanInput(${idx})"></td>
            <td><input type="number" step="any" min="0" class="hpp-clean-input input-hpp-harga" style="text-align: right; width: 100px; padding: 4px;" value="${hVal}" oninput="window.onHppBahanInput(${idx})"></td>
            <td class="cell-hpp-subtotal" style="font-weight: 700; text-align: right; color: var(--text-dark);">${window.formatAppCurrencyValue ? window.formatAppCurrencyValue(sub) : window.formatAppCurrency(sub)}</td>
            <td style="text-align: center;">
                <button type="button" style="border: none; background: #fff1f2; color: #e11d48; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center;" onclick="window.hapusHppBahan(${idx})" title="Hapus bahan">
                    <svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    var lblTotalBahan = document.getElementById('lblHppTotalBahan');
    if (lblTotalBahan) {
        lblTotalBahan.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(totalBahan) : window.formatAppCurrency(totalBahan);
        lblTotalBahan.dataset.val = totalBahan;
    }
    window.kalkulasiTotalHpp();
};

window.updateHppBahan = function(idx, field, value) {
    if(field === 'qty' || field === 'harga') value = parseFloat(value) || 0;
    if (!window.tempBahanBaku[idx]) window.tempBahanBaku[idx] = {};
    window.tempBahanBaku[idx][field] = value;
    window.renderHppBahanBaku();
};

window.addHppBahanBaku = function() {
    window.syncHppBahanFromDOM();
    if (!window.tempBahanBaku) window.tempBahanBaku = [];
    window.tempBahanBaku.push({ nama: '', qty: 1, harga: 0 });
    
    // Simpan posisi scroll vertikal saat ini agar halaman tidak melompat ke bawah
    var currentScrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    
    window.renderHppBahanBaku();
    
    // Kembalikan posisi scroll tepat seperti semula
    window.scrollTo(0, currentScrollY);
    
    setTimeout(function() {
        var tbody = document.getElementById('bodyHppBahanBaku');
        if (tbody) {
            var inputs = tbody.querySelectorAll('.input-hpp-nama');
            if (inputs.length) {
                try {
                    // preventScroll: true mencegah browser melakukan auto-scroll saat input baru difokuskan
                    inputs[inputs.length - 1].focus({ preventScroll: true });
                } catch (e) {
                    inputs[inputs.length - 1].focus();
                }
            }
        }
        window.scrollTo(0, currentScrollY);
    }, 30);
};

window.hapusHppBahan = function(idx) {
    window.syncHppBahanFromDOM();
    if (window.tempBahanBaku && window.tempBahanBaku.length > idx) {
        window.tempBahanBaku.splice(idx, 1);
    }
    if (!window.tempBahanBaku.length) {
        window.tempBahanBaku = [{ nama: '', qty: 1, harga: 0 }];
    }
    window.renderHppBahanBaku();
};

window.kalkulasiTotalHpp = function() {
    var lblTotalBahan = document.getElementById('lblHppTotalBahan');
    var totalBahan = 0;
    if (lblTotalBahan && lblTotalBahan.dataset.val !== undefined && !isNaN(parseFloat(lblTotalBahan.dataset.val))) {
        totalBahan = parseFloat(lblTotalBahan.dataset.val);
    } else {
        (window.tempBahanBaku || []).forEach(function(b) {
            totalBahan += (parseFloat(b.qty) || 0) * (parseFloat(b.harga) || 0);
        });
    }
    
    var bTk = parseFloat((document.getElementById('hppBiayaTk') || {}).value) || 0;
    var bGas = parseFloat((document.getElementById('hppBiayaGas') || {}).value) || 0;
    var bListrik = parseFloat((document.getElementById('hppBiayaListrik') || {}).value) || 0;
    var bKemasan = parseFloat((document.getElementById('hppBiayaKemasan') || {}).value) || 0;
    var bOverhead = parseFloat((document.getElementById('hppBiayaOverhead') || {}).value) || 0;
    var bLain = parseFloat((document.getElementById('hppBiayaLain') || {}).value) || 0;
    
    var totalProduksi = bTk + bGas + bListrik + bKemasan + bOverhead + bLain;
    var lblTotalProd = document.getElementById('lblHppTotalProduksi');
    if (lblTotalProd) lblTotalProd.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(totalProduksi) : window.formatAppCurrency(totalProduksi);
    
    var grandTotal = totalBahan + totalProduksi;
    var lblGrandTotal = document.getElementById('lblHppGrandTotal');
    if (lblGrandTotal) lblGrandTotal.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(grandTotal) : window.formatAppCurrency(grandTotal);
    
    var jmlProd = parseFloat((document.getElementById('hppJmlProduksi') || {}).value) || 1;
    if (jmlProd <= 0 || isNaN(jmlProd)) jmlProd = 1;

    var hppItem = grandTotal / jmlProd;
    if (isNaN(hppItem) || !isFinite(hppItem)) hppItem = 0;
    
    var lblPerItem = document.getElementById('lblHppPerItem');
    if (lblPerItem) lblPerItem.textContent = window.formatAppCurrencyValue ? window.formatAppCurrencyValue(hppItem) : window.formatAppCurrency(hppItem);
    
    window.tempHppResult = {
        totalBahan: totalBahan,
        bTk: bTk, bGas: bGas, bListrik: bListrik, bKemasan: bKemasan, bOverhead: bOverhead, bLain: bLain,
        grandTotal: grandTotal,
        jmlProd: jmlProd,
        hppItem: hppItem
    };
};

window.simpanHppBaru = function() {
    var sel = document.getElementById('hppSelProduk');
    if (!sel || !sel.value) {
        if(window.showToast) window.showToast('Pilih produk terlebih dahulu!', 'error');
        if (sel) sel.focus();
        return;
    }
    var selId = sel.value;
    var prd = (window.catalogProducts || []).find(function(p) { return p.produkId === selId; });
    
    if(!prd) {
        if(window.showToast) window.showToast('Produk yang dipilih tidak ditemukan!', 'error');
        return;
    }
    
    // Pastikan seluruh input di tabel disinkronkan dan dikalkulasi ulang
    window.syncHppBahanFromDOM();
    window.kalkulasiTotalHpp();

    var cfg = window.getAppCurrencyConfig ? window.getAppCurrencyConfig() : { exchangeRate: 1 };
    var res = window.tempHppResult;
    
    if (!res || res.hppItem === undefined || isNaN(res.hppItem)) {
        if(window.showToast) window.showToast('Silakan lengkapi tabel bahan baku dan biaya terlebih dahulu!', 'error');
        return;
    }
    
    var hargaJualInput = document.getElementById('hppHargaJual');
    var hargaJualCurr = hargaJualInput ? (parseFloat(hargaJualInput.value) || 0) : 0;
    if (hargaJualCurr <= 0 && prd.hargaJual) {
        hargaJualCurr = window.toAppCurrency ? window.toAppCurrency(prd.hargaJual) : prd.hargaJual;
    }

    var minGrosirInput = document.getElementById('hppMinGrosir');
    var minGrosirValue = (minGrosirInput && minGrosirInput.value !== '') ? parseFloat(minGrosirInput.value) : (prd.minQtyGrosir || 0);
    
    var hargaGrosirInput = document.getElementById('hppHargaGrosir');
    var hargaGrosirCurr = (hargaGrosirInput && hargaGrosirInput.value !== '') ? parseFloat(hargaGrosirInput.value) : (prd.hargaGrosir || 0);

    // Nilai dalam base IDR untuk disimpan ke master database
    var hppItemBaseIdr = Math.round(window.fromAppCurrency ? window.fromAppCurrency(res.hppItem) : res.hppItem);
    var hargaJualBaseIdr = Math.round(window.fromAppCurrency ? window.fromAppCurrency(hargaJualCurr) : hargaJualCurr);
    var hargaGrosirBaseIdr = Math.round(window.fromAppCurrency ? window.fromAppCurrency(hargaGrosirCurr) : hargaGrosirCurr);

    var jmlProdSafe = res.jmlProd > 0 ? res.jmlProd : 1;

    // Save recipe details in memory and localStorage (dengan exchangeRate untuk konversi antar kurs)
    window.hppRincian = window.hppRincian || {};
    window.hppRincian[selId] = {
        exchangeRate: cfg.exchangeRate || 1,
        bahan: res.totalBahan / jmlProdSafe,
        tk: res.bTk / jmlProdSafe,
        gas: res.bGas / jmlProdSafe,
        listrik: res.bListrik / jmlProdSafe,
        kemasan: res.bKemasan / jmlProdSafe,
        overhead: res.bOverhead / jmlProdSafe,
        lainnya: res.bLain / jmlProdSafe,
        bahanList: JSON.parse(JSON.stringify(window.tempBahanBaku)),
        rawBiaya: {
            tk: res.bTk,
            gas: res.bGas,
            listrik: res.bListrik,
            kemasan: res.bKemasan,
            overhead: res.bOverhead,
            lainnya: res.bLain,
            jmlProd: jmlProdSafe
        }
    };
    try {
        localStorage.setItem('bos_kroco_hpp_rincian', JSON.stringify(window.hppRincian));
    } catch(e) {}
    
    var payload = {
        produkId: prd.produkId,
        namaProduk: prd.namaProduk,
        satuan: prd.satuan || 'Pcs',
        hargaBeliHPP: hppItemBaseIdr || 0,
        hargaJual: hargaJualBaseIdr || 0,
        minQtyGrosir: minGrosirValue,
        hargaGrosir: hargaGrosirBaseIdr,
        status: prd.status || 'Aktif'
    };

    if (window.showToast) window.showToast('Menyimpan HPP produk ke database...', 'info');

    if (window.runBackend) {
        window.runBackend('apiUpdateProduct', [payload, window.currentUser], function(apiRes) {
            if (!apiRes || apiRes.success === false) {
                var errTxt = (apiRes && apiRes.message) ? apiRes.message : 'Gagal memperbarui produk di database';
                if(window.showToast) window.showToast(errTxt, 'error');
                return;
            }

            // Update local memory
            var oldHpp = prd.hargaBeliHPP || 0;
            prd.hargaBeliHPP = hppItemBaseIdr || 0;
            prd.hargaJual = hargaJualBaseIdr || 0;
            prd.minQtyGrosir = minGrosirValue;
            prd.hargaGrosir = hargaGrosirBaseIdr;

            if (window.catalogProducts) {
                var cPrd = window.catalogProducts.find(function(p) { return p.produkId === selId; });
                if (cPrd) {
                    cPrd.hargaBeliHPP = prd.hargaBeliHPP;
                    cPrd.hargaJual = prd.hargaJual;
                    cPrd.minQtyGrosir = prd.minQtyGrosir;
                    cPrd.hargaGrosir = prd.hargaGrosir;
                }
            }

            // Also keep mock catalogProducts synced in localStorage
            try {
                localStorage.setItem('bos_kroco_catalog_products', JSON.stringify(window.catalogProducts));
            } catch(e) {}

            var today = new Date().toISOString().split('T')[0];
            window.hppRiwayatData = window.hppRiwayatData || [];
            window.hppRiwayatData.unshift({
                tanggal: today,
                produk: prd.namaProduk,
                hppLama: oldHpp,
                hppBaru: hppItemBaseIdr,
                penyebab: 'Kalkulasi ulang via form HPP'
            });
            try {
                localStorage.setItem('bos_kroco_hpp_riwayat', JSON.stringify(window.hppRiwayatData));
            } catch(e) {}

            if(window.populateProductDropdowns) window.populateProductDropdowns();
            if(window.renderMasterProdukTable) window.renderMasterProdukTable();
            if(window.renderDaftarHPP) window.renderDaftarHPP();
            if(window.showToast) window.showToast('HPP dan Harga Jual ' + prd.namaProduk + ' berhasil disimpan!', 'success');
            // Tetap di tab kalkulasi agar pengguna tidak perlu bolak-balik (Item 2)
        // window.switchHppTab('daftar');
        }, function(err) {
            if(window.showToast) window.showToast('Gagal menyimpan HPP: ' + (err.message || 'Error koneksi database'), 'error');
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        if(window.renderDaftarHPP) window.renderDaftarHPP();
    }, 500);
});

window.simpanProdukBaruHpp = function(keepOpen) {
    var namaEl = document.getElementById('newProdNamaHpp') || document.getElementById('newProdNama');
    var skuEl = document.getElementById('newProdSkuHpp') || document.getElementById('newProdSku');
    var satuanEl = document.getElementById('newProdSatuanHpp') || document.getElementById('newProdSatuan');
    var hargaEl = document.getElementById('newProdHargaHpp') || document.getElementById('newProdHarga');

    var nama = namaEl ? namaEl.value.trim() : '';
    var sku = skuEl ? skuEl.value.trim() : '';
    var satuan = satuanEl ? satuanEl.value.trim() : 'Pcs';
    var harga = hargaEl ? (parseFloat(hargaEl.value) || 0) : 0;

    if(!nama) {
        if(window.showToast) window.showToast('Nama produk harus diisi!', 'error');
        return;
    }

    if(!satuan) satuan = 'Pcs';

    var payload = {
        namaProduk: nama,
        satuan: satuan,
        hargaBeliHPP: 0,
        hargaJual: harga
    };

    if (window.runBackend) {
        window.showToast('Menyimpan produk ke master...', 'info');
        window.runBackend('apiSaveProduct', [payload, window.currentUser], function (res) {
            if (!res.success) {
                if(window.showToast) window.showToast(res.message || 'Gagal menyimpan produk.', 'error');
                return;
            }
            
            var newProdItem = {
                produkId: res.produkId,
                namaProduk: payload.namaProduk,
                satuan: payload.satuan,
                hargaBeliHPP: payload.hargaBeliHPP,
                hargaJual: payload.hargaJual,
                stokEtalase: 0,
                stokGudang: 0,
                status: 'Aktif'
            };

            if (!window.catalogProducts) window.catalogProducts = [];
            window.catalogProducts.unshift(newProdItem);
            
            if(window.renderMasterProdukTable) window.renderMasterProdukTable();
            if(window.populateProductDropdowns) window.populateProductDropdowns();
            
            // Set newly created product in dropdown and init
            var sel = document.getElementById('hppSelProduk');
            if(sel) {
                if(typeof window.initTambahHpp === 'function') window.initTambahHpp();
                sel.value = res.produkId;
                if(typeof window.initTambahHpp === 'function') window.initTambahHpp(true);
            }
            
            window.renderDaftarHPP();
            
            // Reset Form
            if(namaEl) namaEl.value = '';
            if(skuEl) skuEl.value = '';
            if(hargaEl) hargaEl.value = '';
            
            var modal = document.getElementById('modalTambahJenisHpp');
            if (keepOpen) {
                // Tetap di form pendataan agar tidak perlu klik tambah jenis makanan lagi
                if (modal) modal.style.display = 'flex';
                if (namaEl) {
                    namaEl.value = '';
                    namaEl.focus();
                }
                if (skuEl) skuEl.value = '';
                if (hargaEl) hargaEl.value = '';
                if (window.showToast) window.showToast('"' + payload.namaProduk + '" berhasil disimpan! Silakan input makanan berikutnya...', 'success');
            } else {
                if (modal) modal.style.display = 'none';
                if (window.showToast) window.showToast('Produk Makanan Baru "' + payload.namaProduk + '" berhasil ditambahkan!', 'success');
            }
        }, function(err) {
            if(window.showToast) window.showToast('Gagal menyimpan produk: ' + (err.message || 'Error koneksi'), 'error');
        });
    }
};


// Fitur Bagikan Simulasi HPP (Foto & Item 5: Hanya Melihat & Dapat Mengedit)
window.openShareHppModal = function() {
    var modal = document.getElementById('modalShareHpp');
    if (modal) modal.classList.add('active');
};

window.closeShareHppModal = function() {
    var modal = document.getElementById('modalShareHpp');
    if (modal) modal.classList.remove('active');
};

window.generateAndCopyHppLink = function(mode) {
    var pNama = document.getElementById('hppNamaProduk') ? document.getElementById('hppNamaProduk').value : '';
    var pTarget = document.getElementById('hppTargetPcs') ? document.getElementById('hppTargetPcs').value : '1';
    var pHargaJual = document.getElementById('hppHargaJual') ? document.getElementById('hppHargaJual').value : '0';
    var pTotal = document.getElementById('hppTotalBiayaAll') ? document.getElementById('hppTotalBiayaAll').textContent : '0';

    var simData = {
        nama: pNama,
        target: pTarget,
        hargaJual: pHargaJual,
        totalBiaya: pTotal,
        mode: mode || 'view',
        t: Date.now()
    };

    var encoded = encodeURIComponent(JSON.stringify(simData));
    var shareUrl = window.location.origin + window.location.pathname + '?simulasi_hpp=' + encoded + '&mode=' + (mode || 'view');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(function() {
            if (typeof showToast === 'function') {
                showToast('Tautan Simulasi (' + (mode === 'view' ? 'Hanya Melihat' : 'Dapat Mengedit') + ') berhasil disalin!', 'success');
            }
            window.closeShareHppModal();
        });
    } else {
        window.prompt('Salin tautan simulasi ini:', shareUrl);
        window.closeShareHppModal();
    }
};
