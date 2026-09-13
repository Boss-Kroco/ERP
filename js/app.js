/**
 * ============================================================================
 * BOS KROCO ERP - MAIN APPLICATION ORCHESTRATOR
 * File: js/app.js
 * ============================================================================
 */

// Global Utility Functions
window.showToast = function (msg, type) {
    var box = document.getElementById('toastBox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'toastBox';
        box.className = 'toast-pill-box';
        document.body.appendChild(box);
    }
    var t = document.createElement('div');
    t.className = 'toast-item-pill ' + (type === 'error' ? 'error' : 'success');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(function () {
        if (t.remove) t.remove();
        else if (t.parentNode) t.parentNode.removeChild(t);
    }, 3200);
};

window.formatRupiah = function (num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
};

window.escapeHtml = function (text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Clock Device
window.initLiveDeviceClock = function () {
    window.updateClock();
    setInterval(window.updateClock, 1000);
};

window.updateClock = function () {
    var elTime = document.getElementById('clockLiveTime');
    var elDate = document.getElementById('clockLiveDate');
    if (!elTime || !elDate) return;

    var now = new Date();
    var h = ('0' + now.getHours()).slice(-2);
    var m = ('0' + now.getMinutes()).slice(-2);
    var s = ('0' + now.getSeconds()).slice(-2);
    elTime.textContent = h + ':' + m + ':' + s;

    var days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    var dayName = days[now.getDay()];
    var dateNum = now.getDate();
    var monName = months[now.getMonth()];
    var yearNum = now.getFullYear();
    elDate.textContent = dayName + ', ' + dateNum + ' ' + monName + ' ' + yearNum;
};

// Mobile Slide-Out Drawer
window.openMobileDrawer = function () {
    var overlay = document.getElementById('drawerOverlay');
    var panel = document.getElementById('drawerPanel');
    if (overlay && panel) {
        overlay.classList.add('active');
        panel.classList.add('active');
    }
};

window.closeMobileDrawer = function () {
    var overlay = document.getElementById('drawerOverlay');
    var panel = document.getElementById('drawerPanel');
    if (overlay && panel) {
        overlay.classList.remove('active');
        panel.classList.remove('active');
    }
};

window.navigateFromDrawer = function (viewId) {
    window.navigatePage(viewId);
    window.closeMobileDrawer();
};

window.filterDrawerMenu = function () {
    var q = (document.getElementById('drawerSearchInput').value || '').toLowerCase();
    var items = document.querySelectorAll('#drawerMenuList .btn-pill-action');
    items.forEach(function (btn) {
        var txt = btn.textContent.toLowerCase();
        btn.style.display = txt.indexOf(q) !== -1 ? 'flex' : 'none';
    });
};

// Global Search
window.handleGlobalSearch = function (q) {
    q = (q || '').trim();
    var activeView = document.querySelector('.view-section-card[style*="display: block"]') ||
        document.querySelector('.view-section-card[style*="display:block"]') ||
        document.querySelector('#pageContainer > div[style*="display: block"]') ||
        document.querySelector('#pageContainer > div[style*="display:block"]');
    var currentId = activeView ? activeView.id.replace('view-', '') : 'dashboard';

    if (currentId === 'pos') {
        if (typeof window.filterPosProducts === 'function') window.filterPosProducts(q);
    } else if (currentId === 'dashboard') {
        var oInp = document.getElementById('searchOrderTable');
        if (oInp) { oInp.value = q; window.filterOrderTable(); }
    } else if (currentId === 'audit') {
        var aInp = document.getElementById('searchAuditTable');
        if (aInp) { aInp.value = q; window.filterAuditLogs(); }
    }
};

// View Templates Loader
window.VIEW_MODULES = [
    'dashboard', 'pos', 'produk', 'produksi',
    'multilokasi', 'opname', 'keuangan', 'tenagakerja', 'agenda', 'audit', 'profil', 'pengaturan', 'bantuan'
];

window.loadAllViews = async function () {
    if (window._viewsLoaded) return true;
    var container = document.getElementById('pageContainer') || document.getElementById('viewContainer');
    var modalsContainer = document.getElementById('modalsContainer');
    if (!container) return;

    try {
        var viewVersion = '?v=3.9.' + Date.now();
        // Load Modals & Drawer First
        if (modalsContainer && !modalsContainer.innerHTML.trim()) {
            var mRes = await fetch('views/modals.html' + viewVersion);
            if (mRes.ok) {
                modalsContainer.innerHTML = await mRes.text();
            }
        }

        // Load 11 Modular Views
        var promises = window.VIEW_MODULES.map(async function (viewName) {
            try {
                var res = await fetch('views/' + viewName + '.html' + viewVersion);
                if (res.ok) {
                    var html = await res.text();
                    return { name: viewName, html: html };
                }
            } catch (e) {
                console.error('Failed to load view:', viewName, e);
            }
            return { name: viewName, html: '' };
        });

        var results = await Promise.all(promises);
        container.innerHTML = ''; // clear loading spinner

        results.forEach(function (r, idx) {
            if (r.html) {
                var wrapper = document.createElement('div');
                wrapper.innerHTML = r.html;
                var child = wrapper.firstElementChild || wrapper;
                // Default: hanya dashboard yang aktif terlihat
                if (r.name !== 'dashboard') {
                    child.style.display = 'none';
                } else {
                    child.style.display = 'block';
                }
                container.appendChild(child);
            }
        });

        window._viewsLoaded = true;
        console.log('[Bos Kroco] Seluruh 11 modul view berhasil dimuat.');
        return true;
    } catch (err) {
        console.error('[Bos Kroco] Gagal memuat view templates:', err);
        return false;
    }
};

// Application Bootstrap
window.initApp = async function () {
    window.initLiveDeviceClock();

    // Muat seluruh view modular
    await window.loadAllViews();

    // Sesi pengguna: aplikasi wajib login setiap kali dibuka
    window.currentUser = null;
    try {
        localStorage.removeItem('bos_kroco_user');
    } catch (e) {}

    // Pastikan login screen selalu tampil saat aplikasi dibuka
    var screen = document.getElementById('loginScreen');
    if (screen) {
        screen.style.display = 'flex';
    }

    // Inisialisasi Chart & Data Awal
    if (typeof window.startSplineAnimationLoop === 'function') {
        window.startSplineAnimationLoop();
        window.initSplineInteractivity();
    }
    if (typeof window.renderTimRekanan === 'function') {
        window.renderTimRekanan('aktivitas');
    }
    if (typeof window.renderOrderTable === 'function') {
        window.renderOrderTable();
    }
    if (typeof window.fetchDueAlerts === 'function') {
        window.fetchDueAlerts();
    }
    if (typeof window.populateProductDropdowns === 'function') {
        window.populateProductDropdowns();
    }
    if (typeof window.startAgendaReminderChecker === 'function') {
        window.startAgendaReminderChecker();
    }

    // Cek koneksi Supabase & tampilkan toast status
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
        window.checkSupabaseConnection().then(function (status) {
            if (status.connected) {
                window.showToast('Terhubung ke database Supabase!', 'success');
            } else {
                window.showToast('Supabase: ' + status.message, 'error');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', function () {
    window.initLiveDeviceClock();

    // Aktifkan Enter key pada form login
    var pInp = document.getElementById('loginPassword');
    var uInp = document.getElementById('loginUsername');
    if (pInp) {
        pInp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') window.doLogin();
        });
    }
    if (uInp) {
        uInp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                if (pInp) pInp.focus();
            }
        });
    }

    // Jalankan inisialisasi aplikasi
    window.initApp();
});
