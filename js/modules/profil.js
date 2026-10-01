/**
 * ============================================================================
 * BOS KROCO ERP - USER PROFILE MODULE
 * File: js/modules/profil.js
 * ============================================================================
 */

window.initProfilePage = function () {
    var user = window.currentUser || {
        userId: 'USR-001',
        username: 'owner',
        namaLengkap: 'Bapak Direktur Owner',
        role: 'Owner'
    };

    // 1. Hero Card Elements
    var elAvatar = document.getElementById('profHeaderAvatar');
    var elNama = document.getElementById('profHeaderNama');
    var elRole = document.getElementById('profHeaderRole');
    var elUsername = document.getElementById('profHeaderUsername');
    var elId = document.getElementById('profHeaderId');

    var initials = (user.namaLengkap || user.username || 'U').substring(0, 2).toUpperCase();
    var savedAvatar = (user && user.avatarUrl) || localStorage.getItem('bos_kroco_avatar');
    if (elAvatar) {
        if (savedAvatar) {
            elAvatar.innerHTML = '<img src="' + savedAvatar + '" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;">';
            elAvatar.style.background = 'transparent';
            elAvatar.style.overflow = 'hidden';
        } else {
            elAvatar.innerHTML = '';
            elAvatar.textContent = initials;
            elAvatar.style.background = '';
        }
    }
    if (elNama) elNama.textContent = user.namaLengkap || user.username;
    if (elRole) elRole.textContent = user.role || 'Pengguna';
    if (elUsername) elUsername.textContent = '@' + (user.username || 'user');
    if (elId) elId.textContent = 'ID: ' + (user.userId || 'USR-001');

    // 2. Biodata Form Inputs
    var inpNama = document.getElementById('profInputNama');
    var inpUsername = document.getElementById('profInputUsername');
    var inpRole = document.getElementById('profInputRole');
    var inpId = document.getElementById('profInputId');

    if (inpNama) inpNama.value = user.namaLengkap || '';
    if (inpUsername) inpUsername.value = user.username || '';
    if (inpRole) inpRole.value = user.role || '';
    if (inpId) inpId.value = user.userId || 'USR-001';

    // 3. Session Details
    var elTime = document.getElementById('profSessionLoginTime');
    if (elTime) {
        var now = new Date();
        elTime.textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
            + ' • ' + ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2) + ' WIB';
    }

    // 4. Render Role Access Permissions Matrix
    window.renderProfilePermissions(user.role || 'Guest');
};

window.saveProfileBiodata = function () {
    var inpNama = document.getElementById('profInputNama');
    if (!inpNama) return;

    var newNama = inpNama.value.trim();
    if (!newNama) {
        if (typeof window.showToast === 'function') {
            window.showToast('Nama lengkap tidak boleh kosong.', 'error');
        }
        return;
    }

    if (!window.currentUser) {
        window.currentUser = {
            userId: 'USR-001',
            username: 'owner',
            namaLengkap: newNama,
            role: 'Owner'
        };
    } else {
        window.currentUser.namaLengkap = newNama;
    }

    try {
        localStorage.setItem('bos_kroco_user', JSON.stringify(window.currentUser));
    } catch (e) {
        console.warn('Gagal menyimpan sesi user ke localStorage:', e);
    }

    // Synchronize Top Header and UI
    if (typeof window.applyRolePermissions === 'function') {
        window.applyRolePermissions(window.currentUser);
    }

    // Refresh profile display
    window.initProfilePage();

    if (typeof window.showToast === 'function') {
        window.showToast('Biodata profil berhasil diperbarui!', 'success');
    }
};

window.saveProfilePassword = function () {
    var oldPassEl = document.getElementById('profOldPassword');
    var newPassEl = document.getElementById('profNewPassword');
    var confirmPassEl = document.getElementById('profConfirmPassword');

    var oldPass = oldPassEl ? oldPassEl.value : '';
    var newPass = newPassEl ? newPassEl.value : '';
    var confirmPass = confirmPassEl ? confirmPassEl.value : '';

    if (!oldPass) {
        if (typeof window.showToast === 'function') window.showToast('Masukkan kata sandi saat ini.', 'error');
        return;
    }
    if (!newPass || newPass.length < 6) {
        if (typeof window.showToast === 'function') window.showToast('Kata sandi baru minimal 6 karakter.', 'error');
        return;
    }
    if (newPass !== confirmPass) {
        if (typeof window.showToast === 'function') window.showToast('Konfirmasi kata sandi baru tidak cocok.', 'error');
        return;
    }

    // Reset Form Fields
    if (oldPassEl) oldPassEl.value = '';
    if (newPassEl) newPassEl.value = '';
    if (confirmPassEl) confirmPassEl.value = '';

    if (typeof window.showToast === 'function') {
        window.showToast('Kata sandi berhasil diperbarui dengan aman!', 'success');
    }
};

window.renderProfilePermissions = function (role) {
    var grid = document.getElementById('profPermissionGrid');
    if (!grid) return;

    var allModules = [
        { id: 'dashboard', name: 'Dashboard & Analitik', desc: 'Ringkasan omzet, laba rugi, kas riil & grafik' },
        { id: 'pos', name: 'Kasir & POS Penjualan', desc: 'Transaksi ritel langsung, keranjang & cetak struk' },
        { id: 'produk', name: 'Master Produk & SKU', desc: 'Katalog barang, harga jual, modal & kategori' },
        { id: 'produksi', name: 'Produksi & HPP', desc: 'Manufaktur batch, resep bahan baku & kartu stok' },
        { id: 'multilokasi', name: 'Transfer Multi-Lokasi', desc: 'Distribusi & mutasi inventaris antar cabang' },
        { id: 'opname', name: 'Stock Opname', desc: 'Pemeriksaan fisik stok & rekonsiliasi selisih' },
        { id: 'keuangan', name: 'Buku Kas & Pengeluaran', desc: 'Pencatatan kas masuk, biaya operasional & beban' },
        { id: 'tenagakerja', name: 'Upah & Tenaga Kerja', desc: 'Kalkulasi tarif borongan & penggajian tim' },
        { id: 'audit', name: 'Log Audit & Aktivitas', desc: 'Jejak rekam aktivitas sistem & riwayat keamanan' }
    ];

    var allowed = (window.ROLE_ACCESS_MAP && window.ROLE_ACCESS_MAP[role]) || ['dashboard', 'pos', 'profil'];

    grid.innerHTML = '';
    allModules.forEach(function (m) {
        var hasAccess = allowed.indexOf(m.id) !== -1;
        var card = document.createElement('div');
        card.className = 'prof-perm-item' + (hasAccess ? ' active' : ' disabled');

        var iconSvg = hasAccess
            ? '<svg class="svg-icon-xs text-emerald" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>'
            : '<svg class="svg-icon-xs text-muted" viewBox="0 0 24 24"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>';

        var badgeText = hasAccess ? 'Diizinkan' : 'Dibatasi';
        var badgeClass = hasAccess ? 'prof-perm-tag active' : 'prof-perm-tag disabled';

        card.innerHTML =
            '<div class="prof-perm-header">' +
                '<span class="prof-perm-title">' + m.name + '</span>' +
                '<span class="' + badgeClass + '">' + iconSvg + badgeText + '</span>' +
            '</div>' +
            '<div class="prof-perm-desc">' + m.desc + '</div>';

        grid.appendChild(card);
    });
};
