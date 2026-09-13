/**
 * ============================================================================
 * BOS KROCO ERP - MASTER PRODUK MODULE
 * File: js/modules/produk.js
 * ============================================================================
 */

var catalogProducts = [];
        var selectedOrderIds = [];
        var dueAlertsData = [];

        // Master 10 Synchronized Transactions matching Foto 1
        var orderTransactions = [
            { id: 'TRX-20260905-0001', orderNum: 'Nº674839', customer: 'Kris Payer', phone: '099 758 9092', category: 'Kripik Tempe Premium', price: 30000, date: '05/09/2026', payment: 'Tunai', status: 'delivered' },
            { id: 'TRX-20260905-0002', orderNum: 'Nº674840', customer: 'Toko Oleh-Oleh Barokah', phone: '0812 3456 7890', category: 'Kue Kacang Gurih', price: 285000, date: '05/09/2026', payment: 'Tempo', status: 'await' },
            { id: 'TRX-20260905-0003', orderNum: 'Nº674841', customer: 'Pelanggan Umum', phone: 'Walk-in', category: 'Sambal Bawang Botol', price: 48000, date: '05/09/2026', payment: 'Tunai', status: 'delivered' },
            { id: 'TRX-20260905-0004', orderNum: 'Nº674842', customer: 'Minimarket Sentosa', phone: '0856 7890 1234', category: 'Keripik Singkong Pedas', price: 230000, date: '05/09/2026', payment: 'Tempo', status: 'on way' },
            { id: 'TRX-20260905-0005', orderNum: 'Nº674843', customer: 'Pelanggan Umum', phone: 'Walk-in', category: 'Basreng Daun Jeruk', price: 70000, date: '05/09/2026', payment: 'Tunai', status: 'delivered' },
            { id: 'TRX-20260905-0006', orderNum: 'Nº674844', customer: 'Toko Sentra Kuliner', phone: '0819 8765 4321', category: 'Abon Sapi Gurih', price: 270000, date: '05/09/2026', payment: 'Tempo', status: 'await' },
            { id: 'TRX-20260905-0007', orderNum: 'Nº674845', customer: 'Pelanggan Umum', phone: 'Walk-in', category: 'Keripik Pisang Cokelat', price: 72000, date: '05/09/2026', payment: 'Tunai', status: 'delivered' },
            { id: 'TRX-20260905-0008', orderNum: 'Nº674846', customer: 'Supermarket Mega Rasa', phone: '0821 3456 7891', category: 'Bakpia Basah Isi Hijau', price: 350000, date: '05/09/2026', payment: 'Tunai', status: 'delivered' },
            { id: 'TRX-20260905-0009', orderNum: 'Nº674847', customer: 'Pelanggan Umum', phone: 'Walk-in', category: 'Makaroni Panggang', price: 66000, date: '05/09/2026', payment: 'Tunai', status: 'delivered' },
            { id: 'TRX-20260905-0010', orderNum: 'Nº674848', customer: 'Agen Snack Bu Siti', phone: '0813 9876 1234', category: 'Rengginang Ketan Hitam', price: 210000, date: '05/09/2026', payment: 'Tempo', status: 'on way' }
        ];

function fetchMasterProducts() {
    runBackend('apiGetProductsPaginated', [{ page: 1, limit: 30 }], function (res) {
        if (res.success) {
            catalogProducts = res.data;
            renderMasterProdukTable();
            populateProductDropdowns();
        }
    });
}

function renderMasterProdukTable() {
            var tbody = document.getElementById('tblMasterProduk');
            if (!tbody) return;
            tbody.innerHTML = '';
            catalogProducts.forEach(function (p) {
                var tr = document.createElement('tr');
                // escapeHtml() pada semua field data produk
                tr.innerHTML = '<td><b>' + escapeHtml(p.produkId) + '</b></td>'
                    + '<td>' + escapeHtml(p.namaProduk) + '</td>'
                    + '<td>' + escapeHtml(p.satuan) + '</td>'
                    + '<td>' + formatRupiah(p.hargaBeliHPP) + '</td>'
                    + '<td><b>' + formatRupiah(p.hargaJual) + '</b></td>'
                    + '<td><span style="color:var(--emerald); font-weight:800;">' + escapeHtml(String(p.stokEtalase)) + '</span></td>'
                    + '<td>' + escapeHtml(String(p.stokGudang)) + '</td>'
                    + '<td><span class="prog-status-pill ' + (p.status === 'Aktif' ? 'green' : 'coral') + '">' + escapeHtml(p.status) + '</span></td>'
                    + '<td style="text-align: center; white-space: nowrap;">'
                    + '<button class="btn-pill-action btn-pill-secondary" style="padding: 2px 8px;" onclick="openModalEditProduk(\'' + escapeHtml(p.produkId) + '\')" title="Edit Produk">'
                    + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg> Edit'
                    + '</button>'
                    + '</td>';
                tbody.appendChild(tr);
            });
        }

