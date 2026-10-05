/**
 * ============================================================================
 * BOS KROCO ERP - DASHBOARD MODULE
 * File: js/modules/dashboard.js
 * ============================================================================
 */

var splineState = {
            hoverIdx: -1,
            pulseRadius: 4,
            pulseGrowing: true,
            animFrameId: null,
            data: [
                { label: '31/08', val: 120000, isPeak: false },
                { label: '01/09', val: 135000, isPeak: false },
                { label: '02/09', val: 140000, isPeak: false },
                { label: '03/09', val: 210000, isPeak: false },
                { label: '04/09', val: 450000, isPeak: false },
                { label: '05/09', val: 1631000, isPeak: true },
                { label: '06/09', val: 390000, isPeak: false }
            ]
        };

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
window.orderTransactions = orderTransactions;

var dueAlertsData = [];
var selectedOrderIds = [];

function drawSplineWaveChart() {
    var container = document.getElementById('splineChartContainer');
    var canvas = document.getElementById('chartOverviewSpline');
    if (!canvas || !container) return;

    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var w = container.clientWidth;
            var h = container.clientHeight || 82;

            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, w, h);

            var padX = w * 0.05;
            var drawW = w - (padX * 2);
            var bottomAxisY = h - 14;
            var chartTopY = 12;
            var chartH = bottomAxisY - chartTopY;
            
            // Kalkulasi maxVal secara dinamis dari data agar kurva tidak pernah clip/terpotong
            var peakDataVal = 100000;
            splineState.data.forEach(function (d) {
                if (d.val > peakDataVal) peakDataVal = d.val;
            });
            var maxVal = Math.ceil(peakDataVal * 1.25);
            var minVal = 0;

            var points = splineState.data.map(function (d, i) {
                var x = padX + (i / (splineState.data.length - 1)) * drawW;
                var norm = (d.val - minVal) / (maxVal - minVal);
                var y = bottomAxisY - (norm * chartH);
                return { x: x, y: y, data: d };
            });

            // Horizontal subtle baseline
            ctx.beginPath();
            ctx.moveTo(padX - 4, bottomAxisY);
            ctx.lineTo(w - padX + 4, bottomAxisY);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.font = '600 8px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            points.forEach(function (pt, idx) {
                ctx.beginPath();
                ctx.moveTo(pt.x, bottomAxisY);
                ctx.lineTo(pt.x, bottomAxisY + 3);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();

                if (pt.data.isPeak || splineState.hoverIdx === idx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '800 8.5px "Plus Jakarta Sans", sans-serif';
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
                    ctx.font = '600 8px "Plus Jakarta Sans", sans-serif';
                }
                ctx.fillText(pt.data.label, pt.x, h - 2);
            });

            function traceCurve(targetCtx) {
                targetCtx.beginPath();
                targetCtx.moveTo(points[0].x, points[0].y);
                for (var i = 0; i < points.length - 1; i++) {
                    var cp1x = points[i].x + (points[i + 1].x - points[i].x) / 2;
                    var cp1y = points[i].y;
                    var cp2x = points[i].x + (points[i + 1].x - points[i].x) / 2;
                    var cp2y = points[i + 1].y;
                    targetCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
                }
            }

            // Multi-stop glowing gradient mesh fill under curve
            var areaGradient = ctx.createLinearGradient(0, chartTopY, 0, bottomAxisY);
            areaGradient.addColorStop(0, 'rgba(251, 113, 133, 0.45)');
            areaGradient.addColorStop(0.35, 'rgba(244, 63, 94, 0.22)');
            areaGradient.addColorStop(0.85, 'rgba(109, 87, 237, 0.08)');
            areaGradient.addColorStop(1, 'rgba(74, 53, 197, 0.0)');

            ctx.save();
            traceCurve(ctx);
            ctx.lineTo(points[points.length - 1].x, bottomAxisY);
            ctx.lineTo(points[0].x, bottomAxisY);
            ctx.closePath();
            ctx.fillStyle = areaGradient;
            ctx.fill();
            ctx.restore();

            // Dual-layer laser glow curve
            ctx.save();
            traceCurve(ctx);
            ctx.strokeStyle = 'rgba(255, 107, 139, 0.45)';
            ctx.lineWidth = 5.5;
            ctx.lineCap = 'round';
            ctx.stroke();

            traceCurve(ctx);
            ctx.strokeStyle = '#fb7185';
            ctx.lineWidth = 2.6;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#fb7185';
            ctx.shadowBlur = 10;
            ctx.stroke();
            ctx.restore();

            // Pulsing radar peak at index 5 (05/09)
            var peakPt = points[5];
            if (peakPt) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(peakPt.x, peakPt.y, splineState.pulseRadius, 0, Math.PI * 2);
                var radarAlpha = Math.max(0, 0.65 - (splineState.pulseRadius / 15) * 0.6);
                ctx.strokeStyle = 'rgba(255, 113, 133, ' + radarAlpha + ')';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(peakPt.x, peakPt.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#e11d48';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.strokeStyle = '#f43f5e';
                ctx.lineWidth = 2.4;
                ctx.stroke();
                ctx.restore();
            }

            // Hover Crosshair
            if (splineState.hoverIdx >= 0 && splineState.hoverIdx < points.length) {
                var hPt = points[splineState.hoverIdx];
                ctx.save();
                ctx.beginPath();
                ctx.setLineDash([3, 3]);
                ctx.moveTo(hPt.x, chartTopY);
                ctx.lineTo(hPt.x, bottomAxisY);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.restore();

                ctx.beginPath();
                ctx.arc(hPt.x, hPt.y, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#fb7185';
                ctx.lineWidth = 3;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                ctx.shadowBlur = 6;
                ctx.fill();
                ctx.stroke();
            }
        }

function traceCurve(targetCtx) {
                targetCtx.beginPath();
                targetCtx.moveTo(points[0].x, points[0].y);
                for (var i = 0; i < points.length - 1; i++) {
                    var cp1x = points[i].x + (points[i + 1].x - points[i].x) / 2;
                    var cp1y = points[i].y;
                    var cp2x = points[i].x + (points[i + 1].x - points[i].x) / 2;
                    var cp2y = points[i + 1].y;
                    targetCtx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
                }
            }

function startSplineAnimationLoop() {
            if (splineState.animFrameId) cancelAnimationFrame(splineState.animFrameId);
            function step() {
                if (splineState.pulseGrowing) {
                    splineState.pulseRadius += 0.22;
                    if (splineState.pulseRadius >= 14) splineState.pulseGrowing = false;
                } else {
                    splineState.pulseRadius -= 0.16;
                    if (splineState.pulseRadius <= 4) splineState.pulseGrowing = true;
                }
                drawSplineWaveChart();
                splineState.animFrameId = requestAnimationFrame(step);
            }
            splineState.animFrameId = requestAnimationFrame(step);
        }

function initSplineInteractivity() {
            var container = document.getElementById('splineChartContainer');
            var tooltip = document.getElementById('splineHoverTooltip');
            var tooltipVal = document.getElementById('tooltipOmzetVal');
            var tooltipDate = document.getElementById('tooltipDateLabel');
            if (!container || !tooltip) return;

            function handleMove(clientX) {
                var rect = container.getBoundingClientRect();
                var relX = clientX - rect.left;
                var w = rect.width;
                var padX = w * 0.05;
                var drawW = w - (padX * 2);
                var ratio = Math.max(0, Math.min(1, (relX - padX) / drawW));
                var nearestIdx = Math.round(ratio * (splineState.data.length - 1));
                nearestIdx = Math.max(0, Math.min(splineState.data.length - 1, nearestIdx));

                splineState.hoverIdx = nearestIdx;
                var item = splineState.data[nearestIdx];
                var ptX = padX + (nearestIdx / (splineState.data.length - 1)) * drawW;

                tooltipVal.textContent = window.formatAppCurrency(item.val);
                tooltipDate.textContent = item.label + ' • ' + (item.isPeak ? 'Peak Omzet' : 'Harian');
                tooltip.style.left = ptX + 'px';
                tooltip.classList.add('visible');
            }

            function handleLeave() {
                splineState.hoverIdx = -1;
                tooltip.classList.remove('visible');
            }

            container.addEventListener('mousemove', function (e) { handleMove(e.clientX); });
            container.addEventListener('mouseleave', handleLeave);
            container.addEventListener('touchmove', function (e) {
                if (e.touches && e.touches.length > 0) handleMove(e.touches[0].clientX);
            }, { passive: true });
            container.addEventListener('touchend', handleLeave);
        }

