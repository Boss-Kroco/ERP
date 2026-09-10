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
                    + '<td><span class="prog-status-pill green">' + escapeHtml(p.status) + '</span></td>';
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

