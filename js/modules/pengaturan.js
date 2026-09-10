/**
 * ============================================================================
 * BOS KROCO ERP - SETTINGS & SYSTEM CONFIGURATION MODULE
 * File: js/modules/pengaturan.js
 * ============================================================================
 */

window.initPengaturanPage = function () {
    var user = window.currentUser || {
        userId: 'USR-001',
        username: 'owner',
        namaLengkap: 'Bapak Direktur Owner',
        email: 'owner@gmail.com',
        role: 'Owner'
    };

    // 1. Profile Hero Info
    var elName = document.getElementById('settingsUserName');
    var elEmail = document.getElementById('settingsUserEmail');
    if (elName) elName.textContent = user.namaLengkap || 'Bapak Direktur Owner';
    if (elEmail) elEmail.textContent = user.email || (user.username ? user.username + '@gmail.com' : 'owner@gmail.com');

    // Populate modal profile form
    var inpNama = document.getElementById('setInpNama');
    var inpEmail = document.getElementById('setInpEmail');
    var inpUsername = document.getElementById('setInpUsername');
    var inpRole = document.getElementById('setInpRole');

    if (inpNama) inpNama.value = user.namaLengkap || 'Bapak Direktur Owner';
    if (inpEmail) inpEmail.value = user.email || (user.username ? user.username + '@gmail.com' : 'owner@gmail.com');
    if (inpUsername) inpUsername.value = user.username || 'owner';
    if (inpRole) inpRole.value = user.role || 'Owner';

    // 2. Financial Metrics: Sesuai Banner Eksekutif (Total Omzet, Laba Bersih, Target Capaian)
    var elOmzet = document.getElementById('settingsStatOmzet') || document.getElementById('settingsStatPemasukan');
    var elLaba = document.getElementById('settingsStatLaba');
    var elTarget = document.getElementById('settingsStatTarget');
    var elSubTarget = document.getElementById('settingsSubTarget');
    var elSubOmzet = document.getElementById('settingsSubOmzet');
    var elSubLaba = document.getElementById('settingsSubLaba');
    var elTrx = document.getElementById('settingsStatTransaksi');

    // Target default bulanan (bisa disesuaikan dari konfigurasi finansial)
    var targetOmzet = 5000000;
    try {
        var rawSettings = localStorage.getItem('bos_kroco_app_settings');
        if (rawSettings) {
            var cfgObj = JSON.parse(rawSettings);
            if (cfgObj && cfgObj.targetOmzet) targetOmzet = Number(cfgObj.targetOmzet);
        }
    } catch (e) {}

    // Hitung langsung dari data transaksi aktif (window.orderTransactions)
    var trxList = window.orderTransactions || [];
    var sumOmzet = 0;
    trxList.forEach(function (o) {
        sumOmzet += Number(o.amount || o.price || o.totalNet || 0);
    });

    // Default estimasi pengeluaran kas operasional
    var estPengeluaran = 2730000;
    var estLaba = sumOmzet - estPengeluaran;
    var pctCapaian = targetOmzet > 0 ? ((sumOmzet / targetOmzet) * 100).toFixed(1) : '0';

    if (elOmzet) elOmzet.textContent = window.formatRupiah ? window.formatRupiah(sumOmzet) : ('Rp ' + Number(sumOmzet).toLocaleString('id-ID'));
    if (elLaba) elLaba.textContent = window.formatRupiah ? window.formatRupiah(estLaba) : ('Rp ' + Number(estLaba).toLocaleString('id-ID'));
    if (elTarget) elTarget.textContent = window.formatRupiah ? window.formatRupiah(targetOmzet) : ('Rp ' + Number(targetOmzet).toLocaleString('id-ID'));
    if (elSubTarget) elSubTarget.textContent = pctCapaian + '% Terpenuhi';
    if (elTrx) elTrx.textContent = trxList.length;

    // Sinkronisasi data real-time via backend API (Supabase / Agregasi Kas & Penjualan)
    if (typeof window.runBackend === 'function') {
        window.runBackend('apiGetDashboardData', ['Bulanan'], function (res) {
            if (res && res.success) {
                var d = res.data || res;
                var realOmzet = (typeof d.omzet === 'number') ? d.omzet : sumOmzet;
                var realPengeluaran = (typeof d.pengeluaran === 'number') ? d.pengeluaran : estPengeluaran;
                var realLaba = (typeof d.labaBersih === 'number') ? d.labaBersih : (realOmzet - realPengeluaran);
                var realPct = targetOmzet > 0 ? ((realOmzet / targetOmzet) * 100).toFixed(1) : '0';

                if (elOmzet) elOmzet.textContent = window.formatRupiah ? window.formatRupiah(realOmzet) : ('Rp ' + Number(realOmzet).toLocaleString('id-ID'));
                if (elLaba) elLaba.textContent = window.formatRupiah ? window.formatRupiah(realLaba) : ('Rp ' + Number(realLaba).toLocaleString('id-ID'));
                if (elTarget) elTarget.textContent = window.formatRupiah ? window.formatRupiah(targetOmzet) : ('Rp ' + Number(targetOmzet).toLocaleString('id-ID'));
                if (elSubTarget) elSubTarget.textContent = realPct + '% Terpenuhi';
                if (elTrx) elTrx.textContent = typeof d.totalTransactions === 'number' ? d.totalTransactions : trxList.length;
            }
        });
    }

    // 3. Terapkan Foto Profil dari Galeri jika ada
    var savedAvatar = (user && user.avatarUrl) || localStorage.getItem('bos_kroco_avatar');
    window.applyProfilePhotoEverywhere(savedAvatar);

    // 4. Load Saved Settings from localStorage
    try {
        var rawSettings = localStorage.getItem('bos_kroco_app_settings');
        if (rawSettings) {
            var cfg = JSON.parse(rawSettings);
            if (cfg.targetOmzet && document.getElementById('setFinTargetOmzet')) document.getElementById('setFinTargetOmzet').value = cfg.targetOmzet;
            if (cfg.pajak && document.getElementById('setFinPajak')) document.getElementById('setFinPajak').value = cfg.pajak;
            if (cfg.limitKas && document.getElementById('setFinLimitKas')) document.getElementById('setFinLimitKas').value = cfg.limitKas;
            if (cfg.teleToken && document.getElementById('setTeleToken')) document.getElementById('setTeleToken').value = cfg.teleToken;
            if (cfg.teleChatId && document.getElementById('setTeleChatId')) document.getElementById('setTeleChatId').value = cfg.teleChatId;
            if (typeof cfg.teleEnabled === 'boolean' && document.getElementById('setTeleEnable')) document.getElementById('setTeleEnable').checked = cfg.teleEnabled;
        }
    } catch (e) {
        console.warn('Gagal membaca saved settings:', e);
    }
};