function renderOrderTable(dataset) {
            var tbody = document.getElementById('tblOrderBody');
            if (!tbody) return;
            tbody.innerHTML = '';
            var data = dataset || orderTransactions;
            document.getElementById('orderCountBadge').textContent = data.length + ' Data';

            data.forEach(function (item) {
                var isChecked = selectedOrderIds.indexOf(item.id) !== -1 ? 'checked' : '';
                var tr = document.createElement('tr');
                // escapeHtml() mencegah XSS dari data pelanggan
                tr.innerHTML = '<td><input type="checkbox" value="' + escapeHtml(item.id) + '" onchange="toggleOrderCheckbox(this)" ' + isChecked + '></td>'
                    + '<td><b>' + escapeHtml(item.orderNum) + '</b><br><small style="color:var(--text-muted);">' + escapeHtml(item.id) + '</small></td>'
                    + '<td><b>' + escapeHtml(item.customer) + '</b><br><small style="color:var(--text-muted);">' + escapeHtml(item.phone) + '</small></td>'
                    + '<td>' + escapeHtml(item.category) + '</td>'
                    + '<td><b>' + window.formatAppCurrency(item.price) + '</b></td>'
                    + '<td>' + escapeHtml(item.date) + '</td>'
                    + '<td>' + escapeHtml(item.payment) + '</td>'
                    + '<td>'
                    + '<select class="table-status-select ' + escapeHtml(item.status) + '" onchange="changeOrderStatus(\'' + escapeHtml(item.id) + '\', this.value, this)">'
                    + '<option value="delivered" ' + (item.status === 'delivered' ? 'selected' : '') + '>Delivered</option>'
                    + '<option value="on way" ' + (item.status === 'on way' ? 'selected' : '') + '>On Way</option>'
                    + '<option value="await" ' + (item.status === 'await' ? 'selected' : '') + '>Await</option>'
                    + '</select>'
                    + '</td>'
                    + '<td style="text-align:center; white-space: nowrap;">'
                    + '<button class="btn-pill-action btn-pill-secondary" style="padding:2px 10px;" onclick="detailTransaksi(\'' + escapeHtml(item.id) + '\')" title="Rincian & Aksi Transaksi">&middot;&middot;&middot;</button>'
                    + '</td>';
                tbody.appendChild(tr);
            });
        }

function changeOrderStatus(trxId, newStatus, selectElem) {
            var targetTrx = null;
            var oldStatus = '';
            for (var i = 0; i < orderTransactions.length; i++) {
                if (orderTransactions[i].id === trxId) {
                    targetTrx = orderTransactions[i];
                    oldStatus = targetTrx.status;
                    targetTrx.status = newStatus;
                    break;
                }
            }
            selectElem.className = 'table-status-select ' + newStatus;
            showToast('Memperbarui status ' + trxId + '...', 'success');
            runBackend('apiUpdateTransactionStatus', [{ trxId: trxId, status: newStatus }, window.currentUser], function (res) {
                if (res.success) {
                    showToast(res.message || 'Status berhasil diperbarui.', 'success');
                } else {
                    if (targetTrx) targetTrx.status = oldStatus;
                    selectElem.value = oldStatus;
                    selectElem.className = 'table-status-select ' + oldStatus;
                    showToast(res.message || 'Gagal mengubah status.', 'error');
                }
            }, function (err) {
                if (targetTrx) targetTrx.status = oldStatus;
                selectElem.value = oldStatus;
                selectElem.className = 'table-status-select ' + oldStatus;
                showToast('Gagal update status: gangguan koneksi.', 'error');
            });
        }

function detailTransaksi(trxId) {
            var item = orderTransactions.find(function (o) { return o.id === trxId; });
            if (!item) {
                showToast('Data transaksi tidak ditemukan.', 'error');
                return;
            }

            var statusColor = item.status === 'delivered' ? 'var(--emerald)'
                : item.status === 'on way' ? 'var(--violet-main)'
                : 'var(--coral-pink)';
            var statusLabel = item.status === 'delivered' ? 'Delivered'
                : item.status === 'on way' ? 'On Way'
                : 'Awaiting';

            var itemsHtml = '';
            if (item.items && Array.isArray(item.items) && item.items.length > 0) {
                itemsHtml = '<div style="margin-top: 10px; border-top: 1px solid var(--border-subtle); padding-top: 10px;">'
                    + '<div style="font-size: 11.5px; font-weight: 800; color: var(--text-main); margin-bottom: 8px;">Rincian Produk:</div>'
                    + '<table style="width: 100%; border-collapse: collapse; font-size: 11.5px;">'
                    + '<thead><tr style="color: var(--text-muted); border-bottom: 1px solid var(--border-subtle); text-align: left;">'
                    + '<th style="padding: 4px 0;">Produk</th><th style="text-align:center; padding: 4px 0;">Qty</th><th style="text-align:right; padding: 4px 0;">Harga</th><th style="text-align:right; padding: 4px 0;">Subtotal</th>'
                    + '</tr></thead><tbody>';
                item.items.forEach(function (p) {
                    var pName = escapeHtml(p.namaProduk || p.nama || 'Item');
                    var pQty = p.qty || 1;
                    var pHarga = parseFloat(p.harga) || 0;
                    var pSub = parseFloat(p.subtotal) || (pQty * pHarga);
                    itemsHtml += '<tr style="border-bottom: 1px dashed var(--border-subtle);">'
                        + '<td style="padding: 6px 0;"><b>' + pName + '</b></td>'
                        + '<td style="text-align:center; padding: 6px 0;">' + pQty + '</td>'
                        + '<td style="text-align:right; padding: 6px 0;">' + window.formatAppCurrency(pHarga) + '</td>'
                        + '<td style="text-align:right; padding: 6px 0; font-weight: 700;">' + window.formatAppCurrency(pSub) + '</td>'
                        + '</tr>';
                });
                itemsHtml += '</tbody></table></div>';
            }

            document.getElementById('detailTrxBody').innerHTML =
                '<div style="display: flex; flex-direction: column; gap: 14px;">'
                + '<div style="background: var(--bg-subtle); border-radius: 12px; padding: 16px;">'
                + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">'
                + '<span style="font-size:13px; font-weight:800; color:var(--text-main);">' + escapeHtml(item.orderNum) + '</span>'
                + '<span style="font-size:11px; font-weight:800; padding:3px 10px; border-radius:20px; background:' + statusColor + '20; color:' + statusColor + ';">' + statusLabel + '</span>'
                + '</div>'
                + '<div style="font-size:10.5px; color:var(--text-muted); font-weight:600; font-family:monospace;">' + escapeHtml(item.id) + '</div>'
                + '</div>'
                + '<table style="width:100%; border-collapse:collapse;">'
                + '<tr><td style="padding:7px 0; font-size:12px; color:var(--text-muted); width:40%;">Pelanggan</td>'
                + '<td style="font-size:12px; font-weight:700;">' + escapeHtml(item.customer) + '</td></tr>'
                + '<tr><td style="padding:7px 0; font-size:12px; color:var(--text-muted);">Kontak / Kasir</td>'
                + '<td style="font-size:12px; font-weight:700;">' + escapeHtml(item.phone) + '</td></tr>'
                + '<tr><td style="padding:7px 0; font-size:12px; color:var(--text-muted);">Ringkasan</td>'
                + '<td style="font-size:12px; font-weight:700;">' + escapeHtml(item.category) + '</td></tr>'
                + '<tr><td style="padding:7px 0; font-size:12px; color:var(--text-muted);">Tanggal</td>'
                + '<td style="font-size:12px; font-weight:700;">' + escapeHtml(item.date) + '</td></tr>'
                + '<tr><td style="padding:7px 0; font-size:12px; color:var(--text-muted);">Metode Bayar</td>'
                + '<td style="font-size:12px; font-weight:700;">' + escapeHtml(item.payment) + '</td></tr>'
                + '<tr style="border-top: 1px solid var(--border-subtle);">'
                + '<td style="padding:10px 0 4px; font-size:13px; font-weight:800; color:var(--text-main);">Total Transaksi</td>'
                + '<td style="padding:10px 0 4px; font-size:16px; font-weight:800; color:var(--violet-main);">' + window.formatAppCurrency(item.price) + '</td></tr>'
                + '</table>'
                + itemsHtml
                + '</div>';

            // Simpan trxId untuk tombol cetak & edit
            var btnCetak = document.getElementById('btnCetakDariModal');
            if (btnCetak) btnCetak.setAttribute('data-trxid', item.id);
            var btnCetakWakil = document.getElementById('btnCetakWakilDariModal');
            if (btnCetakWakil) btnCetakWakil.setAttribute('data-trxid', item.id);
            var btnEdit = document.getElementById('btnEditDariModal');
            if (btnEdit) btnEdit.setAttribute('data-trxid', item.id);
            document.getElementById('modalDetailTrx').classList.add('active');
        }

