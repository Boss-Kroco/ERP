/**
 * ============================================================================
 * BOS KROCO ERP - AGENDA & KALENDER OPERASIONAL
 * File: js/modules/agenda.js
 * ============================================================================
 */

window.AGENDA_STORAGE_KEY = 'bos_kroco_agendas';
window.currentCalendarYear = new Date().getFullYear();
window.currentCalendarMonth = new Date().getMonth(); // 0-11
window.selectedAgendaDateFilter = null; // 'YYYY-MM-DD' or null
window.activeSelectedDate = null; // 'YYYY-MM-DD' for Photo 2 right daily panel
window.currentAgendaTab = 'semua'; // 'semua' | 'hari_ini' | 'pending' | 'completed'
window._reminderIntervalId = null;

var escapeHtml = function (text) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(text);
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Initial Seed Data untuk Operasional Bos Kroco
var DEFAULT_AGENDAS = [
    {
        id: 'AGD-20260909-001',
        title: 'Produksi Batch 4 Keripik Tempe Pedas & Manis',
        category: 'Produksi & HPP',
        date: '2026-09-09',
        startTime: '08:30',
        endTime: '12:00',
        description: 'Target 160 bungkus untuk stok siap jual etalase dan pesanan konsinyasi.',
        reminder: '15_min',
        sendTelegram: true,
        recurring: 'weekly',
        status: 'pending',
        createdAt: '2026-09-08T07:00:00Z'
    },
    {
        id: 'AGD-20260909-002',
        title: 'Pengiriman 60 Bungkus ke Toko Oleh-Oleh Barokah',
        category: 'Pengiriman Mitra',
        date: '2026-09-09',
        startTime: '14:00',
        endTime: '15:30',
        description: 'Antar barang konsinyasi baru via kurir toko dan serahkan bukti tanda terima.',
        reminder: 'on_time',
        sendTelegram: true,
        recurring: 'none',
        status: 'pending',
        createdAt: '2026-09-08T10:00:00Z'
    },
    {
        id: 'AGD-20260910-003',
        title: 'Penagihan Piutang Tempo Barokah Mart (H-1)',
        category: 'Tagih Piutang',
        date: '2026-09-10',
        startTime: '10:00',
        endTime: '11:00',
        description: 'Koleksi tagihan tempo Rp 750.000 atas transaksi konsinyasi periode berjalan.',
        reminder: '1_day',
        sendTelegram: true,
        recurring: 'none',
        status: 'pending',
        createdAt: '2026-09-07T11:00:00Z'
    },
    {
        id: 'AGD-20260908-004',
        title: 'Belanja Bahan Baku Kedelai & Minyak Goreng 20L',
        category: 'Belanja Bahan',
        date: '2026-09-08',
        startTime: '07:30',
        endTime: '09:00',
        description: 'Pembelian langsung ke supplier langganan Pasar Induk, bukti nota disimpan kasir.',
        reminder: 'none',
        sendTelegram: false,
        recurring: 'none',
        status: 'completed',
        createdAt: '2026-09-07T06:00:00Z'
    },
    {
        id: 'AGD-20260912-005',
        title: 'Stock Opname Fisik Rak Etalase & Gudang Bahan',
        category: 'Operasional Toko',
        date: '2026-09-12',
        startTime: '16:00',
        endTime: '17:30',
        description: 'Pencocokan stok riil dengan sistem ERP sebelum tutup buku mingguan.',
        reminder: '1_hour',
        sendTelegram: true,
        recurring: 'weekly',
        status: 'pending',
        createdAt: '2026-09-06T15:00:00Z'
    }
];