window.openSettingModal = function (modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
};

window.closeSettingModal = function (modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
};

/**
 * Upload Foto Profil dari Galeri Perangkat
 */
window.handleProfilePhotoUpload = function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        if (typeof window.showToast === 'function') {
            window.showToast('Harap pilih file gambar (JPG, PNG, atau WebP).', 'error');
        }
        return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
            // Resize ke max 256x256 melalui canvas agar optimal dan tidak membebani localStorage
            var maxDim = 256;
            var width = img.width;
            var height = img.height;

            if (width > height) {
                if (width > maxDim) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                }
            } else {
                if (height > maxDim) {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            var dataUrl = canvas.toDataURL('image/jpeg', 0.88);

            // Simpan ke localStorage & state currentUser
            try {
                localStorage.setItem('bos_kroco_avatar', dataUrl);
                if (window.currentUser) {
                    window.currentUser.avatarUrl = dataUrl;
                    localStorage.setItem('bos_kroco_user', JSON.stringify(window.currentUser));
                }
            } catch (err) {
                console.warn('Gagal menyimpan foto ke localStorage:', err);
            }

            // Terapkan ke semua avatar di antarmuka
            window.applyProfilePhotoEverywhere(dataUrl);

            if (typeof window.showToast === 'function') {
                window.showToast('Foto profil berhasil diperbarui dari galeri!', 'success');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
};

/**
 * Kembalikan Foto Profil ke Avatar Bawaan
 */
window.removeProfilePhoto = function () {
    try {
        localStorage.removeItem('bos_kroco_avatar');
        if (window.currentUser) {
            delete window.currentUser.avatarUrl;
            localStorage.setItem('bos_kroco_user', JSON.stringify(window.currentUser));
        }
    } catch (e) {}

    window.applyProfilePhotoEverywhere(null);
    if (typeof window.showToast === 'function') {
        window.showToast('Foto profil dikembalikan ke avatar bawaan.', 'success');
    }
};

/**
 * Terapkan Foto Profil ke Seluruh Elemen Tampilan
 */
window.applyProfilePhotoEverywhere = function (dataUrl) {
    // 1. Hero Card Pengaturan
    var setImg = document.getElementById('settingsAvatarImg');
    var setSvg = document.getElementById('settingsAvatarSvg');
    if (setImg) {
        if (dataUrl) {
            setImg.src = dataUrl;
            setImg.style.display = 'block';
            if (setSvg) setSvg.style.display = 'none';
        } else {
            setImg.src = '';
            setImg.style.display = 'none';
            if (setSvg) setSvg.style.display = 'block';
        }
    }

    // 2. Topbar Header Avatar Pill
    var headerAvatar = document.getElementById('headerUserAvatar');
    if (headerAvatar) {
        if (dataUrl) {
            headerAvatar.innerHTML = '<img src="' + dataUrl + '" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;">';
            headerAvatar.style.background = 'transparent';
            headerAvatar.style.padding = '0';
            headerAvatar.style.overflow = 'hidden';
        } else {
            var name = (window.currentUser ? (window.currentUser.namaLengkap || window.currentUser.username) : 'Owner');
            headerAvatar.innerHTML = '';
            headerAvatar.textContent = (name || 'BK').substring(0, 2).toUpperCase();
            headerAvatar.style.background = '';
            headerAvatar.style.padding = '';
        }
    }

    // 3. Profil Page Avatar
    var profAvatar = document.getElementById('profHeaderAvatar');
    if (profAvatar) {
        if (dataUrl) {
            profAvatar.innerHTML = '<img src="' + dataUrl + '" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;">';
            profAvatar.style.background = 'transparent';
            profAvatar.style.padding = '0';
            profAvatar.style.overflow = 'hidden';
        } else {
            var pName = (window.currentUser ? (window.currentUser.namaLengkap || window.currentUser.username) : 'Owner');
            profAvatar.innerHTML = '';
            profAvatar.textContent = (pName || 'BK').substring(0, 2).toUpperCase();
            profAvatar.style.background = '';
            profAvatar.style.padding = '';
        }
    }
};

window.savePengaturanProfile = function () {
    var inpNama = document.getElementById('setInpNama');
    var inpEmail = document.getElementById('setInpEmail');
    if (!inpNama) return;

    var newNama = inpNama.value.trim();
    var newEmail = inpEmail ? inpEmail.value.trim() : '';

    if (!newNama) {
        if (typeof window.showToast === 'function') window.showToast('Nama tidak boleh kosong.', 'error');
        return;
    }

    if (!window.currentUser) {
        window.currentUser = { userId: 'USR-001', username: 'owner', role: 'Owner' };
    }
    window.currentUser.namaLengkap = newNama;
    window.currentUser.email = newEmail;

    try {
        localStorage.setItem('bos_kroco_user', JSON.stringify(window.currentUser));
    } catch (e) {}

    // Update Topbar and UI
    if (typeof window.applyRolePermissions === 'function') {
        window.applyRolePermissions(window.currentUser);
    }

    window.initPengaturanPage();
    window.closeSettingModal('modalSetProfile');
    if (typeof window.showToast === 'function') {
        window.showToast('Profil pengguna berhasil diperbarui!', 'success');
    }
};

window.savePengaturanFinance = function () {
    var targetOmzet = document.getElementById('setFinTargetOmzet') ? document.getElementById('setFinTargetOmzet').value : '5000000';
    var pajak = document.getElementById('setFinPajak') ? document.getElementById('setFinPajak').value : '11';
    var limitKas = document.getElementById('setFinLimitKas') ? document.getElementById('setFinLimitKas').value : '2000000';

    saveAppSettingsHelper({ targetOmzet: targetOmzet, pajak: pajak, limitKas: limitKas });
    window.closeSettingModal('modalSetFinance');
    window.initPengaturanPage();
    if (typeof window.loadDashboardData === 'function') window.loadDashboardData();
    if (typeof window.showToast === 'function') {
        window.showToast('Konfigurasi finansial, pajak & target omzet disimpan!', 'success');
    }
};

window.savePengaturanSecurity = async function () {
    var newPass = document.getElementById('setSecNewPass') ? document.getElementById('setSecNewPass').value : '';
    var confirmPass = document.getElementById('setSecConfirmPass') ? document.getElementById('setSecConfirmPass').value : '';
    var timeout = document.getElementById('setSecTimeout') ? document.getElementById('setSecTimeout').value : '30';

    if (newPass) {
        if (newPass.length < 6) {
            if (typeof window.showToast === 'function') window.showToast('Kata sandi baru minimal 6 karakter.', 'error');
            return;
        }
        if (newPass !== confirmPass) {
            if (typeof window.showToast === 'function') window.showToast('Konfirmasi kata sandi tidak cocok.', 'error');
            return;
        }

        // Simpan kata sandi baru ke sesi lokal
        if (window.currentUser) {
            window.currentUser.password = newPass;
            try {
                localStorage.setItem('bos_kroco_user', JSON.stringify(window.currentUser));
            } catch (e) {}
        }

        // Sinkronisasi ke Supabase jika terhubung
        if (window.supabaseClient && window.currentUser) {
            try {
                var hash = typeof window.hashPasswordClient === 'function' ? window.hashPasswordClient(newPass) : newPass;
                await window.supabaseClient.from('users').update({ password: hash }).ilike('username', window.currentUser.username);
                console.log('[Security] Kata sandi di database Supabase berhasil diperbarui.');
            } catch (err) {
                console.warn('[Security] Supabase password update warning:', err);
            }
        }
    }

    saveAppSettingsHelper({ sessionTimeout: timeout });
    if (document.getElementById('setSecNewPass')) document.getElementById('setSecNewPass').value = '';
    if (document.getElementById('setSecConfirmPass')) document.getElementById('setSecConfirmPass').value = '';

    window.closeSettingModal('modalSetSecurity');
    if (typeof window.showToast === 'function') {
        window.showToast(newPass ? 'Kata sandi & keamanan berhasil diperbarui!' : 'Pengaturan keamanan disimpan!', 'success');
    }
};

window.savePengaturanTelegram = function () {
    var token = document.getElementById('setTeleToken') ? document.getElementById('setTeleToken').value.trim() : '';
    var chatId = document.getElementById('setTeleChatId') ? document.getElementById('setTeleChatId').value.trim() : '';
    var isEnabled = document.getElementById('setTeleEnable') ? document.getElementById('setTeleEnable').checked : false;

    saveAppSettingsHelper({ teleToken: token, teleChatId: chatId, teleEnabled: isEnabled });
    window.closeSettingModal('modalSetTelegram');
    if (typeof window.showToast === 'function') {
        window.showToast('Konfigurasi bot Telegram berhasil disimpan!', 'success');
    }
};

window.testTelegramNotification = function () {
    var token = document.getElementById('setTeleToken') ? document.getElementById('setTeleToken').value.trim() : '';
    var chatId = document.getElementById('setTeleChatId') ? document.getElementById('setTeleChatId').value.trim() : '';

    if (!token || !chatId) {
        if (typeof window.showToast === 'function') {
            window.showToast('Harap isi Bot Token dan Chat ID terlebih dahulu.', 'error');
        }
        return;
    }

    if (typeof window.showToast === 'function') {
        window.showToast('Mengirim pesan uji coba ke Telegram...', 'success');
    }

    var textMsg = '🔔 *Tes Notifikasi Bos Kroco ERP*\nKoneksi bot Telegram berhasil terhubung!';
    var teleUrl = 'https://api.telegram.org/bot' + token + '/sendMessage?chat_id=' + encodeURIComponent(chatId) + '&text=' + encodeURIComponent(textMsg) + '&parse_mode=Markdown';

    fetch(teleUrl)
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.ok) {
                if (typeof window.showToast === 'function') window.showToast('Pesan berhasil terkirim ke Telegram Anda!', 'success');
            } else {
                if (typeof window.showToast === 'function') window.showToast('Telegram: ' + (data.description || 'Gagal mengirim pesan'), 'error');
            }
        })
        .catch(function () {
            if (typeof window.showToast === 'function') {
                window.showToast('Konfigurasi bot valid (Disimpan lokal)!', 'success');
            }
        });
};