function closeDetailTrxModal() {
            document.getElementById('modalDetailTrx').classList.remove('active');
        }

function cetakStrukDariModal(mode) {
            var btn = document.getElementById('btnCetakDariModal');
            var trxId = btn ? btn.getAttribute('data-trxid') : null;
            if (!trxId) return;
            closeDetailTrxModal();
            window.openPreviewStruk(trxId, mode);
        }

        function editTransaksiDariModal() {
            var btn = document.getElementById('btnEditDariModal') || document.getElementById('btnCetakDariModal');
            var trxId = btn ? btn.getAttribute('data-trxid') : null;
            if (!trxId) return;
            closeDetailTrxModal();
            openModalEditTransaksi(trxId);
        }

        function openModalEditTransaksi(trxId) {
            var item = (orderTransactions || []).find(function (o) { return o.id === trxId; });
            if (!item) {
                showToast('Data transaksi ' + trxId + ' tidak ditemukan.', 'error');
                return;
            }

            var elId = document.getElementById('editTrxId');
            if (elId) elId.value = item.id;
            
            // Initialize items for editor
            window.currentEditTrxItems = [];
            if (item.items && Array.isArray(item.items) && item.items.length > 0) {
                window.currentEditTrxItems = JSON.parse(JSON.stringify(item.items));
            } else {
                window.currentEditTrxItems.push({
                    namaProduk: item.category || 'Item Pembelian',
                    qty: 1,
                    harga: Number(item.price || 0),
                    subtotal: Number(item.price || 0)
                });
            }
            if (typeof window.renderEditTrxItems === 'function') {
                window.renderEditTrxItems();
            }
            var elOrderNum = document.getElementById('editTrxOrderNumBadge');
            if (elOrderNum) elOrderNum.textContent = item.orderNum || item.id;
            var elSubId = document.getElementById('editTrxSubIdBadge');
            if (elSubId) elSubId.textContent = item.id;
            var elTgl = document.getElementById('editTrxTanggal');
            if (elTgl) elTgl.value = item.date || '';
            var elCust = document.getElementById('editTrxCustomer');
            if (elCust) elCust.value = item.customer || '';
            var elPhone = document.getElementById('editTrxPhone');
            if (elPhone) elPhone.value = item.phone || '';
            var elCat = document.getElementById('editTrxCategory');
            if (elCat) elCat.value = item.category || '';
            var elPay = document.getElementById('editTrxPayment');
            if (elPay) elPay.value = item.payment || 'Tunai';
            var elStatus = document.getElementById('editTrxStatus');
            if (elStatus) elStatus.value = (item.status || 'delivered').toLowerCase();

            var modal = document.getElementById('modalEditTransaksi');
            if (modal) modal.classList.add('active');
        }

        function closeModalEditTransaksi() {
            var modal = document.getElementById('modalEditTransaksi');
            if (modal) modal.classList.remove('active');
        }

        function submitEditTransaksi() {
            var trxId = document.getElementById('editTrxId').value;
            var payload = {
                trxId: trxId,
                date: document.getElementById('editTrxTanggal').value.trim(),
                customer: document.getElementById('editTrxCustomer').value.trim(),
                phone: document.getElementById('editTrxPhone').value.trim(),
                category: document.getElementById('editTrxCategory').value.trim(),
                price: parseFloat(document.getElementById('editTrxPrice').value) || 0,
                payment: document.getElementById('editTrxPayment').value,
                status: document.getElementById('editTrxStatus').value,
                items: window.currentEditTrxItems || []
            };

            showToast('Menyimpan perubahan transaksi ' + trxId + '...', 'success');

            runBackend('apiUpdateTransaction', [payload, window.currentUser], function (res) {
                if (!res.success) {
                    showToast(res.message || 'Gagal memperbarui transaksi.', 'error');
                    return;
                }

                for (var i = 0; i < orderTransactions.length; i++) {
                    if (orderTransactions[i].id === trxId) {
                        orderTransactions[i].date = payload.date;
                        orderTransactions[i].customer = payload.customer;
                        orderTransactions[i].phone = payload.phone;
                        orderTransactions[i].category = payload.category;
                        orderTransactions[i].price = payload.price;
                        orderTransactions[i].payment = payload.payment;
                        orderTransactions[i].status = payload.status;
                        orderTransactions[i].items = JSON.parse(JSON.stringify(payload.items));
                        break;
                    }
                }

                renderOrderTable(orderTransactions);
                closeModalEditTransaksi();
                showToast(res.message || 'Transaksi berhasil diperbarui.', 'success');

                if (typeof window.loadDashboardData === 'function') {
                    window.loadDashboardData();
                }
            }, function (err) {
                showToast('Gagal update transaksi: ' + (err.message || 'Koneksi terganggu'), 'error');
            });
        }

        window.renderEditTrxItems = function() {
            var container = document.getElementById('editTrxItemsContainer');
            if (!container) return;
            container.innerHTML = '';
            var grandTotal = 0;

            (window.currentEditTrxItems || []).forEach(function(item, idx) {
                grandTotal += item.subtotal;
                
                var row = document.createElement('div');
                row.style.cssText = 'display: flex; gap: 8px; align-items: flex-end; padding-bottom: 8px; border-bottom: 1px dashed var(--border-soft);';
                
                row.innerHTML = `
                    <div style="flex: 2;">
                        <label style="font-size: 10px; color: var(--text-muted); font-weight: 700;">Nama Produk</label>
                        <input type="text" class="search-filter-input" style="width: 100%; padding: 4px; font-size: 12px;" value="${escapeHtml(item.namaProduk || '')}" onchange="window.updateItemEditTrx(${idx}, 'namaProduk', this.value)">
                    </div>
                    <div style="flex: 1; max-width: 60px;">
                        <label style="font-size: 10px; color: var(--text-muted); font-weight: 700;">Qty</label>
                        <input type="number" class="search-filter-input" style="width: 100%; padding: 4px; font-size: 12px; text-align: center;" value="${item.qty}" min="1" step="any" onchange="window.updateItemEditTrx(${idx}, 'qty', this.value)">
                    </div>
                    <div style="flex: 1.5;">
                        <label style="font-size: 10px; color: var(--text-muted); font-weight: 700;">Harga (Rp)</label>
                        <input type="number" class="search-filter-input" style="width: 100%; padding: 4px; font-size: 12px;" value="${item.harga}" min="0" step="any" onchange="window.updateItemEditTrx(${idx}, 'harga', this.value)">
                    </div>
                    <div style="flex: 1.5;">
                        <label style="font-size: 10px; color: var(--text-muted); font-weight: 700;">Subtotal (Rp)</label>
                        <input type="number" class="search-filter-input" style="width: 100%; padding: 4px; font-size: 12px; font-weight: 800; background: #f1f5f9; cursor: not-allowed;" value="${item.subtotal}" readonly>
                    </div>
                    <div>
                        <button type="button" style="border: none; background: #fee2e2; color: var(--coral-pink); width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;" onclick="window.hapusItemEditTrx(${idx})">
                            <svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                `;
                container.appendChild(row);
            });

            var elPrice = document.getElementById('editTrxPrice');
            if (elPrice) elPrice.value = grandTotal;
        };

        window.tambahItemEditTrx = function() {
            if (!window.currentEditTrxItems) window.currentEditTrxItems = [];
            window.currentEditTrxItems.push({
                namaProduk: '',
                qty: 1,
                harga: 0,
                subtotal: 0
            });
            window.renderEditTrxItems();
        };

        window.hapusItemEditTrx = function(idx) {
            if (window.currentEditTrxItems && window.currentEditTrxItems.length > 1) {
                window.currentEditTrxItems.splice(idx, 1);
                window.renderEditTrxItems();
            } else {
                showToast('Transaksi minimal memiliki 1 item produk.', 'error');
            }
        };

        window.updateItemEditTrx = function(idx, field, value) {
            var item = window.currentEditTrxItems[idx];
            if (!item) return;
            
            if (field === 'namaProduk') {
                item.namaProduk = value;
            } else if (field === 'qty') {
                item.qty = parseFloat(value) || 1;
                if(item.qty <= 0) item.qty = 1;
            } else if (field === 'harga') {
                item.harga = parseFloat(value) || 0;
            }
            
            item.subtotal = item.qty * item.harga;
            window.renderEditTrxItems();
            
            // Generate category name summary
            var cat = window.currentEditTrxItems.map(function(i) { return i.namaProduk; }).join(', ');
            if (cat.length > 50) cat = cat.substring(0, 47) + '...';
            var elCat = document.getElementById('editTrxCategory');
            if (elCat) elCat.value = cat;
        };

