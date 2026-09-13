/**
 * ============================================================================
 * BOS KROCO ERP - AUTH & ROLE-BASED ACCESS CONTROL (RBAC)
 * File: js/auth.js
 * ============================================================================
 */

window.currentUser = null;

window.ROLE_ACCESS_MAP = {
    'Owner': ['dashboard', 'pos', 'produk', 'produksi', 'multilokasi', 'opname', 'keuangan', 'tenagakerja', 'agenda', 'audit', 'profil', 'pengaturan', 'bantuan'],
    'Admin': ['dashboard', 'pos', 'produk', 'produksi', 'multilokasi', 'opname', 'keuangan', 'tenagakerja', 'agenda', 'audit', 'profil', 'pengaturan', 'bantuan'],
    'Bendahara': ['dashboard', 'pos', 'keuangan', 'tenagakerja', 'agenda', 'profil', 'pengaturan', 'bantuan'],
    'Bagian Produksi': ['dashboard', 'produk', 'produksi', 'multilokasi', 'opname', 'agenda', 'profil', 'pengaturan', 'bantuan'],
    'Bagian Penjualan': ['dashboard', 'pos', 'produk', 'agenda', 'profil', 'pengaturan', 'bantuan']
};

window.ROLE_NAV_PILL_MAP = {
    'dashboard': 'navPillDashboard',
    'pos': 'navPillPos',
    'produk': 'navPillProduk',
    'produksi': 'navPillProduksi',
    'multilokasi': 'navPillMultilokasi',
    'opname': 'navPillOpname',
    'keuangan': 'navPillKeuangan',
    'tenagakerja': 'navPillTenagakerja',
    'agenda': 'navPillAgenda',
    'audit': 'navPillAudit',
    'pengaturan': 'navPillPengaturan',
    'bantuan': 'navPillBantuan'
};

window.applyRolePermissions = function (user) {
    if (!user) return;
    var role = user.role || 'Guest';
    var allowedViews = (window.ROLE_ACCESS_MAP && window.ROLE_ACCESS_MAP[role]) ?
        window.ROLE_ACCESS_MAP[role].slice() :
        ['dashboard', 'pos', 'profil', 'pengaturan', 'bantuan'];

    if (allowedViews.indexOf('bantuan') === -1) allowedViews.push('bantuan');
    if (allowedViews.indexOf('profil') === -1) allowedViews.push('profil');

    Object.keys(window.ROLE_NAV_PILL_MAP).forEach(function (vKey) {
        var pill = document.getElementById(window.ROLE_NAV_PILL_MAP[vKey]);
        if (pill) {
            pill.style.display = (allowedViews.indexOf(vKey) !== -1) ? 'flex' : 'none';
        }
    });

    var nameEl = document.getElementById('headerUserName');
    var roleEl = document.getElementById('headerUserRoleBadge');
    var avatarEl = document.getElementById('headerUserAvatar');
    if (nameEl) nameEl.textContent = user.namaLengkap || user.username;
    if (roleEl) roleEl.textContent = user.role;
    if (avatarEl) {
        var savedAvatar = (user && user.avatarUrl) || localStorage.getItem('bos_kroco_avatar');
        if (savedAvatar) {
            avatarEl.innerHTML = '<img src="' + savedAvatar + '" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;">';
            avatarEl.style.background = 'transparent';
            avatarEl.style.padding = '0';
            avatarEl.style.overflow = 'hidden';
        } else {
            var initials = (user.namaLengkap || user.username || 'U').substring(0, 2).toUpperCase();
            avatarEl.innerHTML = '';
            avatarEl.textContent = initials;
            avatarEl.style.background = '';
            avatarEl.style.padding = '';
        }
    }

    var activeView = document.querySelector('.view-section-card.active') ||
        document.querySelector('.view-section-card[style*="display: block"]') ||
        document.querySelector('.view-section-card[style*="display:block"]');
    var currentId = activeView ? activeView.id.replace('view-', '') : 'dashboard';

    if (allowedViews.indexOf(currentId) === -1) {
        window.navigatePage(allowedViews[0]);
    }
};

