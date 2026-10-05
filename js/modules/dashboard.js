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
        + '<img src="assets/logo.jpg" alt="Logo" style="width: 50px; height: 50px; object-fit: contain; border-radius: 8px; margin-bottom: 8px;">'
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