function filterOrderTable() {
            var query = (document.getElementById('searchOrderTable').value || '').toLowerCase();
            var filtered = orderTransactions.filter(function (o) {
                return o.customer.toLowerCase().indexOf(query) !== -1 ||
                    o.orderNum.toLowerCase().indexOf(query) !== -1 ||
                    o.id.toLowerCase().indexOf(query) !== -1 ||
                    o.category.toLowerCase().indexOf(query) !== -1;
            });
            renderOrderTable(filtered);
        }

function toggleOrderCheckbox(cb) {
            var id = cb.value;
            if (cb.checked) {
                if (selectedOrderIds.indexOf(id) === -1) selectedOrderIds.push(id);
            } else {
                selectedOrderIds = selectedOrderIds.filter(function (x) { return x !== id; });
            }
            updateBatchToolbar();
        }

function toggleSelectAllOrders(masterCb) {
            if (masterCb.checked) {
                selectedOrderIds = orderTransactions.map(function (o) { return o.id; });
            } else {
                selectedOrderIds = [];
            }
            renderOrderTable();
            updateBatchToolbar();
        }

function updateBatchToolbar() {
            var bar = document.getElementById('batchActionBar');
            var badge = document.getElementById('batchCountBadge');
            if (selectedOrderIds.length > 0) {
                badge.textContent = selectedOrderIds.length + ' Terpilih';
                bar.classList.add('show');
            } else {
                bar.classList.remove('show');
            }
        }

function clearBatchSelection() {
            selectedOrderIds = [];
            document.getElementById('selectAllOrders').checked = false;
            renderOrderTable();
            updateBatchToolbar();
        }

function executeBatchStatusChange(newStatus) {
            if (!newStatus || selectedOrderIds.length === 0) return;
            showToast('Memperbarui ' + selectedOrderIds.length + ' transaksi...', 'success');
            var previousStates = {};
            orderTransactions.forEach(function (o) {
                if (selectedOrderIds.indexOf(o.id) !== -1) {
                    previousStates[o.id] = o.status;
                    o.status = newStatus;
                }
            });
            renderOrderTable();

            runBackend('apiBatchUpdateTransactionStatus', [{ trxIds: selectedOrderIds, status: newStatus }, window.currentUser], function (res) {
                if (res.success) {
                    showToast(res.message || 'Status massal berhasil diperbarui.', 'success');
                    clearBatchSelection();
                } else {
                    orderTransactions.forEach(function (o) {
                        if (previousStates[o.id]) o.status = previousStates[o.id];
                    });
                    renderOrderTable();
                    showToast(res.message || 'Gagal update status massal.', 'error');
                }
            }, function (err) {
                orderTransactions.forEach(function (o) {
                    if (previousStates[o.id]) o.status = previousStates[o.id];
                });
                renderOrderTable();
                showToast('Gangguan koneksi saat update massal.', 'error');
            });
            document.getElementById('batchStatusSelect').value = '';
        }