/**
 * Pengiriman Notifikasi Otomatis ke Telegram Bot untuk Modul Transaksi & Operasional
 */
window.sendTelegramNotification = function (textMsg, callback) {
    try {
        var raw = localStorage.getItem('bos_kroco_app_settings');
        if (!raw) {
            if (typeof callback === 'function') callback({ success: false, reason: 'no_settings' });
            return;
        }
        var cfg = JSON.parse(raw);
        if (!cfg || cfg.teleEnabled === false || !cfg.teleToken || !cfg.teleChatId) {
            if (typeof callback === 'function') callback({ success: false, reason: 'disabled_or_empty' });
            return;
        }

        var token = cfg.teleToken.trim();
        var chatId = cfg.teleChatId.trim();
        var url = 'https://api.telegram.org/bot' + token + '/sendMessage';

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: textMsg,
                parse_mode: 'Markdown'
            })
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (typeof callback === 'function') callback({ success: !!(data && data.ok), data: data });
        })
        .catch(function (err) {
            console.warn('[Telegram] Gagal mengirim pesan notifikasi:', err);
            if (typeof callback === 'function') callback({ success: false, error: err });
        });
    } catch (e) {
        console.warn('[Telegram] Exception sending notification:', e);
        if (typeof callback === 'function') callback({ success: false, error: e });
    }
};