window.getStoredAgendas = function () {
    try {
        var raw = localStorage.getItem(window.AGENDA_STORAGE_KEY);
        if (raw) {
            var parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch (e) {
        console.warn('Gagal membaca storage agenda, gunakan default.', e);
    }
    // Simpan default data pertama kali
    localStorage.setItem(window.AGENDA_STORAGE_KEY, JSON.stringify(DEFAULT_AGENDAS));
    return DEFAULT_AGENDAS.slice();
};

window.saveStoredAgendas = function (arr) {
    try {
        localStorage.setItem(window.AGENDA_STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
        console.error('Gagal menyimpan storage agenda:', e);
    }
};

window.currentAgendaViewMode = 'calendar'; // 'calendar' | 'list'

window.initAgendaPage = function () {
    // Sinkronkan bulan kalender ke waktu hari ini jika belum ditentukan
    var now = new Date();
    window.currentCalendarYear = now.getFullYear();
    window.currentCalendarMonth = now.getMonth();
    window.activeSelectedDate = window.getTodayIsoDate();

    // Default ke mode Kalender (Foto 2)
    window.switchAgendaViewMode(window.currentAgendaViewMode || 'calendar');
    window.renderCalendar();
    window.renderDailyActivitiesPanel(window.activeSelectedDate);
    window.renderAgendaStats();
    if (typeof window.renderTodayFocusWidget === 'function') window.renderTodayFocusWidget();
    window.renderAgendaList();

    // Jalankan reminder background loop
    window.startAgendaReminderChecker();
};

// ============================================================================
// MODE SWITCHER (KALENDER GRID BULANAN VS DAFTAR LIST)
// ============================================================================

window.switchAgendaViewMode = function (mode) {
    window.currentAgendaViewMode = mode;
    var calContainer = document.getElementById('agendaCalendarContainer');
    var listContainer = document.getElementById('agendaListContainer');
    var btnCal = document.getElementById('agendaViewBtnCalendar');
    var btnList = document.getElementById('agendaViewBtnList');

    if (mode === 'calendar') {
        if (calContainer) calContainer.style.display = 'grid';
        if (listContainer) listContainer.style.display = 'none';
        if (btnCal) btnCal.classList.add('active');
        if (btnList) btnList.classList.remove('active');
        window.renderCalendar();
        if (typeof window.renderDailyActivitiesPanel === 'function') {
            window.renderDailyActivitiesPanel(window.activeSelectedDate);
        }
    } else {
        if (calContainer) calContainer.style.display = 'none';
        if (listContainer) listContainer.style.display = 'block';
        if (btnCal) btnCal.classList.remove('active');
        if (btnList) btnList.classList.add('active');
        window.renderAgendaList();
    }
};

window.onAgendaFilterChange = function () {
    window.renderCalendar();
    window.renderDailyActivitiesPanel(window.activeSelectedDate);
    window.renderAgendaList();
};

window.resetAgendaFilters = function () {
    var q = document.getElementById('agendaSearchInput');
    var c = document.getElementById('agendaCategoryFilter');
    if (q) q.value = '';
    if (c) c.value = '';
    window.selectedAgendaDateFilter = null;
    var bBox = document.getElementById('calendarActiveFilterBox');
    if (bBox) bBox.style.display = 'none';
    window.renderCalendar();
    window.renderDailyActivitiesPanel(window.activeSelectedDate);
    window.renderAgendaList();
};

// ============================================================================
// TATA LETAK FOTO 2: KALENDER DENGAN INDIKATOR BAR + PANEL AKTIVITAS HARIAN
// ============================================================================

window.getCategoryDotClass = function (cat) {
    if (!cat) return 'cat-lainnya';
    if (cat.indexOf('Produksi') !== -1) return 'cat-produksi';
    if (cat.indexOf('Pengiriman') !== -1) return 'cat-pengiriman';
    if (cat.indexOf('Piutang') !== -1 || cat.indexOf('Kas') !== -1) return 'cat-piutang';
    if (cat.indexOf('Belanja') !== -1) return 'cat-piutang';
    return 'cat-lainnya';
};

window.getCategoryAccentColor = function (cat) {
    if (!cat) return '#8b5cf6';
    if (cat.indexOf('Produksi') !== -1) return '#ea580c';
    if (cat.indexOf('Pengiriman') !== -1) return '#2563eb';
    if (cat.indexOf('Piutang') !== -1 || cat.indexOf('Kas') !== -1) return '#16a34a';
    if (cat.indexOf('Belanja') !== -1) return '#0891b2';
    if (cat.indexOf('Operasional') !== -1) return '#8b5cf6';
    return '#6c47ff';
};

window.renderCalendar = function () {
    var titleEl = document.getElementById('calendarMonthYearTitle');
    var gridEl = document.getElementById('calendarDaysGrid');
    if (!titleEl || !gridEl) return;

    var monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    titleEl.textContent = monthNames[window.currentCalendarMonth] + ' ' + window.currentCalendarYear;

    gridEl.innerHTML = '';

    // Hitung hari pertama dan total hari dalam bulan ini
    var firstDayIndex = new Date(window.currentCalendarYear, window.currentCalendarMonth, 1).getDay(); // 0 = Minggu
    var daysInMonth = new Date(window.currentCalendarYear, window.currentCalendarMonth + 1, 0).getDate();
    var prevMonthDays = new Date(window.currentCalendarYear, window.currentCalendarMonth, 0).getDate();

    var agendas = window.getStoredAgendas();
    var queryEl = document.getElementById('agendaSearchInput');
    var query = (queryEl && queryEl.value ? queryEl.value : '').toLowerCase().trim();
    var catEl = document.getElementById('agendaCategoryFilter');
    var catFilter = (catEl && catEl.value ? catEl.value : '');

    // Pemetaan tanggal -> list agenda
    var dateAgendaMap = {};
    agendas.forEach(function (ag) {
        if (catFilter && ag.category !== catFilter) return;
        if (query) {
            var fullText = ((ag.title || '') + ' ' + (ag.description || '') + ' ' + (ag.category || '')).toLowerCase();
            if (fullText.indexOf(query) === -1) return;
        }
        if (!dateAgendaMap[ag.date]) dateAgendaMap[ag.date] = [];
        dateAgendaMap[ag.date].push(ag);
    });

    var todayStr = window.getTodayIsoDate();
    if (!window.activeSelectedDate) window.activeSelectedDate = todayStr;

    // 1. Sel hari dari bulan sebelumnya (Foto 2: kosong / blank)
    for (var i = firstDayIndex - 1; i >= 0; i--) {
        var pCell = document.createElement('div');
        pCell.className = 'photo2-day-cell other-month';
        gridEl.appendChild(pCell);
    }

    // 2. Sel hari bulan aktif (Foto 2: Rounded cell dengan bar strip indikator horizontal di bawah angka)
    for (var day = 1; day <= daysInMonth; day++) {
        var dayStr = ('0' + day).slice(-2);
        var mStr = ('0' + (window.currentCalendarMonth + 1)).slice(-2);
        var isoDate = window.currentCalendarYear + '-' + mStr + '-' + dayStr;

        var cell = document.createElement('div');
        cell.className = 'photo2-day-cell';
        if (isoDate === todayStr) cell.classList.add('current-day');
        if (isoDate === window.activeSelectedDate) cell.classList.add('active-selected');

        var numSpan = document.createElement('span');
        numSpan.className = 'photo2-day-num';
        numSpan.textContent = day;
        cell.appendChild(numSpan);

        var dayAgendas = dateAgendaMap[isoDate] || [];
        dayAgendas.sort(function (a, b) {
            return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
        });

        // Kontainer baris indikator warna di bawah tanggal (Foto 2)
        var indicatorsBox = document.createElement('div');
        indicatorsBox.className = 'photo2-day-indicators cal-day-events';

        var maxBars = 3;
        var visibleAgendas = dayAgendas.slice(0, maxBars);

        visibleAgendas.forEach(function (ag) {
            var bar = document.createElement('span');
            var cClass = window.getCategoryDotClass(ag.category);
            var isComp = (ag.status === 'completed');

            bar.className = 'photo2-indicator-line ' + cClass + (isComp ? ' is-completed' : '');
            bar.title = (ag.startTime ? ag.startTime + ' - ' : '') + ag.title + (isComp ? ' (Selesai)' : '');

            (function (aId) {
                bar.onclick = function (e) {
                    e.stopPropagation();
                    window.openAgendaDetailModal(aId);
                };
            })(ag.id);

            indicatorsBox.appendChild(bar);
        });

        cell.appendChild(indicatorsBox);

        // Klik sel: aktifkan tanggal ini dan perbarui panel aktivitas harian
        (function (dIso) {
            cell.onclick = function () {
                window.activeSelectedDate = dIso;
                window.renderCalendar();
                window.renderDailyActivitiesPanel(dIso);
            };
        })(isoDate);

        gridEl.appendChild(cell);
    }

    // 3. Sel hari bulan berikutnya agar genap kelipatan 7 (Foto 2: kosong / blank)
    var totalRendered = firstDayIndex + daysInMonth;
    var nextDays = (totalRendered % 7 === 0) ? 0 : 7 - (totalRendered % 7);
    for (var n = 1; n <= nextDays; n++) {
        var nCell = document.createElement('div');
        nCell.className = 'photo2-day-cell other-month';
        gridEl.appendChild(nCell);
    }
};

// ============================================================================
// PANEL AKTIVITAS HARIAN (KOLOM KANAN FOTO 2)
// ============================================================================

window.renderDailyActivitiesPanel = function (isoDate) {
    if (!isoDate) isoDate = window.activeSelectedDate || window.getTodayIsoDate();
    window.activeSelectedDate = isoDate;

    var titleEl = document.getElementById('agendaDailyPanelDateTitle');
    var countEl = document.getElementById('agendaDailyActivitiesCount');
    var noteEl = document.getElementById('agendaDailyQuickNoteInput');
    var listEl = document.getElementById('agendaDailyActivitiesList');

    if (titleEl) {
        titleEl.textContent = window.formatDateFullIndo(isoDate);
    }

    if (noteEl) {
        var savedNote = localStorage.getItem('bos_kroco_note_' + isoDate) || '';
        noteEl.value = savedNote;
    }

    var agendas = window.getStoredAgendas();
    var queryEl = document.getElementById('agendaSearchInput');
    var query = (queryEl && queryEl.value ? queryEl.value : '').toLowerCase().trim();
    var catEl = document.getElementById('agendaCategoryFilter');
    var catFilter = (catEl && catEl.value ? catEl.value : '');

    var dayAgendas = agendas.filter(function (a) {
        if (a.date !== isoDate) return false;
        if (catFilter && a.category !== catFilter) return false;
        if (query) {
            var fullText = ((a.title || '') + ' ' + (a.description || '') + ' ' + (a.category || '')).toLowerCase();
            if (fullText.indexOf(query) === -1) return false;
        }
        return true;
    });

    dayAgendas.sort(function (a, b) {
        return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
    });

    if (countEl) {
        countEl.textContent = dayAgendas.length;
    }

    if (!listEl) return;
    listEl.innerHTML = '';

    if (dayAgendas.length === 0) {
        listEl.innerHTML = '<div class="photo2-empty-state">'
            + '<div class="photo2-empty-icon">'
            + '<svg class="svg-icon-sm" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
            + '</div>'
            + '<div class="photo2-empty-title">Tidak Ada Kegiatan Terjadwal</div>'
            + '<div class="photo2-empty-desc">Belum ada jadwal untuk tanggal ini. Klik "Tambah Kegiatan" untuk membuat agenda baru.</div>'
            + '</div>';
        return;
    }

    // Format simpel / pendek: Jam, Kategori, Judul, Arrow (Klik buka modal rincian lengkap)
    dayAgendas.forEach(function (ag) {
        var item = document.createElement('div');
        var isComp = (ag.status === 'completed');
        var accentColor = window.getCategoryAccentColor(ag.category);
        var dotClass = window.getCategoryDotClass(ag.category);

        item.className = 'photo2-activity-item' + (isComp ? ' completed' : '');
        if (item.style && typeof item.style.setProperty === 'function') {
            item.style.setProperty('--item-accent', accentColor);
        } else if (item.style) {
            item.style['--item-accent'] = accentColor;
        }
        item.title = 'Klik untuk melihat rincian lengkap & instruksi kegiatan';

        var timeStr = ag.startTime ? ag.startTime + (ag.endTime ? ' - ' + ag.endTime : '') + ' WIB' : 'Waktu Fleksibel';

        item.innerHTML = '<div class="photo2-item-left">'
            + '<div class="photo2-item-time-row">'
            + '<span>' + timeStr + '</span>'
            + '<span>•</span>'
            + '<span class="photo2-item-cat-badge ' + dotClass + '">' + escapeHtml(ag.category || 'Lainnya') + '</span>'
            + (isComp ? '<span class="photo2-item-completed-badge">✓ Selesai</span>' : '')
            + '</div>'
            + '<div class="photo2-item-title">' + escapeHtml(ag.title) + '</div>'
            + '</div>'
            + '<div class="photo2-item-right">'
            + '<svg class="svg-icon-xs photo2-item-arrow" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>'
            + '</div>';

        // Pas di-klik baru kebuka isinya lengkap (Modal Rincian Lengkap)
        (function (aId) {
            item.onclick = function () {
                window.openAgendaDetailModal(aId);
            };
        })(ag.id);

        listEl.appendChild(item);
    });
};

window.saveDailyOperationalNote = function () {
    var noteEl = document.getElementById('agendaDailyQuickNoteInput');
    if (!noteEl) return;
    var iso = window.activeSelectedDate || window.getTodayIsoDate();
    localStorage.setItem('bos_kroco_note_' + iso, noteEl.value);
    if (window.showToast) {
        window.showToast('Catatan operasional harian disimpan.', 'success');
    }
};

window.openAgendaFormModalWithSelectedDate = function () {
    var iso = window.activeSelectedDate || window.getTodayIsoDate();
    window.openAgendaFormModalWithDate(iso);
};

window.prevCalendarMonth = function () {
    window.currentCalendarMonth--;
    if (window.currentCalendarMonth < 0) {
        window.currentCalendarMonth = 11;
        window.currentCalendarYear--;
    }
    window.renderCalendar();
};

window.nextCalendarMonth = function () {
    window.currentCalendarMonth++;
    if (window.currentCalendarMonth > 11) {
        window.currentCalendarMonth = 0;
        window.currentCalendarYear++;
    }
    window.renderCalendar();
};

window.goToTodayCalendar = function () {
    var now = new Date();
    window.currentCalendarYear = now.getFullYear();
    window.currentCalendarMonth = now.getMonth();
    window.activeSelectedDate = window.getTodayIsoDate();
    window.selectedAgendaDateFilter = null;

    var bBox = document.getElementById('calendarActiveFilterBox');
    if (bBox) bBox.style.display = 'none';

    window.renderCalendar();
    window.renderDailyActivitiesPanel(window.activeSelectedDate);
    window.renderAgendaList();
};

window.selectCalendarDate = function (isoDate) {
    window.activeSelectedDate = isoDate;
    window.renderCalendar();
    window.renderDailyActivitiesPanel(isoDate);
};

window.clearCalendarDateFilter = function () {
    window.selectedAgendaDateFilter = null;
    var bBox = document.getElementById('calendarActiveFilterBox');
    if (bBox) bBox.style.display = 'none';
    window.renderCalendar();
    window.renderDailyActivitiesPanel(window.activeSelectedDate);
    window.renderAgendaList();
};

// ============================================================================
// MODAL RINCIAN KEGIATAN (SOLUSI 3: PAS DI-KLIK MUNCUL RINCIANNYA)
// ============================================================================

window.openAgendaDetailModal = function (agendaId) {
    var modal = document.getElementById('modalAgendaDetail');
    if (!modal) return;

    var agendas = window.getStoredAgendas();
    var ag = agendas.find(function (a) { return a.id === agendaId; });
    if (!ag) return;

    var todayStr = window.getTodayIsoDate();
    var isCompleted = (ag.status === 'completed');
    var isToday = (ag.date === todayStr);
    var isOverdue = (!isCompleted && ag.date < todayStr);

    // Set Hidden ID
    var idInput = document.getElementById('agendaDetailId');
    if (idInput) idInput.value = ag.id;

    // Set Title
    var titleEl = document.getElementById('agendaDetailTitle');
    if (titleEl) {
        titleEl.textContent = ag.title;
        titleEl.style.textDecoration = isCompleted ? 'line-through' : 'none';
        titleEl.style.color = isCompleted ? '#94a3b8' : 'var(--text-main)';
    }

    // Set Category Badge
    var catBadge = document.getElementById('agendaDetailCatBadge');
    if (catBadge) {
        var theme = window.getCategoryTheme(ag.category);
        catBadge.textContent = ag.category;
        catBadge.style.background = theme.bg;
        catBadge.style.color = theme.color;
        catBadge.style.border = '1px solid ' + theme.border;
    }

    // Set Status Pill
    var statusPill = document.getElementById('agendaDetailStatusPill');
    if (statusPill) {
        if (isCompleted) {
            statusPill.className = 'agenda-status-pill pill-done';
            statusPill.innerHTML = '<svg class="svg-icon-xs" viewBox="0 0 24 24" style="width:11px;height:11px;"><polyline points="20 6 9 17 4 12"/></svg> Selesai';
        } else if (isToday) {
            statusPill.className = 'agenda-status-pill pill-today';
            statusPill.innerHTML = '<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:currentColor;"></span> Hari Ini';
        } else if (isOverdue) {
            statusPill.className = 'agenda-status-pill pill-overdue';
            statusPill.innerHTML = '<svg class="svg-icon-xs" viewBox="0 0 24 24" style="width:11px;height:11px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Terlewat';
        } else {
            statusPill.className = 'agenda-status-pill';
            statusPill.style.background = '#f1f5f9';
            statusPill.style.color = '#475569';
            statusPill.textContent = 'Belum Selesai';
        }
    }

    // Set Date & Time
    var dtEl = document.getElementById('agendaDetailDateTime');
    if (dtEl) {
        var dayFull = window.formatDateFullIndo(ag.date);
        var timeStr = (ag.startTime ? ag.startTime : '00:00') + (ag.endTime ? ' - ' + ag.endTime : '') + ' WIB';
        dtEl.textContent = dayFull + ' • ' + timeStr;
    }

    // Set Description Box
    var descEl = document.getElementById('agendaDetailDescription');
    if (descEl) {
        descEl.textContent = ag.description ? ag.description : '(Tidak ada instruksi atau catatan khusus untuk kegiatan ini)';
    }

    // Set Reminder Text
    var remEl = document.getElementById('agendaDetailReminderText');
    if (remEl) {
        var remMap = {
            'none': 'Tidak Ada Pengingat',
            'on_time': 'Tepat Waktu Pelaksanaan',
            '15_min': '15 Menit Sebelumnya',
            '1_hour': '1 Jam Sebelumnya',
            '1_day': '1 Hari Sebelumnya'
        };
        remEl.textContent = remMap[ag.reminder] || ag.reminder;
    }

    // Set Telegram Text
    var telEl = document.getElementById('agendaDetailTelegramText');
    if (telEl) {
        telEl.textContent = ag.sendTelegram ? 'Notifikasi Aktif' : 'Tidak Dikirim';
    }

    // Set Recurring Info
    var recRow = document.getElementById('agendaDetailRecurringRow');
    var recText = document.getElementById('agendaDetailRecurringText');
    if (recRow && recText) {
        if (ag.recurring && ag.recurring !== 'none') {
            var rMap = { 'daily': 'Harian (Setiap Hari)', 'weekly': 'Mingguan (Setiap Minggu)', 'monthly': 'Bulanan (Setiap Bulan)' };
            recText.textContent = rMap[ag.recurring] || ag.recurring;
            recRow.style.display = 'flex';
        } else {
            recText.textContent = 'Tidak Berulang (Sekali Saja)';
            recRow.style.display = 'flex';
        }
    }

    // Set Toggle Button Text
    var toggleBtn = document.getElementById('agendaDetailToggleStatusBtn');
    var toggleText = document.getElementById('agendaDetailToggleStatusText');
    if (toggleBtn && toggleText) {
        if (isCompleted) {
            toggleText.textContent = 'Tandai Belum Selesai';
            toggleBtn.className = 'btn-pill-action btn-pill-secondary';
        } else {
            toggleText.textContent = 'Tandai Selesai';
            toggleBtn.className = 'btn-pill-action btn-pill-primary';
        }
    }

    modal.classList.add('active');
};

window.closeAgendaDetailModal = function () {
    var modal = document.getElementById('modalAgendaDetail');
    if (modal) modal.classList.remove('active');
};

window.toggleAgendaStatusFromDetail = function () {
    var idInput = document.getElementById('agendaDetailId');
    if (!idInput || !idInput.value) return;
    var agendaId = idInput.value;

    window.toggleAgendaStatus(agendaId);
    // Refresh modal isi detailnya
    window.openAgendaDetailModal(agendaId);
};

window.editAgendaFromDetail = function () {
    var idInput = document.getElementById('agendaDetailId');
    if (!idInput || !idInput.value) return;
    var agendaId = idInput.value;

    window.closeAgendaDetailModal();
    window.openAgendaFormModal(agendaId);
};

window.deleteAgendaFromDetail = function () {
    var idInput = document.getElementById('agendaDetailId');
    if (!idInput || !idInput.value) return;
    var agendaId = idInput.value;

    window.closeAgendaDetailModal();
    window.deleteAgenda(agendaId);
};

// ============================================================================
// MODAL DAFTAR AGENDA HARIAN
// ============================================================================

window.currentDayModalIso = null;

window.openDayAgendaModal = function (isoDate) {
    window.currentDayModalIso = isoDate;
    var modal = document.getElementById('modalAgendaDayList');
    var titleEl = document.getElementById('agendaDayModalTitle');
    var listEl = document.getElementById('agendaDayModalItemsList');
    if (!modal) return;

    if (titleEl) {
        titleEl.textContent = 'Agenda ' + window.formatDateFullIndo(isoDate);
    }

    var agendas = window.getStoredAgendas();
    var dayItems = agendas.filter(function (a) { return a.date === isoDate; });

    // Urutkan per jam
    dayItems.sort(function (a, b) {
        return (a.startTime || '00:00').localeCompare(b.startTime || '00:00');
    });

    if (listEl) {
        listEl.innerHTML = '';
        if (dayItems.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding: 24px 10px; color: var(--text-muted); font-size: 13px;">'
                + 'Belum ada agenda pada tanggal ini.<br>'
                + '<span style="font-size: 11.5px; opacity: 0.8;">Klik tombol di atas untuk membuat jadwal kegiatan baru.</span>'
                + '</div>';
        } else {
            dayItems.forEach(function (ag) {
                var itemCard = document.createElement('div');
                var isCompleted = (ag.status === 'completed');
                itemCard.className = 'agenda-day-item-card ' + (isCompleted ? 'completed' : '');

                var cTheme = window.getCategoryTheme(ag.category);
                var timeStr = (ag.startTime ? ag.startTime : '00:00') + (ag.endTime ? ' - ' + ag.endTime : '') + ' WIB';

                itemCard.innerHTML = '<div style="display:flex; align-items:center; gap:10px; min-width:0;">'
                    + '<span style="width:8px; height:8px; border-radius:50%; background:' + cTheme.color + '; flex-shrink:0;"></span>'
                    + '<div style="min-width:0;">'
                    + '<div style="font-size:13.5px; font-weight:750; color:' + (isCompleted ? '#94a3b8' : 'var(--text-main)') + '; ' + (isCompleted ? 'text-decoration:line-through;' : '') + ' overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + escapeHtml(ag.title) + '</div>'
                    + '<div style="font-size:11px; color:#64748b; margin-top:2px;">' + timeStr + ' • <span style="color:' + cTheme.color + '; font-weight:600;">' + escapeHtml(ag.category) + '</span></div>'
                    + '</div>'
                    + '</div>'
                    + '<div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">'
                    + (isCompleted ? '<span class="agenda-status-pill pill-done" style="font-size:9.5px;">Selesai</span>' : '<span class="agenda-status-pill" style="font-size:9.5px; background:#f1f5f9; color:#475569;">Belum</span>')
                    + '<svg class="svg-icon-xs" viewBox="0 0 24 24" style="color:#94a3b8;"><polyline points="9 18 15 12 9 6"/></svg>'
                    + '</div>';

                (function (aId) {
                    itemCard.onclick = function () {
                        window.closeDayAgendaModal();
                        window.openAgendaDetailModal(aId);
                    };
                })(ag.id);

                listEl.appendChild(itemCard);
            });
        }
    }

    modal.classList.add('active');
};

window.closeDayAgendaModal = function () {
    var modal = document.getElementById('modalAgendaDayList');
    if (modal) modal.classList.remove('active');
};

window.addNewAgendaFromDayModal = function () {
    var iso = window.currentDayModalIso || window.getTodayIsoDate();
    window.closeDayAgendaModal();
    window.openAgendaFormModalWithDate(iso);
};

window.openAgendaFormModalWithDate = function (isoDate) {
    window.openAgendaFormModal(null);
    var dInput = document.getElementById('agendaInputDate');
    if (dInput && isoDate) {
        dInput.value = isoDate;
    }
};

// ============================================================================
// STATISTIK & DAFTAR KARTU AGENDA
// ============================================================================

window.renderAgendaStats = function () {
    var agendas = window.getStoredAgendas();
    var todayStr = window.getTodayIsoDate();

    var total = agendas.length;
    var today = agendas.filter(function (a) { return a.date === todayStr; }).length;
    var pending = agendas.filter(function (a) { return a.status !== 'completed'; }).length;
    var completed = agendas.filter(function (a) { return a.status === 'completed'; }).length;

    var elTotal = document.getElementById('agendaStatTotal');
    var elToday = document.getElementById('agendaStatToday');
    var elPending = document.getElementById('agendaStatPending');
    var elCompleted = document.getElementById('agendaStatCompleted');

    if (elTotal) elTotal.textContent = total;
    if (elToday) elToday.textContent = today;
    if (elPending) elPending.textContent = pending;
    if (elCompleted) elCompleted.textContent = completed;

    // Update tab badges
    var elTabSemua = document.getElementById('tabCountSemua');
    var elTabToday = document.getElementById('tabCountToday');
    var elTabPending = document.getElementById('tabCountPending');
    var elTabCompleted = document.getElementById('tabCountCompleted');

    if (elTabSemua) elTabSemua.textContent = total;
    if (elTabToday) elTabToday.textContent = today;
    if (elTabPending) elTabPending.textContent = pending;
    if (elTabCompleted) elTabCompleted.textContent = completed;
};

window.switchAgendaTab = function (tab) {
    window.currentAgendaTab = tab;
    var tabs = document.querySelectorAll('.agenda-tab-btn');
    tabs.forEach(function (btn) {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tab) btn.classList.add('active');
    });
    window.renderAgendaList();
};

window.filterAgendaList = function () {
    window.renderAgendaList();
};

window.renderAgendaList = function () {
    var container = document.getElementById('agendaCardsContainer');
    if (!container) return;

    var agendas = window.getStoredAgendas();
    var queryEl = document.getElementById('agendaSearchInput');
    var query = (queryEl && queryEl.value ? queryEl.value : '').toLowerCase().trim();
    var catEl = document.getElementById('agendaCategoryFilter');
    var catFilter = (catEl && catEl.value ? catEl.value : '');
    var todayStr = window.getTodayIsoDate();

    // 1. Urutkan Prioritas:
    //    Rank 1: Hari Ini & Belum Selesai (Paling Mendesak)
    //    Rank 2: Akan Datang & Belum Selesai (Future Pending)
    //    Rank 3: Lewat Jatuh Tempo & Belum Selesai (Overdue Pending)
    //    Rank 4: Telah Selesai (Selesai dipindahkan ke bawah agar tidak menutupi tugas aktif)
    agendas.sort(function (a, b) {
        var getRank = function (item) {
            if (item.status === 'completed') return 4;
            if (item.date === todayStr) return 1;
            if (item.date > todayStr) return 2;
            return 3;
        };
        var rankA = getRank(a);
        var rankB = getRank(b);
        if (rankA !== rankB) return rankA - rankB;

        var tA = (a.date || '') + ' ' + (a.startTime || '00:00');
        var tB = (b.date || '') + ' ' + (b.startTime || '00:00');
        if (rankA === 4) {
            // Tugas selesai diurutkan dari yang paling baru
            return tB.localeCompare(tA);
        }
        return tA.localeCompare(tB);
    });

    // 2. Filter Tab
    var filtered = agendas.filter(function (item) {
        if (window.currentAgendaTab === 'hari_ini' && item.date !== todayStr) return false;
        if (window.currentAgendaTab === 'pending' && item.status === 'completed') return false;
        if (window.currentAgendaTab === 'completed' && item.status !== 'completed') return false;

        // Filter tanggal kalender
        if (window.selectedAgendaDateFilter && item.date !== window.selectedAgendaDateFilter) return false;

        // Filter kategori dropdown
        if (catFilter && item.category !== catFilter) return false;

        // Filter search input
        if (query) {
            var fullText = ((item.title || '') + ' ' + (item.description || '') + ' ' + (item.category || '')).toLowerCase();
            if (fullText.indexOf(query) === -1) return false;
        }

        return true;
    });

    container.innerHTML = '';

    if (filtered.length === 0) {
        container.innerHTML = '<div class="agenda-empty-state">'
            + '<div class="agenda-empty-icon-box">'
            + '<svg class="svg-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
            + '</div>'
            + '<div class="agenda-empty-title">Tidak Ada Agenda Ditemukan</div>'
            + '<p class="agenda-empty-sub">Tidak ada kegiatan operasional yang sesuai dengan kriteria filter saat ini.</p>'
            + '<button type="button" class="btn-pill-action btn-pill-primary" onclick="openAgendaFormModal()">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
            + '<span>Tambah Agenda Baru</span>'
            + '</button>'
            + '</div>';
        return;
    }

    filtered.forEach(function (ag) {
        var isCompleted = (ag.status === 'completed');
        var isToday = (ag.date === todayStr);
        var isOverdue = (!isCompleted && ag.date < todayStr);

        var card = document.createElement('div');
        var catTheme = window.getCategoryTheme(ag.category);

        card.className = 'agenda-item-card ' + (isCompleted ? 'completed' : '') + ' ' + (isToday ? 'is-today' : '');
        if (card.style && typeof card.style.setProperty === 'function') {
            card.style.setProperty('--cat-accent', catTheme.color);
        } else {
            card.style = card.style || {};
            card.style['--cat-accent'] = catTheme.color;
        }

        var timeLabel = (ag.startTime ? ag.startTime : '00:00') + (ag.endTime ? ' - ' + ag.endTime : '') + ' WIB';
        var dateFormatted = window.formatDateIndo(ag.date);

        // Timeline items
        var recurringSnippet = '';
        if (ag.recurring && ag.recurring !== 'none') {
            var recLabel = { 'daily': 'Harian', 'weekly': 'Mingguan', 'monthly': 'Bulanan' }[ag.recurring] || ag.recurring;
            recurringSnippet = '<span class="agenda-timeline-sep">•</span>'
                + '<span class="agenda-timeline-item" title="Agenda Berulang: ' + recLabel + '">'
                + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>'
                + '<span>' + recLabel + '</span></span>';
        }

        var reminderSnippet = '';
        if (ag.reminder && ag.reminder !== 'none') {
            var remMap = {
                'on_time': 'Tepat Waktu',
                '15_min': '15 mnt sblm',
                '1_hour': '1 jam sblm',
                '1_day': '1 hari sblm'
            };
            var rText = remMap[ag.reminder] || ag.reminder;
            reminderSnippet = '<span class="agenda-timeline-sep">•</span>'
                + '<span class="agenda-timeline-item" title="Pengingat: ' + rText + '">'
                + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
                + '<span>' + rText + '</span></span>';
        }

        var telegramSnippet = '';
        if (ag.sendTelegram) {
            telegramSnippet = '<span class="agenda-timeline-sep">•</span>'
                + '<span class="agenda-timeline-item" title="Notifikasi Bot Telegram Aktif">'
                + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
                + '<span>Telegram</span></span>';
        }

        // Status Badges
        var statusBadge = '';
        if (isCompleted) {
            statusBadge = '<span class="agenda-status-pill pill-done"><svg class="svg-icon-xs" viewBox="0 0 24 24" style="width:11px; height:11px;"><polyline points="20 6 9 17 4 12"/></svg> Selesai</span>';
        } else if (isToday) {
            statusBadge = '<span class="agenda-status-pill pill-today">Hari Ini</span>';
        } else if (isOverdue) {
            statusBadge = '<span class="agenda-status-pill pill-overdue">Terlewat</span>';
        }

        card.innerHTML = '<div class="agenda-card-body-row">'
            // Checkbox Interaktif Modern
            + '<button type="button" class="agenda-custom-checkbox ' + (isCompleted ? 'checked' : '') + '" onclick="toggleAgendaStatus(\'' + ag.id + '\')" title="' + (isCompleted ? 'Tandai belum selesai' : 'Tandai kegiatan selesai') + '">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>'
            + '</button>'
            // Konten Utama Kartu
            + '<div class="agenda-card-center">'
            + '<div class="agenda-card-title-row">'
            + '<span class="agenda-title-text" onclick="openAgendaFormModal(\'' + ag.id + '\')" title="Klik untuk edit detail agenda">' + escapeHtml(ag.title) + '</span>'
            + '<span class="agenda-badge-cat" style="background:' + catTheme.bg + '; color:' + catTheme.color + '; border: 1px solid ' + catTheme.border + ';">'
            + '<span class="cal-legend-dot" style="background:' + catTheme.color + '; width:6px; height:6px;"></span> '
            + escapeHtml(catTheme.label) + '</span>'
            + statusBadge
            + '</div>'
            // Catatan Deskripsi dalam Kotak Modern yang Rapi & Jelas
            + (ag.description ? '<div class="agenda-desc-box">'
                + '<svg class="svg-icon-xs agenda-desc-box-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
                + '<span>' + escapeHtml(ag.description) + '</span></div>' : '')
            // Strip Timeline Monokrom yang Tenang & Elegan
            + '<div class="agenda-timeline-strip">'
            + '<span class="agenda-timeline-item" title="Waktu pelaksanaan">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
            + '<span>' + dateFormatted + ' • ' + timeLabel + '</span>'
            + '</span>'
            + reminderSnippet
            + telegramSnippet
            + recurringSnippet
            + '</div>'
            + '</div>'
            // Tombol Tindakan (Edit & Hapus)
            + '<div class="agenda-card-actions">'
            + '<button type="button" class="agenda-action-btn edit" onclick="openAgendaFormModal(\'' + ag.id + '\')" title="Edit Agenda">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
            + '</button>'
            + '<button type="button" class="agenda-action-btn delete" onclick="deleteAgenda(\'' + ag.id + '\')" title="Hapus Agenda">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>'
            + '</button>'
            + '</div>'
            + '</div>';

        container.appendChild(card);
    });
};

// ============================================================================
// WIDGET FOKUS HARI INI & PINTASAN KATEGORI (KOLOM KIRI STICKY)
// ============================================================================

window.renderTodayFocusWidget = function () {
    var container = document.getElementById('agendaTodayFocusContainer');
    var datePill = document.getElementById('agendaFocusTodayDate');
    if (!container) return;

    var todayStr = window.getTodayIsoDate();
    if (datePill) {
        var now = new Date();
        var d = now.getDate();
        var mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        datePill.textContent = ('0' + d).slice(-2) + ' ' + mNames[now.getMonth()];
    }

    var agendas = window.getStoredAgendas();
    var todayItems = agendas.filter(function (a) { return a.date === todayStr; });

    // Urutkan: pending duluan, lalu berdasarkan jam
    todayItems.sort(function (a, b) {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        var tA = a.startTime || '00:00';
        var tB = b.startTime || '00:00';
        return tA.localeCompare(tB);
    });

    if (todayItems.length === 0) {
        container.innerHTML = '<div class="agenda-focus-empty">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>'
            + '<span>Tidak ada jadwal kegiatan hari ini.</span>'
            + '</div>';
        return;
    }

    var html = '';
    todayItems.forEach(function (ag) {
        var isCompleted = (ag.status === 'completed');
        var timeLabel = (ag.startTime ? ag.startTime : '00:00') + (ag.endTime ? ' - ' + ag.endTime : '') + ' WIB';
        var catStyle = window.getCategoryBadgeStyle(ag.category);

        html += '<div class="agenda-focus-item ' + (isCompleted ? 'completed' : '') + '">'
            + '<button type="button" class="agenda-custom-checkbox mini ' + (isCompleted ? 'checked' : '') + '" onclick="toggleAgendaStatus(\'' + ag.id + '\')" title="' + (isCompleted ? 'Tandai belum selesai' : 'Tandai selesai') + '">'
            + '<svg class="svg-icon-xs" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>'
            + '</button>'
            + '<div class="agenda-focus-item-content" onclick="openAgendaFormModal(\'' + ag.id + '\')" title="Klik untuk edit agenda">'
            + '<div class="agenda-focus-item-title">' + escapeHtml(ag.title) + '</div>'
            + '<div class="agenda-focus-item-meta">'
            + '<span class="agenda-focus-cat-dot" style="background:' + catStyle.color + '"></span>'
            + '<span>' + timeLabel + '</span>'
            + '</div>'
            + '</div>'
            + '</div>';
    });

    container.innerHTML = html;
};

window.getCategoryTheme = function (cat) {
    if (!cat) return {
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.08)',
        border: 'rgba(139, 92, 246, 0.22)',
        dotClass: 'cat-lainnya',
        label: 'Operasional'
    };
    if (cat.indexOf('Produksi') !== -1) return {
        color: '#ea580c',
        bg: 'rgba(234, 88, 12, 0.08)',
        border: 'rgba(234, 88, 12, 0.22)',
        dotClass: 'cat-produksi',
        label: cat
    };
    if (cat.indexOf('Pengiriman') !== -1) return {
        color: '#2563eb',
        bg: 'rgba(37, 99, 235, 0.08)',
        border: 'rgba(37, 99, 235, 0.22)',
        dotClass: 'cat-pengiriman',
        label: cat
    };
    if (cat.indexOf('Piutang') !== -1) return {
        color: '#dc2626',
        bg: 'rgba(220, 38, 38, 0.08)',
        border: 'rgba(220, 38, 38, 0.22)',
        dotClass: 'cat-piutang',
        label: cat
    };
    if (cat.indexOf('Belanja') !== -1) return {
        color: '#16a34a',
        bg: 'rgba(22, 163, 74, 0.08)',
        border: 'rgba(22, 163, 74, 0.22)',
        dotClass: 'cat-piutang',
        label: cat
    };
    return {
        color: '#8b5cf6',
        bg: 'rgba(139, 92, 246, 0.08)',
        border: 'rgba(139, 92, 246, 0.22)',
        dotClass: 'cat-lainnya',
        label: cat
    };
};

window.getCategoryBadgeStyle = function (cat) {
    return window.getCategoryTheme(cat);
};

// ============================================================================
// MODAL FORM TAMBAH & EDIT AGENDA
// ============================================================================

window.openAgendaFormModal = function (agendaId) {
    var modal = document.getElementById('modalAgendaForm');
    var formTitle = document.getElementById('agendaModalHeaderTitle');
    if (!modal) return;

    // Reset Form
    document.getElementById('agendaFormId').value = '';
    document.getElementById('agendaInputTitle').value = '';
    document.getElementById('agendaInputCategory').value = 'Produksi & HPP';
    document.getElementById('agendaInputDate').value = window.selectedAgendaDateFilter || window.getTodayIsoDate();
    document.getElementById('agendaInputStartTime').value = '09:00';
    document.getElementById('agendaInputEndTime').value = '10:30';
    document.getElementById('agendaInputDescription').value = '';
    document.getElementById('agendaInputReminder').value = '15_min';
    document.getElementById('agendaInputTelegram').checked = true;
    document.getElementById('agendaInputRecurring').value = 'none';
    document.getElementById('agendaInputStatus').value = 'pending';

    if (agendaId) {
        if (formTitle) formTitle.textContent = 'Edit Agenda Kegiatan';
        var agendas = window.getStoredAgendas();
        var found = agendas.find(function (a) { return a.id === agendaId; });
        if (found) {
            document.getElementById('agendaFormId').value = found.id;
            document.getElementById('agendaInputTitle').value = found.title || '';
            document.getElementById('agendaInputCategory').value = found.category || 'Produksi & HPP';
            document.getElementById('agendaInputDate').value = found.date || '';
            document.getElementById('agendaInputStartTime').value = found.startTime || '09:00';
            document.getElementById('agendaInputEndTime').value = found.endTime || '';
            document.getElementById('agendaInputDescription').value = found.description || '';
            document.getElementById('agendaInputReminder').value = found.reminder || 'none';
            document.getElementById('agendaInputTelegram').checked = Boolean(found.sendTelegram);
            document.getElementById('agendaInputRecurring').value = found.recurring || 'none';
            document.getElementById('agendaInputStatus').value = found.status || 'pending';
        }
    } else {
        if (formTitle) formTitle.textContent = 'Tambah Agenda Baru';
    }

    modal.classList.add('active');
};

window.closeAgendaFormModal = function () {
    var modal = document.getElementById('modalAgendaForm');
    if (modal) modal.classList.remove('active');
};

window.saveAgendaForm = function (e) {
    if (e && e.preventDefault) e.preventDefault();

    var id = document.getElementById('agendaFormId').value;
    var title = document.getElementById('agendaInputTitle').value.trim();
    var category = document.getElementById('agendaInputCategory').value;
    var date = document.getElementById('agendaInputDate').value;
    var startTime = document.getElementById('agendaInputStartTime').value;
    var endTime = document.getElementById('agendaInputEndTime').value;
    var description = document.getElementById('agendaInputDescription').value.trim();
    var reminder = document.getElementById('agendaInputReminder').value;
    var sendTelegram = document.getElementById('agendaInputTelegram').checked;
    var recurring = document.getElementById('agendaInputRecurring').value;
    var status = document.getElementById('agendaInputStatus').value;

    if (!title) {
        if (window.showToast) window.showToast('Judul kegiatan wajib diisi.', 'error');
        return;
    }
    if (!date) {
        if (window.showToast) window.showToast('Tanggal kegiatan wajib dipilih.', 'error');
        return;
    }

    var agendas = window.getStoredAgendas();
    var isNew = false;

    if (id) {
        // Update
        var idx = agendas.findIndex(function (a) { return a.id === id; });
        if (idx !== -1) {
            agendas[idx] = {
                id: id,
                title: title,
                category: category,
                date: date,
                startTime: startTime,
                endTime: endTime,
                description: description,
                reminder: reminder,
                sendTelegram: sendTelegram,
                recurring: recurring,
                status: status,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // Create Baru
        isNew = true;
        var newId = 'AGD-' + date.replace(/-/g, '') + '-' + ('00' + (agendas.length + 1)).slice(-3);
        agendas.push({
            id: newId,
            title: title,
            category: category,
            date: date,
            startTime: startTime,
            endTime: endTime,
            description: description,
            reminder: reminder,
            sendTelegram: sendTelegram,
            recurring: recurring,
            status: status,
            createdAt: new Date().toISOString()
        });
    }

    window.saveStoredAgendas(agendas);
    window.closeAgendaFormModal();

    window.renderCalendar();
    if (typeof window.renderDailyActivitiesPanel === 'function') {
        window.renderDailyActivitiesPanel(window.activeSelectedDate);
    }
    window.renderAgendaStats();
    window.renderTodayFocusWidget();
    window.renderAgendaList();

    if (window.showToast) {
        window.showToast(isNew ? 'Agenda baru berhasil dijadwalkan!' : 'Perubahan agenda berhasil disimpan!', 'success');
    }

    // Jika opsi kirim telegram aktif saat membuat agenda baru, kirim konfirmasi jadwal ke telegram
    if (isNew && sendTelegram && typeof window.sendTelegramNotification === 'function') {
        var msg = '📅 *AGENDA BARU DIJADWALKAN*\n'
            + 'Kegiatan: *' + title + '*\n'
            + 'Kategori: ' + category + '\n'
            + 'Waktu: ' + window.formatDateIndo(date) + ' (' + startTime + ' WIB)\n'
            + (recurring !== 'none' ? 'Perulangan: 🔁 ' + recurring + '\n' : '')
            + (description ? 'Catatan: ' + description : '');
        window.sendTelegramNotification(msg);
    }
};

window.toggleAgendaStatus = function (agendaId) {
    var agendas = window.getStoredAgendas();
    var found = agendas.find(function (a) { return a.id === agendaId; });
    if (!found) return;

    var newStatus = (found.status === 'completed') ? 'pending' : 'completed';
    found.status = newStatus;

    // Jika agenda berulang diselesaikan, tawarkan membuat jadwal periode berikutnya secara otomatis
    if (newStatus === 'completed' && found.recurring && found.recurring !== 'none') {
        window.generateNextRecurringAgenda(found, agendas);
    }

    window.saveStoredAgendas(agendas);
    window.renderCalendar();
    if (typeof window.renderDailyActivitiesPanel === 'function') {
        window.renderDailyActivitiesPanel(window.activeSelectedDate);
    }
    window.renderAgendaStats();
    window.renderTodayFocusWidget();
    window.renderAgendaList();

    if (window.showToast) {
        window.showToast(newStatus === 'completed' ? 'Agenda "' + found.title + '" ditandai selesai! 🎉' : 'Agenda dikembalikan ke status Menunggu.', 'success');
    }
};

window.generateNextRecurringAgenda = function (currentAgenda, agendasList) {
    try {
        var currDate = new Date(currentAgenda.date + 'T12:00:00');
        var nextDate = new Date(currDate);

        if (currentAgenda.recurring === 'daily') {
            nextDate.setDate(currDate.getDate() + 1);
        } else if (currentAgenda.recurring === 'weekly') {
            nextDate.setDate(currDate.getDate() + 7);
        } else if (currentAgenda.recurring === 'monthly') {
            nextDate.setMonth(currDate.getMonth() + 1);
        }

        var y = nextDate.getFullYear();
        var m = ('0' + (nextDate.getMonth() + 1)).slice(-2);
        var d = ('0' + nextDate.getDate()).slice(-2);
        var nextIso = y + '-' + m + '-' + d;

        // Cek agar tidak duplikat di tanggal berikutnya
        var exists = agendasList.some(function (a) {
            return a.title === currentAgenda.title && a.date === nextIso && a.status === 'pending';
        });

        if (!exists) {
            var newId = 'AGD-' + nextIso.replace(/-/g, '') + '-' + ('00' + (agendasList.length + 1)).slice(-3);
            agendasList.push({
                id: newId,
                title: currentAgenda.title,
                category: currentAgenda.category,
                date: nextIso,
                startTime: currentAgenda.startTime,
                endTime: currentAgenda.endTime,
                description: currentAgenda.description,
                reminder: currentAgenda.reminder,
                sendTelegram: currentAgenda.sendTelegram,
                recurring: currentAgenda.recurring,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            console.log('[Bos Kroco Agenda] Jadwal berulang berikutnya dibuat untuk tanggal:', nextIso);
        }
    } catch (err) {
        console.error('Gagal generate jadwal berulang:', err);
    }
};

window.deleteAgenda = function (agendaId) {
    if (!confirm('Apakah Anda yakin ingin menghapus agenda kegiatan ini?')) return;

    var agendas = window.getStoredAgendas();
    var filtered = agendas.filter(function (a) { return a.id !== agendaId; });
    window.saveStoredAgendas(filtered);

    window.renderCalendar();
    if (typeof window.renderDailyActivitiesPanel === 'function') {
        window.renderDailyActivitiesPanel(window.activeSelectedDate);
    }
    window.renderAgendaStats();
    window.renderTodayFocusWidget();
    window.renderAgendaList();

    if (window.showToast) {
        window.showToast('Agenda berhasil dihapus.', 'success');
    }
};

window.exportAgendaCSV = function () {
    var agendas = window.getStoredAgendas();
    if (!agendas || agendas.length === 0) {
        if (window.showToast) window.showToast('Tidak ada data agenda untuk diexport.', 'error');
        return;
    }

    var csv = 'ID,Judul Kegiatan,Kategori,Tanggal,Jam Mulai,Jam Selesai,Pengingat,Berulang,Status,Keterangan\n';
    agendas.forEach(function (a) {
        csv += [
            '"' + (a.id || '') + '"',
            '"' + (a.title || '').replace(/"/g, '""') + '"',
            '"' + (a.category || '') + '"',
            '"' + (a.date || '') + '"',
            '"' + (a.startTime || '') + '"',
            '"' + (a.endTime || '') + '"',
            '"' + (a.reminder || '') + '"',
            '"' + (a.recurring || '') + '"',
            '"' + (a.status || '') + '"',
            '"' + (a.description || '').replace(/"/g, '""') + '"'
        ].join(',') + '\n';
    });

    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'agenda_operasional_bos_kroco_' + window.getTodayIsoDate() + '.csv';
    link.click();
    URL.revokeObjectURL(url);
};

// ============================================================================
// ENGINE PENGINGAT REAL-TIME (NOTIFIKASI TOAST & TELEGRAM)
// ============================================================================

window.startAgendaReminderChecker = function () {
    if (window._reminderIntervalId) return;

    // Cek setiap 30 detik
    window._reminderIntervalId = setInterval(function () {
        window.checkAgendaReminders();
    }, 30000);

    // Langsung cek sekali saat dibuka
    window.checkAgendaReminders();
};

window.checkAgendaReminders = function () {
    var agendas = window.getStoredAgendas();
    var now = new Date();
    var todayIso = window.getTodayIsoDate();

    agendas.forEach(function (ag) {
        if (ag.status === 'completed') return;
        if (ag.reminder === 'none') return;
        if (ag._notified) return;

        try {
            var timeStr = ag.startTime || '00:00';
            var agDateTime = new Date(ag.date + 'T' + timeStr + ':00');
            var diffMinutes = Math.round((agDateTime.getTime() - now.getTime()) / 60000);

            var shouldNotify = false;
            if (ag.reminder === 'on_time' && diffMinutes <= 0 && diffMinutes >= -10) shouldNotify = true;
            if (ag.reminder === '15_min' && diffMinutes <= 15 && diffMinutes >= 0) shouldNotify = true;
            if (ag.reminder === '1_hour' && diffMinutes <= 60 && diffMinutes >= 45) shouldNotify = true;
            if (ag.reminder === '1_day' && diffMinutes <= 1440 && diffMinutes >= 1400) shouldNotify = true;

            if (shouldNotify) {
                ag._notified = true; // Tandai agar tidak spam
                if (window.showToast) {
                    window.showToast('🔔 PENGINGAT AGENDA: "' + ag.title + '" dijadwalkan pada ' + (ag.startTime || 'hari ini') + '!', 'success');
                }

                if (ag.sendTelegram && typeof window.sendTelegramNotification === 'function') {
                    var tMsg = '⏰ *PENGINGAT AGENDA OPERASIONAL*\n'
                        + 'Kegiatan: *' + ag.title + '*\n'
                        + 'Waktu: ' + window.formatDateIndo(ag.date) + ' (' + ag.startTime + ' WIB)\n'
                        + (ag.description ? 'Catatan: ' + ag.description : '');
                    window.sendTelegramNotification(tMsg);
                }
            }
        } catch (e) {}
    });
};

// ============================================================================
// UTILITAS FORMAT WAKTU & TANGGAL
// ============================================================================

window.getTodayIsoDate = function () {
    var d = new Date();
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
};

window.formatDateIndo = function (isoStr) {
    if (!isoStr) return '-';
    var parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    var mIdx = parseInt(parts[1], 10) - 1;
    return parseInt(parts[2], 10) + ' ' + (months[mIdx] || parts[1]) + ' ' + parts[0];
};

window.formatDateFullIndo = function (isoStr) {
    if (!isoStr) return '-';
    var parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    var months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    var days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    var dayName = days[d.getDay()] || '';
    var mIdx = parseInt(parts[1], 10) - 1;
    return (dayName ? dayName + ', ' : '') + parseInt(parts[2], 10) + ' ' + (months[mIdx] || parts[1]) + ' ' + parts[0];
};