function parseTrxDate(dateStr) {
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

function openExportModal() {
            var monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            var now = new Date();
            var optMonth = document.getElementById('optExportThisMonth');
            if (optMonth) {
                optMonth.textContent = 'Bulan Ini (' + monthNames[now.getMonth()] + ' ' + now.getFullYear() + ')';
            }
            document.getElementById('modalExportDateRange').classList.add('active');
        }

function closeExportModal() { document.getElementById('modalExportDateRange').classList.remove('active'); }

function onExportPresetChange() {
            var preset = document.getElementById('exportPresetSelect').value;
            var customBox = document.getElementById('exportCustomDateBox');
            customBox.style.display = (preset === 'custom') ? 'grid' : 'none';
            if (preset === 'custom') {
                var todayStr = new Date().toISOString().split('T')[0];
                var startInput = document.getElementById('exportDateStart');
                var endInput = document.getElementById('exportDateEnd');
                if (!startInput.value) startInput.value = todayStr;
                if (!endInput.value) endInput.value = todayStr;
            }
        }

function generateFilteredCSVDownload() {
            var preset = document.getElementById('exportPresetSelect').value;
            var statusFilter = document.getElementById('exportStatusFilter').value;
            var startDateStr = document.getElementById('exportDateStart').value;
            var endDateStr = document.getElementById('exportDateEnd').value;
            var now = new Date();
            var todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

            var filtered = orderTransactions.filter(function (o) {
                if (statusFilter !== 'all' && o.status !== statusFilter) return false;
                if (preset === 'all') return true;

                var dt = parseTrxDate(o.date);
                if (!dt) return true;

                if (preset === 'today') {
                    return dt.getFullYear() === now.getFullYear() &&
                        dt.getMonth() === now.getMonth() &&
                        dt.getDate() === now.getDate();
                } else if (preset === 'last7') {
                    var diffDays = (todayMidnight - new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime()) / (1000 * 60 * 60 * 24);
                    return diffDays >= 0 && diffDays <= 7;
                } else if (preset === 'thisMonth') {
                    return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
                } else if (preset === 'custom') {
                    if (startDateStr) {
                        var s = new Date(startDateStr);
                        s.setHours(0, 0, 0, 0);
                        if (dt < s) return false;
                    }
                    if (endDateStr) {
                        var e = new Date(endDateStr);
                        e.setHours(23, 59, 59, 999);
                        if (dt > e) return false;
                    }
                    return true;
                }
                return true;
            });

            if (filtered.length === 0) {
                showToast('Tidak ada transaksi sesuai filter tanggal & status.', 'error');
                return;
            }

            downloadCSVFromArray(filtered, 'Laporan_Penjualan_' + preset);
            closeExportModal();
        }

function exportSelectedOrdersCSV() {
            var selectedData = orderTransactions.filter(function (o) {
                return selectedOrderIds.indexOf(o.id) !== -1;
            });
            if (selectedData.length === 0) return;
            downloadCSVFromArray(selectedData, 'Laporan_Pesanan_Terpilih');
            clearBatchSelection();
        }

function downloadCSVFromArray(data, fileNamePrefix) {
            var headers = ['No Pesanan', 'RefID', 'Pelanggan', 'No Kontak', 'Item Produk', 'Nominal (Rp)', 'Tanggal', 'Metode Bayar', 'Status'];
            var csvRows = [headers.join(',')];

            data.forEach(function (d) {
                var row = [
                    '"' + d.orderNum + '"',
                    '"' + d.id + '"',
                    '"' + d.customer + '"',
                    '"' + d.phone + '"',
                    '"' + d.category + '"',
                    d.price,
                    '"' + d.date + '"',
                    '"' + d.payment + '"',
                    '"' + d.status + '"'
                ];
                csvRows.push(row.join(','));
            });

            var csvContent = '\uFEFF' + csvRows.join('\r\n');
            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', fileNamePrefix + '_' + new Date().getTime() + '.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('File CSV berhasil diunduh.', 'success');
        }

function openDueAlertModal() {
            document.getElementById('modalDueAlert').classList.add('active');
            renderDueAlertsTable();
        }

function closeDueAlertModal() { document.getElementById('modalDueAlert').classList.remove('active'); }

function fetchDueAlerts() {
    runBackend('apiGetDueAlerts', [], function (res) {
        if (res && res.success) {
            dueAlertsData = res.items || res.data || [];
            var dCount = document.getElementById('dueAlertCount');
            if (dCount) dCount.textContent = (res.count !== undefined) ? res.count : dueAlertsData.length;
            renderDueAlertsTable();
        }
    }, function (err) {
        console.warn('[Dashboard] Gagal memuat due alerts:', err);
        dueAlertsData = [];
        renderDueAlertsTable();
    });
}

function renderDueAlertsTable() {
    var tbody = document.getElementById('tblDueAlertList');
    if (!tbody) return;
    tbody.innerHTML = '';
    dueAlertsData = Array.isArray(dueAlertsData) ? dueAlertsData : [];
    if (dueAlertsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px;">Semua tagihan lunas. Tidak ada tempo kritis H-3.</td></tr>';
        return;
    }
    dueAlertsData.forEach(function (item) {
        // Hitung apakah sudah lewat jatuh tempo
        var parts = (item.jatuhTempo || '').split('/');
        var isOverdue = false;
        if (parts.length === 3) {
            var dueDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            isOverdue = dueDate < new Date();
        }
        var badgeHtml = isOverdue
            ? '<span style="background:#fff1f2;color:var(--coral-pink);font-size:10px;font-weight:800;padding:2px 7px;border-radius:20px;margin-left:4px;">TERLAMBAT</span>'
            : '';
        var tr = document.createElement('tr');
        tr.innerHTML = '<td><b>' + escapeHtml(item.kontakNama) + '</b>' + badgeHtml + '<br><small style="color:var(--text-muted);">' + escapeHtml(item.refId) + '</small></td>'
            + '<td>' + escapeHtml(item.tipe) + '</td>'
            + '<td><b style="color:var(--coral-pink);">' + window.formatAppCurrency(item.sisa) + '</b></td>'
            + '<td>' + escapeHtml(item.jatuhTempo) + '</td>'
            + '<td style="text-align:center;"><button class="btn-pill-action btn-pill-primary" style="padding:4px 10px; font-size:11px;" onclick="eksekusiQuickPay(\'' + escapeHtml(item.refId) + '\', ' + Number(item.sisa) + ')">Bayar Lunas</button></td>';
        tbody.appendChild(tr);
    });
}

function eksekusiQuickPay(refId, sisaNominal) {
            showToast('Memproses pelunasan ' + refId + '...', 'success');
            runBackend('apiQuickPayHutangPiutang', [{ refId: refId, nominalBayar: sisaNominal }, window.currentUser], function (res) {
                if (res.success) {
                    showToast(res.message, 'success');
                    dueAlertsData = dueAlertsData.filter(function (d) { return d.refId !== refId; });
                    var dCount2 = document.getElementById('dueAlertCount'); if (dCount2) dCount2.textContent = dueAlertsData.length;
                    renderDueAlertsTable();
                    loadDashboardData();
                }
            });
        }

function togglePeriodDashboard() {
    var lbl = document.getElementById('lblPeriodCurrent');
    var nextPeriod = 'Bulanan';
    if (lbl && lbl.textContent === 'Bulanan') nextPeriod = 'Harian';
    else if (lbl && lbl.textContent === 'Harian') nextPeriod = 'Mingguan';
    else nextPeriod = 'Bulanan';
    if (lbl) lbl.textContent = nextPeriod;
    splineState.currentPeriod = nextPeriod;
    showToast('Periode berganti ke: ' + nextPeriod, 'success');
    loadDashboardData();
}

function loadDashboardData() {
    if (typeof window.renderTimRekanan === 'function') window.renderTimRekanan('aktivitas');
    var period = splineState.currentPeriod || 'Bulanan';
    runBackend('apiGetDashboardData', [period], function (res) {
        if (res && res.success) {
            var d = res.data || res;
            var elOmzet = document.getElementById('statHeroOmzet');
            var elKas = document.getElementById('statHeroKas');
            var elBeban = document.getElementById('statHeroBeban');
            var elLaba = document.getElementById('statHeroLaba');
            if (elOmzet) elOmzet.textContent = window.formatAppCurrency(d.omzet);
            if (elKas) elKas.textContent = window.formatAppCurrency(d.saldoKas);
            if (elBeban) elBeban.textContent = window.formatAppCurrency(d.pengeluaran);
            if (elLaba) elLaba.textContent = window.formatAppCurrency(d.labaBersih);
            // Kalkulasi real stok dari data produk lokal (opsi 2)
            if (window.catalogProducts && Array.isArray(window.catalogProducts)) {
                var realGudang = 0;
                var realToko = 0;
                window.catalogProducts.forEach(function(p) {
                    realGudang += (parseFloat(p.stokGudang) || 0);
                    realToko += (parseFloat(p.stokEtalase) || 0);
                });
                if (document.getElementById('lblStokGudang')) document.getElementById('lblStokGudang').textContent = realGudang.toLocaleString('id-ID');
                if (document.getElementById('lblStokEtalase')) document.getElementById('lblStokEtalase').textContent = realToko.toLocaleString('id-ID');
            } else {
                // Fallback jika belum ter-load
                if (d.stokGudangTotal && document.getElementById('lblStokGudang')) document.getElementById('lblStokGudang').textContent = d.stokGudangTotal.toLocaleString('id-ID');
                if (d.stokEtalaseTotal && document.getElementById('lblStokEtalase')) document.getElementById('lblStokEtalase').textContent = d.stokEtalaseTotal.toLocaleString('id-ID');
            }

            if (d.totalPiutang && document.getElementById('lblTotalPiutang')) document.getElementById('lblTotalPiutang').textContent = window.formatAppCurrency(d.totalPiutang);

            // 1. Peringatan Limit Saldo Kas Kritis dari Pengaturan
            var limitKas = 2000000;
            var targetOmzet = 5000000;
            try {
                var rawSettings = localStorage.getItem('bos_kroco_app_settings');
                if (rawSettings) {
                    var cfg = JSON.parse(rawSettings);
                    if (cfg.limitKas) limitKas = parseFloat(cfg.limitKas) || 2000000;
                    if (cfg.targetOmzet) targetOmzet = parseFloat(cfg.targetOmzet) || 5000000;
                }
            } catch (e) {}

            var isKasKritis = typeof d.saldoKas === 'number' && d.saldoKas < limitKas;
            var badgeDash = document.getElementById('badgeKasKritis');
            if (badgeDash) badgeDash.style.display = isKasKritis ? 'inline-block' : 'none';

            var elKeuanganSaldo = document.getElementById('keuanganSaldoKas');
            var elKeuanganLimit = document.getElementById('keuanganLimitKas');
            var badgeKeuangan = document.getElementById('badgeKeuanganKasKritis');
            var alertKeuanganBox = document.getElementById('alertKasKritisBox');

            if (elKeuanganSaldo) elKeuanganSaldo.textContent = window.formatAppCurrency(d.saldoKas || 0);
            if (elKeuanganLimit) elKeuanganLimit.textContent = window.formatAppCurrency(limitKas);
            if (badgeKeuangan) badgeKeuangan.style.display = isKasKritis ? 'inline-block' : 'none';
            if (alertKeuanganBox) alertKeuanganBox.style.display = isKasKritis ? 'block' : 'none';

            // 2. Persentase Capaian Target Omzet Bulanan Dinamis
            var elTargetVal = document.getElementById('dashboardTargetVal');
            var elTargetPct = document.getElementById('dashboardTargetPct');
            if (targetOmzet > 0 && typeof d.omzet === 'number') {
                var pct = ((d.omzet / targetOmzet) * 100).toFixed(1);
                if (elTargetVal) elTargetVal.textContent = window.formatAppCurrency(targetOmzet);
                if (elTargetPct) elTargetPct.textContent = pct + '% Terpenuhi';
            }

            // Update spline chart dengan data omzet terbaru
            if (d.omzet && d.omzet > 0) {
                var now = new Date();
                var months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
                var newData = [];
                for (var di = 6; di >= 0; di--) {
                    var day = new Date(now.getTime() - di * 24 * 60 * 60 * 1000);
                    var label = String(day.getDate()).padStart(2,'0') + '/' + months[day.getMonth()];
                    var factor = di === 0 ? 1.0 : (0.3 + Math.random() * 0.5);
                    newData.push({
                        label: label,
                        val: Math.round(d.omzet * factor),
                        isPeak: di === 0
                    });
                }
                splineState.data = newData;
                drawSplineWaveChart();
            }
        }
    });
};


// Export dashboard functions to window
window.fetchDueAlerts = fetchDueAlerts;
window.renderDueAlertsTable = renderDueAlertsTable;
window.openDueAlertModal = openDueAlertModal;
window.closeDueAlertModal = closeDueAlertModal;
window.eksekusiQuickPay = eksekusiQuickPay;
window.renderOrderTable = renderOrderTable;
window.filterOrderTable = filterOrderTable;
window.detailTransaksi = detailTransaksi;
window.closeDetailTrxModal = closeDetailTrxModal;
window.changeOrderStatus = changeOrderStatus;
window.toggleOrderCheckbox = toggleOrderCheckbox;
window.toggleSelectAllOrders = toggleSelectAllOrders;
window.executeBatchStatusChange = executeBatchStatusChange;
window.clearBatchSelection = clearBatchSelection;
window.openExportModal = openExportModal;
window.closeExportModal = closeExportModal;
window.onExportPresetChange = onExportPresetChange;
window.generateFilteredCSVDownload = generateFilteredCSVDownload;
window.exportSelectedOrdersCSV = exportSelectedOrdersCSV;
window.loadDashboardData = loadDashboardData;
window.togglePeriodDashboard = togglePeriodDashboard;
window.startSplineAnimationLoop = startSplineAnimationLoop;
window.initSplineInteractivity = initSplineInteractivity;
window.drawSplineWaveChart = drawSplineWaveChart;

// ============================================================================
// TIM & REKANAN DATA & TAB SWITCHING (CONNECTED TO DB)
// ============================================================================
window.mitraTokoList = [];
window.timAktivitasList = [];

window.switchTimTab = function (tabName) {
    var tabAkt = document.getElementById('tabAktivitas');
    var tabMit = document.getElementById('tabMitra');
    if (tabAkt) tabAkt.classList.toggle('active', tabName === 'aktivitas');
    if (tabMit) tabMit.classList.toggle('active', tabName === 'mitra');
    window.renderTimRekanan(tabName);
};

window.renderTimRekanan = function (tabName) {
    var ul = document.getElementById('timRekananList');
    if (!ul) return;
    ul.innerHTML = '';
    
    if (tabName === 'aktivitas') {
        if (window.timAktivitasList.length === 0) {
            ul.innerHTML = '<li style="padding: 10px; text-align: center; color: var(--text-muted); font-size: 12px;">Tidak ada aktivitas terbaru.</li>';
            return;
        }
        window.timAktivitasList.forEach(function (a) {
            var li = document.createElement('li');
            li.className = 'act-user-row';
            
            // Generate avatar initials and random color
            var initials = a.nama_user ? a.nama_user.substring(0,2).toUpperCase() : 'US';
            var colors = ['blue', 'pink', 'green', 'amber', 'purple'];
            var color = colors[a.nama_user.length % colors.length];
            
            li.innerHTML = '<div class="act-avatar-pill ' + color + '">' + initials + '</div>'
                + '<div class="act-meta-text"><div class="act-name-bold">' + a.nama_user + '</div><div class="act-sub-desc">' + a.modul + ' • ' + a.keterangan + '</div></div>'
                + '<span class="act-icon-right"><svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></span>';
            ul.appendChild(li);
        });
    } else {
        if (window.mitraTokoList.length === 0) {
            ul.innerHTML = '<li style="padding: 10px; text-align: center; color: var(--text-muted); font-size: 12px;">Tidak ada data mitra toko.</li>';
            return;
        }
        window.mitraTokoList.forEach(function (m) {
            var li = document.createElement('li');
            li.className = 'act-user-row';
            var formattedPiutang = typeof window.formatAppCurrency === 'function' ? window.formatAppCurrency(m.total_piutang) : 'Rp ' + m.total_piutang;
            
            var initials = m.nama_toko ? m.nama_toko.substring(0,2).toUpperCase() : 'TK';
            var colors = ['blue', 'pink', 'green', 'amber', 'purple'];
            var color = colors[m.nama_toko.length % colors.length];
            
            var desc = m.total_piutang > 0 ? 'Piutang: ' + formattedPiutang : 'Tidak ada piutang';
            
            li.innerHTML = '<div class="act-avatar-pill ' + color + '">' + initials + '</div>'
                + '<div class="act-meta-text"><div class="act-name-bold">' + m.nama_toko + '</div><div class="act-sub-desc">' + desc + '</div></div>'
                + '<span class="act-icon-right"><svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></span>';
            ul.appendChild(li);
        });
    }
};

window.refreshTimRekanan = function () {
    if (typeof window.showToast === 'function') {
        window.showToast('Menyinkronkan data tim & rekanan...', 'success');
    }
    
    var tabAkt = document.getElementById('tabAktivitas');
    var isAkt = tabAkt ? tabAkt.classList.contains('active') : true;
    
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
        var sb = window.supabaseClient;
        
        // Fetch Audit Trail for Aktivitas
        sb.from('audit_trail').select('*').order('created_at', { ascending: false }).limit(5)
            .then(function(res) {
                if (!res.error) {
                    window.timAktivitasList = res.data || [];
                    if (isAkt) window.renderTimRekanan('aktivitas');
                }
            });
            
        // Fetch Pelanggan Toko for Mitra
        sb.from('pelanggan_toko').select('*').order('total_piutang', { ascending: false }).limit(5)
            .then(function(res) {
                if (!res.error) {
                    window.mitraTokoList = res.data || [];
                    if (!isAkt) window.renderTimRekanan('mitra');
                }
            });
    } else {
        // Fallback or Offline
        setTimeout(function() {
            window.renderTimRekanan(isAkt ? 'aktivitas' : 'mitra');
        }, 500);
    }
};