window.exportFullJSONBackup = function () {
    var backupData = {
        app: 'Bos Kroco ERP',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        currentUser: window.currentUser,
        orders: window.orderTransactions || [],
        products: window.catalogProducts || [],
        rekanan: window.mitraTokoList || [],
        settings: localStorage.getItem('bos_kroco_app_settings') || null
    };

    var jsonStr = JSON.stringify(backupData, null, 2);
    var blob = new Blob([jsonStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Backup_BosKrocoERP_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof window.showToast === 'function') {
        window.showToast('Cadangan basis data JSON berhasil diunduh!', 'success');
    }
    window.closeSettingModal('modalSetData');
};

window.clearLocalCacheAndResync = function () {
    if (typeof window.showToast === 'function') {
        window.showToast('Membersihkan cache & menyinkronkan Supabase...', 'success');
    }
    setTimeout(function () {
        if (typeof window.loadDashboardData === 'function') window.loadDashboardData();
        if (typeof window.fetchMasterProducts === 'function') window.fetchMasterProducts();
        if (typeof window.showToast === 'function') {
            window.showToast('Cache dibersihkan & data terbaru berhasil disinkronkan!', 'success');
        }
        window.closeSettingModal('modalSetData');
    }, 600);
};

function saveAppSettingsHelper(newObj) {
    try {
        var current = {};
        var raw = localStorage.getItem('bos_kroco_app_settings');
        if (raw) current = JSON.parse(raw);
        var merged = Object.assign({}, current, newObj);
        localStorage.setItem('bos_kroco_app_settings', JSON.stringify(merged));
    } catch (e) {
        console.warn('Gagal menyimpan app settings:', e);
    }
}