function populateProductDropdowns() {
            var posSelect = document.getElementById('posSelectProduk');
            var prodSelect = document.getElementById('prodBatchProdukId');
            var tfSelect = document.getElementById('tfProdukId');
            var opnameSelect = document.getElementById('opnameProdukId');

            var optHtml = '<option value="">-- Pilih Produk --</option>';
            catalogProducts.forEach(function (p) {
                var safeNama = escapeHtml(p.namaProduk);
                var safeId = escapeHtml(p.produkId);
                var safeSatuan = escapeHtml(p.satuan || 'Pcs');
                optHtml += '<option value="' + safeId + '" data-nama="' + safeNama + '" data-harga="' + Number(p.hargaJual || 0) + '" data-hpp="' + Number(p.hargaBeliHPP || 0) + '">' + safeNama + ' (Etalase: ' + escapeHtml(String(p.stokEtalase)) + ' ' + safeSatuan + ')</option>';
            });

            if (posSelect) posSelect.innerHTML = optHtml;
            if (prodSelect) prodSelect.innerHTML = optHtml;
            if (tfSelect) tfSelect.innerHTML = optHtml;
            if (opnameSelect) opnameSelect.innerHTML = optHtml;
            hitungLiveHppPreview();
        }

function openModalTambahProduk() { document.getElementById('modalTambahProduk').classList.add('active'); }

function closeModalTambahProduk() { document.getElementById('modalTambahProduk').classList.remove('active'); }

function submitTambahProduk() {
            var payload = {
                namaProduk: document.getElementById('newProdNama').value,
                satuan: document.getElementById('newProdSatuan').value,
                hargaBeliHPP: document.getElementById('newProdHpp').value,
                hargaJual: document.getElementById('newProdHargaJual').value
            };

            runBackend('apiSaveProduct', [payload, currentUser], function (res) {
                if (!res.success) {
                    // Jangan update UI jika backend gagal
                    showToast(res.message || 'Gagal menyimpan produk.', 'error');
                    return;
                }
                showToast(res.message, 'success');
                closeModalTambahProduk();
                // Optimistic update hanya setelah backend konfirmasi sukses
                catalogProducts.push({
                    produkId: res.produkId || ('PRD-00' + (catalogProducts.length + 1)),
                    namaProduk: payload.namaProduk,
                    satuan: payload.satuan,
                    hargaBeliHPP: payload.hargaBeliHPP,
                    hargaJual: payload.hargaJual,
                    stokEtalase: 0,
                    stokGudang: 0,
                    status: 'Aktif'
                });
                renderMasterProdukTable();
                populateProductDropdowns();
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
            var elHpp = document.getElementById('editProdHpp');
            if (elHpp) elHpp.value = item.hargaBeliHPP || 0;
            var elJual = document.getElementById('editProdHargaJual');
            if (elJual) elJual.value = item.hargaJual || 0;
            var elStat = document.getElementById('editProdStatus');
            if (elStat) elStat.value = item.status || 'Aktif';

            var modal = document.getElementById('modalEditProduk');
            if (modal) modal.classList.add('active');
        }

function closeModalEditProduk() {
            var modal = document.getElementById('modalEditProduk');
            if (modal) modal.classList.remove('active');
        }

function submitEditProduk() {
            var prodId = document.getElementById('editProdId').value;
            var payload = {
                produkId: prodId,
                namaProduk: document.getElementById('editProdNama').value.trim(),
                satuan: document.getElementById('editProdSatuan').value.trim(),
                hargaBeliHPP: parseFloat(document.getElementById('editProdHpp').value) || 0,
                hargaJual: parseFloat(document.getElementById('editProdHargaJual').value) || 0,
                status: document.getElementById('editProdStatus').value
            };

            showToast('Menyimpan perubahan produk ' + prodId + '...', 'success');

            runBackend('apiUpdateProduct', [payload, currentUser], function (res) {
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
                        catalogProducts[i].status = payload.status;
                        break;
                    }
                }

                renderMasterProdukTable();
                populateProductDropdowns();
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