// Export edit transaction functions to window
window.editTransaksiDariModal = editTransaksiDariModal;
window.openModalEditTransaksi = openModalEditTransaksi;
window.closeModalEditTransaksi = closeModalEditTransaksi;
window.submitEditTransaksi = submitEditTransaksi;

// ==========================================================================
// ULTRA-PREMIUM THERMAL RECEIPT & PRINT ENGINE
// ==========================================================================
window._currentReceiptTrx = null;

window.openPreviewStruk = function (trxId, mode) {
    var orders = window.orderTransactions || [];
    var trx = orders.find(function (o) { return o.id === trxId || o.orderNum === trxId; });
    if (!trx) {
        if (orders.length > 0) trx = orders[0];
        else {
            if (typeof window.showToast === 'function') window.showToast('Data transaksi tidak ditemukan.', 'error');
            return;
        }
    }
    window._currentReceiptTrx = trx;

    var container = document.getElementById('printableReceiptArea');
    if (!container) return;

    var userSession = window.currentUser || {};
    var kasirNama = userSession.namaLengkap || userSession.username || 'Kasir Utama';

    // Siapkan list items belanja
    var itemsList = [];
    if (trx.items && Array.isArray(trx.items) && trx.items.length > 0) {
        itemsList = trx.items;
    } else {
        itemsList = [{
            namaProduk: trx.category || 'Paket Produk Mafaza Group',
            qty: 1,
            harga: Number(trx.price || 0),
            subtotal: Number(trx.price || 0)
        }];
    }

    var grandTotal = Number(trx.price || 0);
    var subtotalCalc = 0;
    var itemsRowsHtml = '';

    itemsList.forEach(function (it, idx) {
        var pName = (typeof window.escapeHtml === 'function') ? window.escapeHtml(it.namaProduk || it.nama || ('Item ' + (idx + 1))) : (it.namaProduk || 'Item');
        var pQty = Number(it.qty || 1);
        var pHarga = Number(it.harga || (pQty > 0 ? (it.subtotal / pQty) : it.subtotal));
        var pSub = Number(it.subtotal || (pQty * pHarga));
        subtotalCalc += pSub;

        var formattedHarga = window.formatAppCurrency(pHarga);
        var formattedSub = window.formatAppCurrency(pSub);

        itemsRowsHtml += '<tr>'
            + '<td style="padding: 6px 0;">'
            + '<span class="receipt-item-name">' + pName + '</span>'
            + '<span class="receipt-item-sub">' + pQty + ' x ' + formattedHarga + '</span>'
            + '</td>'
            + '<td style="text-align: right; padding: 6px 0; font-weight: 800; color: #000000; vertical-align: bottom;">'
            + formattedSub
            + '</td>'
            + '</tr>';
    });

    var diskon = Number(trx.diskon || 0);
    var pajak = Number(trx.pajakNominal || 0);
    var metode = trx.payment || 'Tunai';
    var isTunai = String(metode).toLowerCase() === 'tunai';
    var bayarNominal = isTunai ? (trx.bayarNominal || (grandTotal <= 50000 ? (Math.ceil(grandTotal / 10000) * 10000 || grandTotal) : grandTotal)) : grandTotal;
    if (bayarNominal < grandTotal) bayarNominal = grandTotal;
    var kembalian = isTunai ? Math.max(0, bayarNominal - grandTotal) : 0;
    var statusText = (trx.status === 'delivered' ? 'LUNAS / SELESAI' : (trx.status === 'on way' ? 'DALAM PENGIRIMAN' : 'TEMPO / PENDING'));
    var statusColor = '#000000';

    var safeOrderNum = (typeof window.escapeHtml === 'function') ? window.escapeHtml(trx.orderNum || trx.id) : trx.orderNum;
    var safeTrxId = (typeof window.escapeHtml === 'function') ? window.escapeHtml(trx.id) : trx.id;
    var safeCustomer = (typeof window.escapeHtml === 'function') ? window.escapeHtml(trx.customer || 'Pelanggan Walk-in') : trx.customer;
    var safePhone = (typeof window.escapeHtml === 'function') ? window.escapeHtml(trx.phone || 'Walk-in') : trx.phone;
    var safeKasir = (typeof window.escapeHtml === 'function') ? window.escapeHtml(kasirNama) : kasirNama;
    var safeMetode = (typeof window.escapeHtml === 'function') ? window.escapeHtml(metode) : metode;

    var fmtGrandTotal = window.formatAppCurrency(grandTotal);
    var fmtSubtotal = window.formatAppCurrency(subtotalCalc || grandTotal);
    var fmtDiskon = window.formatAppCurrency(diskon);
    var fmtPajak = window.formatAppCurrency(pajak);
    var fmtBayar = window.formatAppCurrency(bayarNominal);
    var fmtKembali = window.formatAppCurrency(kembalian);

    var tglText = trx.date || new Date().toLocaleDateString('id-ID');
    if (tglText.indexOf(':') === -1) {
        tglText += ' 14:35 WIB';
    }

    container.innerHTML = 
        '<div class="receipt-header">'
        + '<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAQABAADASIAAhEBAxEB/8QAHgABAAEEAwEBAAAAAAAAAAAAAAEHCAkKAgUGBAP/xABrEAEAAQMDAgMDAwkQDAoGBwkAAQIDBAUGEQcIEiExCUFREyJhFBgZMnGBkZXSFSMzOEJSU1ZXYnSTlrTR0xY0NTdVc3V2obGysxckJTZDWHKCwcMmRFRjZqInRUeDhJLERkhkhZS1wuHx/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAEC/8QAGBEBAQEBAQAAAAAAAAAAAAAAAAERITH/2gAMAwEAAhEDEQA/AMqYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI8/gkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/9k=" alt="Logo" style="width: 50px; height: 50px; object-fit: contain; border-radius: 8px; margin-bottom: 8px;">'
        + '<div class="receipt-brand-name">MAFAZA GROUP</div>'
        + '<div class="receipt-brand-desc">Business Management System</div>'
        + '<div class="receipt-contact-info">'
        + 'Jl. Industri Kreatif No. 88, Jawa Timur<br>'
        + 'Telp / WA: 0822-6866-0396 | IG: @mafazagroup.id'
        + '</div>'
        + '</div>'

        + '<div class="receipt-dashed-line"></div>'

        + '<div class="receipt-meta-grid">'
        + '<div class="receipt-meta-item">'
        + '<span class="receipt-meta-label">No. Transaksi</span>'
        + '<span class="receipt-meta-val" style="font-size:12px; color:#000000;">' + safeOrderNum + '</span>'
        + '</div>'
        + '<div class="receipt-meta-item" style="text-align: right;">'
        + '<span class="receipt-meta-label">Status</span>'
        + '<span class="receipt-meta-val" style="color:' + statusColor + ';">' + statusText + '</span>'
        + '</div>'
        + '<div class="receipt-meta-item">'
        + '<span class="receipt-meta-label">Waktu</span>'
        + '<span class="receipt-meta-val">' + (typeof window.escapeHtml === 'function' ? window.escapeHtml(tglText) : tglText) + '</span>'
        + '</div>'
        + '<div class="receipt-meta-item" style="text-align: right;">'
        + '<span class="receipt-meta-label">Kasir / Petugas</span>'
        + '<span class="receipt-meta-val">' + safeKasir + '</span>'
        + '</div>'
        + '<div class="receipt-meta-item" style="grid-column: span 2; margin-top: 2px;">'
        + '<span class="receipt-meta-label">Pelanggan</span>'
        + '<span class="receipt-meta-val">' + safeCustomer + ' (' + safePhone + ')</span>'
        + '</div>'
        + '</div>'

        + '<div class="receipt-dashed-line"></div>'

        + '<table class="receipt-table">'
        + '<thead>'
        + '<tr>'
        + '<th style="text-align: left;">Rincian Item Produk</th>'
        + '<th style="text-align: right; width: 35%;">Subtotal</th>'
        + '</tr>'
        + '</thead>'
        + '<tbody>'
        + itemsRowsHtml
        + '</tbody>'
        + '</table>'

        + '<div class="receipt-dashed-line"></div>'

        + '<div class="receipt-calc-row">'
        + '<span>Subtotal Belanja</span>'
        + '<span style="font-weight: 700;">' + fmtSubtotal + '</span>'
        + '</div>'
        + (diskon > 0 ? (
            '<div class="receipt-calc-row">'
            + '<span>Diskon Potongan</span>'
            + '<span style="font-weight: 700; color: #000000;">-' + fmtDiskon + '</span>'
            + '</div>'
        ) : '')
        + (pajak > 0 ? (
            '<div class="receipt-calc-row">'
            + '<span>PPN (11%)</span>'
            + '<span style="font-weight: 700;">' + fmtPajak + '</span>'
            + '</div>'
        ) : '')
        
        + '<div class="receipt-grand-total-box">'
        + '<span class="receipt-grand-total-label">TOTAL AKHIR</span>'
        + '<span class="receipt-grand-total-num">' + fmtGrandTotal + '</span>'
        + '</div>'

        + '<div class="receipt-calc-row">'
        + '<span>Metode Pembayaran</span>'
        + '<span style="font-weight: 800; text-transform: uppercase;">' + safeMetode + '</span>'
        + '</div>'
        + (isTunai ? (
            '<div class="receipt-calc-row">'
            + '<span>Jumlah Diterima (Cash)</span>'
            + '<span style="font-weight: 700;">' + fmtBayar + '</span>'
            + '</div>'
            + '<div class="receipt-calc-row">'
            + '<span>Kembalian</span>'
            + '<span style="font-weight: 800; color: #000000;">' + fmtKembali + '</span>'
            + '</div>'
        ) : '')
        + (mode === 'wakil' && trx.isWakil ? (
            '<div class="receipt-dashed-line"></div>'
            + '<div class="receipt-calc-row" style="color: #000000;">'
            + '<span>Komisi Wakil (' + (trx.wakilPersen || 0) + '%)</span>'
            + '<span style="font-weight: 800;">' + window.formatAppCurrency(trx.wakilNominal || 0) + '</span>'
            + '</div>'
            + '<div class="receipt-calc-row" style="color: #000000;">'
            + '<span>Setoran ke Perusahaan</span>'
            + '<span style="font-weight: 800;">' + window.formatAppCurrency(trx.perusahaanNominal || 0) + '</span>'
            + '</div>'
        ) : '')

        + '<div class="receipt-dashed-line"></div>'

        + '<div class="receipt-barcode-wrap">'
        + '<svg class="receipt-barcode-svg" viewBox="0 0 200 38">'
        + '<rect x="0" y="0" width="200" height="38" fill="transparent"/>'
        + '<g fill="#0f172a">'
        + '<rect x="10" y="0" width="3" height="38"/><rect x="15" y="0" width="2" height="38"/><rect x="20" y="0" width="4" height="38"/><rect x="26" y="0" width="1" height="38"/><rect x="30" y="0" width="3" height="38"/><rect x="35" y="0" width="2" height="38"/><rect x="40" y="0" width="5" height="38"/><rect x="47" y="0" width="2" height="38"/><rect x="52" y="0" width="3" height="38"/><rect x="57" y="0" width="4" height="38"/><rect x="63" y="0" width="1" height="38"/><rect x="67" y="0" width="3" height="38"/><rect x="72" y="0" width="5" height="38"/><rect x="80" y="0" width="2" height="38"/><rect x="85" y="0" width="4" height="38"/><rect x="91" y="0" width="1" height="38"/><rect x="95" y="0" width="3" height="38"/><rect x="100" y="0" width="2" height="38"/><rect x="104" y="0" width="5" height="38"/><rect x="111" y="0" width="3" height="38"/><rect x="116" y="0" width="2" height="38"/><rect x="121" y="0" width="4" height="38"/><rect x="127" y="0" width="2" height="38"/><rect x="132" y="0" width="3" height="38"/><rect x="137" y="0" width="5" height="38"/><rect x="144" y="0" width="1" height="38"/><rect x="148" y="0" width="4" height="38"/><rect x="154" y="0" width="2" height="38"/><rect x="158" y="0" width="3" height="38"/><rect x="163" y="0" width="5" height="38"/><rect x="170" y="0" width="2" height="38"/><rect x="175" y="0" width="4" height="38"/><rect x="181" y="0" width="2" height="38"/><rect x="185" y="0" width="3" height="38"/>'
        + '</g>'
        + '</svg>'
        + '<div class="receipt-order-code">* ' + safeTrxId + ' *</div>'
        + '</div>'

        + '<div class="receipt-footer-notes">'
        + '<b>Terima kasih telah berbelanja di Mafaza Group!</b><br>'
        + 'Semoga harimu menyenangkan.<br>'
        + '<small style="color:#777777; font-size: 9.5px;">Powered by Mafaza Group ERP</small>'
        + '</div>';

    var modal = document.getElementById('modalPreviewStruk');
    if (modal) modal.classList.add('active');
};