window.navigatePage = function (viewId) {
    // Pusat Bantuan dan Profil Akun selalu diizinkan untuk SEMUA peran/role tanpa batasan
    if (viewId === 'bantuan' || viewId === 'profil') {
        // Akses selalu diizinkan
    } else {
        var role = window.currentUser ? (window.currentUser.role || 'Guest') : 'Owner';
        var allowed = (window.ROLE_ACCESS_MAP && window.ROLE_ACCESS_MAP[role]) || ['dashboard', 'pos', 'profil', 'pengaturan', 'bantuan'];
        if (allowed.indexOf(viewId) === -1) {
            if (window.showToast) window.showToast('Akses ditolak: Peran "' + role + '" tidak memiliki izin ke modul ini.', 'error');
            return;
        }
    }

    var views = ['dashboard', 'pos', 'produk', 'produksi', 'multilokasi', 'opname', 'keuangan', 'tenagakerja', 'agenda', 'audit', 'profil', 'pengaturan', 'bantuan'];
    views.forEach(function (v) {
        var el = document.getElementById('view-' + v);
        if (el) el.style.display = (v === viewId) ? 'block' : 'none';
    });

    var pills = document.querySelectorAll('.nav-icon-pill');
    var targetPillId = window.ROLE_NAV_PILL_MAP ? window.ROLE_NAV_PILL_MAP[viewId] : null;
    pills.forEach(function (p) {
        p.classList.remove('active');
        if (targetPillId ? (p.id === targetPillId) : (p.getAttribute('onclick') === "navigatePage('" + viewId + "')")) {
            p.classList.add('active');
        }
    });

    var pageTitleEl = document.getElementById('pageHeaderTitle');
    if (pageTitleEl) {
        var titleMap = {
            'dashboard': 'Dashboard',
            'pos': 'Kasir & POS',
            'produk': 'Master Produk',
            'produksi': 'Produksi & HPP',
            'multilokasi': 'Transfer Stok',
            'opname': 'Stock Opname',
            'keuangan': 'Kas & Beban',
            'tenagakerja': 'Upah Kerja',
            'agenda': 'Agenda & Kalender Operasional',
            'audit': 'Log Audit',
            'profil': 'Profil Akun',
            'pengaturan': 'Pengaturan Sistem',
            'bantuan': 'Pusat Bantuan & FAQ'
        };
        pageTitleEl.textContent = titleMap[viewId] || 'Dashboard';
    }

    // Refresh data spesifik modul
    if (viewId === 'dashboard' && typeof window.loadDashboardData === 'function') window.loadDashboardData();
    if (viewId === 'pos' && typeof window.populateProductDropdowns === 'function') window.populateProductDropdowns();
    if (viewId === 'produk' && typeof window.fetchMasterProducts === 'function') window.fetchMasterProducts();
    if (viewId === 'agenda' && typeof window.initAgendaPage === 'function') window.initAgendaPage();
    if (viewId === 'audit' && typeof window.fetchAuditLogs === 'function') window.fetchAuditLogs();
    if (viewId === 'profil' && typeof window.initProfilePage === 'function') window.initProfilePage();
    if (viewId === 'pengaturan' && typeof window.initPengaturanPage === 'function') window.initPengaturanPage();
    if (viewId === 'keuangan' && typeof window.initKeuanganPage === 'function') window.initKeuanganPage();
    if (viewId === 'bantuan' && typeof window.initBantuanPage === 'function') window.initBantuanPage();
};

window.doLogin = function () {
    var usernameEl = document.getElementById('loginUsername');
    var passwordEl = document.getElementById('loginPassword');
    var errEl = document.getElementById('loginErrorBox');
    var btn = document.getElementById('loginSubmitBtn');

    var username = usernameEl ? usernameEl.value.trim() : '';
    var password = passwordEl ? passwordEl.value.trim() : '';

    if (!username || !password) {
        if (errEl) {
            errEl.textContent = 'Username dan password harus diisi.';
            errEl.style.display = 'block';
        }
        return;
    }

    if (btn) {
        btn.textContent = 'Memverifikasi...';
        btn.disabled = true;
    }
    if (errEl) errEl.style.display = 'none';

    window.runBackend('apiLogin', [username, password], function (res) {
        if (res.success) {
            window.currentUser = res.user;

            // Bersihkan password dan error box
            if (passwordEl) passwordEl.value = '';
            if (errEl) errEl.style.display = 'none';

            // Tutup login screen, tampilkan aplikasi
            var screen = document.getElementById('loginScreen');
            if (screen) screen.style.display = 'none';

            // Terapkan RBAC ke seluruh antarmuka & update profil header
            window.applyRolePermissions(window.currentUser);

            // Muat data dashboard dan komponen aktif
            if (typeof window.loadDashboardData === 'function') {
                window.loadDashboardData();
            }

            if (window.showToast) {
                window.showToast('Selamat datang, ' + (res.user.namaLengkap || res.user.username) + '!', 'success');
            }

            if (btn) {
                btn.innerHTML = '<svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg><span>Masuk ke Sistem</span>';
                btn.disabled = false;
            }
        } else {
            if (errEl) {
                errEl.textContent = res.message || 'Login gagal. Periksa username dan password.';
                errEl.style.display = 'block';
            }
            if (btn) {
                btn.innerHTML = '<svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg><span>Masuk ke Sistem</span>';
                btn.disabled = false;
            }
        }
    }, function (err) {
        if (errEl) {
            errEl.textContent = err.message || 'Terjadi gangguan koneksi ke server.';
            errEl.style.display = 'block';
        }
        if (btn) {
            btn.innerHTML = '<svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg><span>Masuk ke Sistem</span>';
            btn.disabled = false;
        }
    });
};

window.doLogout = function () {
    try {
        localStorage.removeItem('bos_kroco_user');
        sessionStorage.setItem('bos_kroco_logged_out', '1');
    } catch (e) {}
    window.currentUser = null;
    var uInp = document.getElementById('loginUsername');
    var pInp = document.getElementById('loginPassword');
    var errBox = document.getElementById('loginErrorBox');
    var btn = document.getElementById('loginSubmitBtn');

    if (uInp) uInp.value = '';
    if (pInp) pInp.value = '';
    if (errBox) errBox.style.display = 'none';
    if (btn) {
        btn.innerHTML = '<svg class="svg-icon-sm" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg><span>Masuk ke Sistem</span>';
        btn.disabled = false;
    }

    // Kembalikan semua nav pill ke tampilan semula
    var pills = document.querySelectorAll('.nav-icon-pill');
    pills.forEach(function (p) { p.style.display = 'flex'; });

    // Tampilkan kembali login screen
    var screen = document.getElementById('loginScreen');
    if (screen) screen.style.display = 'flex';
};