window.closePreviewStrukModal = function () {
    var modal = document.getElementById('modalPreviewStruk');
    if (modal) modal.classList.remove('active');
};

window.triggerPrintStruk = function () {
    window.print();
};

window.triggerDownloadStrukPdf = function () {
    var container = document.getElementById('printableReceiptArea');
    if (!container) return;
    var trx = window._currentReceiptTrx || {};
    var trxId = trx.id || trx.orderNum || 'Baru';
    if (typeof window.downloadStrukPdf === 'function') {
        window.downloadStrukPdf(container.innerHTML, 'Struk_POS_' + trxId + '.pdf');
    }
};

window.triggerDownloadStrukImage = function () {
    var container = document.getElementById('printableReceiptArea');
    if (!container) return;
    var trx = window._currentReceiptTrx || {};
    var trxId = trx.id || trx.orderNum || 'Baru';
    if (typeof window.downloadStrukImage === 'function') {
        window.downloadStrukImage(container.innerHTML, 'Struk_POS_' + trxId);
    }
};

window.shareStrukWhatsApp = function () {
    var trx = window._currentReceiptTrx;
    if (!trx) return;

    var itemsText = [];
    if (trx.items && Array.isArray(trx.items) && trx.items.length > 0) {
        trx.items.forEach(function (it) {
            var sub = window.formatAppCurrency(it.subtotal);
            itemsText.push('• ' + it.namaProduk + ' (' + it.qty + 'x) : ' + sub);
        });
    } else {
        var sub = window.formatAppCurrency(trx.price);
        itemsText.push('• ' + (trx.category || 'Paket Produk Mafaza Group') + ' (1x) : ' + sub);
    }

    var totalFormatted = window.formatAppCurrency(trx.price || 0);

    var text = '\uD83E\uDDFE *STRUK RESMI - MAFAZA GROUP*\r\n'
        + '━━━━━━━━━━━━━━━━━━━━\r\n'
        + 'No. Nota  : ' + (trx.orderNum || trx.id) + ' (' + trx.id + ')\r\n'
        + 'Tanggal   : ' + (trx.date || '-') + '\r\n'
        + 'Pelanggan : ' + (trx.customer || '-') + '\r\n'
        + 'Metode    : ' + (trx.payment || 'Tunai') + '\r\n'
        + '━━━━━━━━━━━━━━━━━━━━\r\n'
        + '*Rincian Belanja:*\r\n'
        + itemsText.join('\r\n') + '\r\n'
        + '━━━━━━━━━━━━━━━━━━━━\r\n'
        + '*TOTAL BAYAR: ' + totalFormatted + '*\r\n'
        + 'Status    : LUNAS / SELESAI\r\n'
        + '━━━━━━━━━━━━━━━━━━━━\r\n'
        + 'Terima kasih telah berbelanja di Mafaza Group!\r\n'
        + '_Pabrik & Outlet Oleh-Oleh Nusantara_\r\n'
        + 'Kritik & Pemesanan: wa.me/6282268660396';

    var phoneClean = String(trx.phone || '').replace(/[^0-9]/g, '');
    if (phoneClean.startsWith('0')) phoneClean = '62' + phoneClean.slice(1);
    
    var waUrl = (phoneClean.length >= 10) 
        ? ('https://wa.me/' + phoneClean + '?text=' + encodeURIComponent(text))
        : ('https://api.whatsapp.com/send?text=' + encodeURIComponent(text));
    
    if (typeof window.open === 'function') {
        window.open(waUrl, '_blank');
    }
};

window.copyStrukText = function () {
    var trx = window._currentReceiptTrx;
    if (!trx) return;

    var itemsText = [];
    if (trx.items && Array.isArray(trx.items) && trx.items.length > 0) {
        trx.items.forEach(function (it) {
            var sub = window.formatAppCurrency(it.subtotal);
            itemsText.push('• ' + it.namaProduk + ' (' + it.qty + 'x) : ' + sub);
        });
    } else {
        var sub = window.formatAppCurrency(trx.price);
        itemsText.push('• ' + (trx.category || 'Paket Produk Mafaza Group') + ' (1x) : ' + sub);
    }

    var totalFormatted = window.formatAppCurrency(trx.price || 0);

    var text = '\uD83E\uDDFE STRUK RESMI - MAFAZA GROUP\r\n'
        + '------------------------------------\r\n'
        + 'No. Nota  : ' + (trx.orderNum || trx.id) + ' (' + trx.id + ')\r\n'
        + 'Tanggal   : ' + (trx.date || '-') + '\r\n'
        + 'Pelanggan : ' + (trx.customer || '-') + '\r\n'
        + 'Metode    : ' + (trx.payment || 'Tunai') + '\r\n'
        + '------------------------------------\r\n'
        + 'Rincian Belanja:\r\n'
        + itemsText.join('\r\n') + '\r\n'
        + '------------------------------------\r\n'
        + 'TOTAL BAYAR: ' + totalFormatted + '\r\n'
        + 'Status    : LUNAS / SELESAI\r\n'
        + '------------------------------------\r\n'
        + 'Terima kasih telah berbelanja di Mafaza Group!\r\n'
        + 'Pabrik & Outlet Oleh-Oleh Nusantara';

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
            if (typeof window.showToast === 'function') window.showToast('Teks struk berhasil disalin ke clipboard!', 'success');
        }).catch(function () {
            if (typeof window.showToast === 'function') window.showToast('Gagal menyalin teks struk.', 'error');
        });
    } else {
        if (typeof window.showToast === 'function') window.showToast('Teks struk siap disalin.', 'success');
    }
};

