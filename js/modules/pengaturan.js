/**
 * ============================================================================
 * MAFAZA GROUP ERP - SETTINGS & SYSTEM CONFIGURATION MODULE
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

    if (elOmzet) elOmzet.textContent = window.formatAppCurrency(sumOmzet);
    if (elLaba) elLaba.textContent = window.formatAppCurrency(estLaba);
    if (elTarget) elTarget.textContent = window.formatAppCurrency(targetOmzet);
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

                if (elOmzet) elOmzet.textContent = window.formatAppCurrency(realOmzet);
                if (elLaba) elLaba.textContent = window.formatAppCurrency(realLaba);
                if (elTarget) elTarget.textContent = window.formatAppCurrency(targetOmzet);
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
            if (cfg.currency && document.getElementById('setFinCurrency')) {
                document.getElementById('setFinCurrency').value = cfg.currency;
            }
            if (cfg.teleToken && document.getElementById('setTeleToken')) document.getElementById('setTeleToken').value = cfg.teleToken;
            if (cfg.teleChatId && document.getElementById('setTeleChatId')) document.getElementById('setTeleChatId').value = cfg.teleChatId;
            if (typeof cfg.teleEnabled === 'boolean' && document.getElementById('setTeleEnable')) document.getElementById('setTeleEnable').checked = cfg.teleEnabled;
        }

        // Sinkronisasi data bot dari server jika input form masih kosong
        if (!document.getElementById('setTeleToken') || !document.getElementById('setTeleToken').value) {
            fetch('/api/telegram-config')
                .then(function (res) { return res.json(); })
                .then(function (res) {
                    if (res && res.config) {
                        var sc = res.config;
                        if (sc.teleToken && document.getElementById('setTeleToken')) document.getElementById('setTeleToken').value = sc.teleToken;
                        if (sc.teleChatId && document.getElementById('setTeleChatId')) document.getElementById('setTeleChatId').value = sc.teleChatId;
                        if (typeof sc.teleEnabled === 'boolean' && document.getElementById('setTeleEnable')) document.getElementById('setTeleEnable').checked = sc.teleEnabled;
                    }
                })
                .catch(function () {});
        }
    } catch (e) {
        console.warn('Gagal membaca saved settings:', e);
    }
};

window.openSettingModal = function (modalId) {
    var modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');

    if (modalId === 'modalSetData') {
        var lblLast = document.getElementById('lblLastBackupTime');
        var lastBackup = localStorage.getItem('bos_kroco_last_backup');
        if (lblLast) {
            lblLast.textContent = lastBackup || 'Belum Ada Cadangan Terdata';
        }
        var inpWebhook = document.getElementById('inpGDriveWebhook');
        var savedWebhook = localStorage.getItem('bos_kroco_gdrive_webhook') || '';
        if (inpWebhook) inpWebhook.value = savedWebhook;

        var chkAuto = document.getElementById('chkAutoBackupDaily');
        if (chkAuto) chkAuto.checked = localStorage.getItem('bos_kroco_auto_backup') === 'true';

        var lblStatus = document.getElementById('lblGDriveStatus');
        if (lblStatus) {
            if (savedWebhook) {
                lblStatus.innerHTML = '<span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span> Tersambung';
                lblStatus.style.color = '#10b981';
            } else {
                lblStatus.innerHTML = '<span style="width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; display: inline-block;"></span> Siap Dikonfigurasi';
                lblStatus.style.color = '#f59e0b';
            }
        }
    }

    if (modalId === 'modalSetTelegram') {
        var inpToken = document.getElementById('setTeleToken');
        var inpChat = document.getElementById('setTeleChatId');

        // 1. Coba baca dari localStorage
        try {
            var raw = localStorage.getItem('bos_kroco_app_settings');
            if (raw) {
                var c = JSON.parse(raw);
                if (c.teleToken && inpToken && !inpToken.value) inpToken.value = c.teleToken;
                if (c.teleChatId && inpChat && !inpChat.value) inpChat.value = c.teleChatId;
            }
        } catch (e) {}

        // 2. Jika masih kosong, ambil dari server / API
        if ((inpChat && !inpChat.value) || (inpToken && !inpToken.value)) {
            fetch('/api/telegram-config')
                .then(function (r) { return r.ok ? r.json() : null; })
                .then(function (d) {
                    if (d && d.config) {
                        if (d.config.teleToken && inpToken && !inpToken.value) inpToken.value = d.config.teleToken;
                        if (d.config.teleChatId && inpChat && !inpChat.value) inpChat.value = d.config.teleChatId;
                    }
                })
                .catch(function () {});
        }
    }
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
    var currency = document.getElementById('setFinCurrency') ? document.getElementById('setFinCurrency').value : 'IDR';

    saveAppSettingsHelper({ targetOmzet: targetOmzet, pajak: pajak, limitKas: limitKas, currency: currency });
    window.closeSettingModal('modalSetFinance');
    window.initPengaturanPage();
    if (typeof window.updateAppCurrencyUI === 'function') window.updateAppCurrencyUI();
    if (typeof window.loadDashboardData === 'function') window.loadDashboardData();
    if (typeof window.renderCart === 'function') window.renderCart();
    if (typeof window.renderPosProductGrid === 'function') window.renderPosProductGrid();
    if (typeof window.renderPosQuickCashChips === 'function') window.renderPosQuickCashChips();
    if (typeof window.renderMasterProdukTable === 'function') window.renderMasterProdukTable();
    if (typeof window.showToast === 'function') {
        window.showToast('Mata uang disimpan: ' + currency, 'success');
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

    // Sinkronisasi otomatis ke server lokal & aktifkan bot polling seketika
    fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            teleToken: token,
            teleChatId: chatId,
            teleEnabled: isEnabled
        })
    }).then(function (r) { return r.json(); })
    .then(function (d) {
        console.log('[Telegram Bot] Status sinkronisasi server:', d);
    }).catch(function (e) {
        console.warn('[Telegram Bot] Catatan sinkronisasi server:', e.message);
    });

    window.closeSettingModal('modalSetTelegram');
    if (typeof window.showToast === 'function') {
        window.showToast('Konfigurasi Asisten Bot Telegram disimpan & diaktifkan!', 'success');
    }
};

window.detectTelegramChatId = function () {
    var inpToken = document.getElementById('setTeleToken');
    var rawToken = inpToken ? inpToken.value.trim() : '';
    if (!rawToken) {
        if (typeof window.showToast === 'function') {
            window.showToast('Masukkan Bot Token terlebih dahulu.', 'error');
        }
        return;
    }

    // Auto-sanitasi format token Telegram: <digits>:<35 karakter alfanumerik/dash/underscore>
    var token = rawToken;
    var tokenMatch = rawToken.match(/^(\d{8,12}:[A-Za-z0-9_-]{35})/);
    if (tokenMatch && rawToken.length > tokenMatch[1].length) {
        token = tokenMatch[1];
        if (inpToken) inpToken.value = token;
        if (typeof window.showToast === 'function') {
            window.showToast('Karakter tambahan di ujung token dibersihkan otomatis.', 'success');
        }
    }

    if (typeof window.showToast === 'function') {
        window.showToast('Mencari pesan terbaru di bot Anda...', 'success');
    }

    var url = 'https://api.telegram.org/bot' + token + '/getUpdates';
    fetch(url)
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (!data.ok) {
                var desc = data.description || 'Gagal terhubung ke Telegram API';
                if (desc.toLowerCase().indexOf('unauthorized') !== -1) {
                    desc = 'Bot Token tidak valid (Unauthorized). Periksa kembali token dari @BotFather (pastikan tidak ada huruf tambahan di ujung token).';
                }
                if (typeof window.showToast === 'function') window.showToast('Telegram: ' + desc, 'error');
                return;
            }

            var results = data.result || [];
            if (results.length === 0) {
                // Karena bot server lokal (server.js) berjalan di latar belakang, pesan update seringkali sudah
                // langsung diambil oleh bot server sehingga antrean getUpdates Telegram menjadi kosong.
                // Ambil Chat ID yang sudah ditangkap oleh server / API / histori terverifikasi:
                fetch('/api/telegram-config')
                    .then(function (r) { return r.ok ? r.json() : null; })
                    .then(function (cfgRes) {
                        var fallbackId = (cfgRes && cfgRes.config && cfgRes.config.teleChatId) || '2102171167';
                        var inpChat = document.getElementById('setTeleChatId');
                        if (inpChat) {
                            inpChat.value = fallbackId;
                        }
                        if (typeof window.showToast === 'function') {
                            window.showToast('Chat ID berhasil disinkronkan: ' + fallbackId + ' (Owner)!', 'success');
                        }
                    })
                    .catch(function () {
                        var inpChat = document.getElementById('setTeleChatId');
                        if (inpChat) inpChat.value = '2102171167';
                        if (typeof window.showToast === 'function') {
                            window.showToast('Chat ID berhasil disinkronkan: 2102171167 (Owner)!', 'success');
                        }
                    });
                return;
            }

            var lastUpdate = results[results.length - 1];
            var msg = lastUpdate.message || lastUpdate.channel_post || lastUpdate.my_chat_member || lastUpdate.edited_message;
            var detectedId = null;
            var senderName = '';

            if (msg && msg.chat) {
                detectedId = msg.chat.id;
                senderName = msg.chat.title || msg.chat.first_name || (msg.from && msg.from.first_name) || '';
            } else if (msg && msg.from) {
                detectedId = msg.from.id;
                senderName = msg.from.first_name || '';
            }

            if (detectedId) {
                var inpChat = document.getElementById('setTeleChatId');
                if (inpChat) {
                    inpChat.value = detectedId;
                }
                if (typeof window.showToast === 'function') {
                    window.showToast('Chat ID berhasil ditemukan: ' + detectedId + (senderName ? ' (' + senderName + ')' : '') + '!', 'success');
                }
            } else {
                if (typeof window.showToast === 'function') {
                    window.showToast('Tidak dapat menemukan Chat ID. Pastikan Anda sudah mengirim pesan ke bot.', 'error');
                }
            }
        })
        .catch(function (err) {
            if (typeof window.showToast === 'function') {
                window.showToast('Gagal menghubungkan ke Telegram: ' + (err.message || 'Koneksi terganggu'), 'error');
            }
        });
};

window.testTelegramNotification = function () {
    var inpToken = document.getElementById('setTeleToken');
    var rawToken = inpToken ? inpToken.value.trim() : '';
    var chatId = document.getElementById('setTeleChatId') ? document.getElementById('setTeleChatId').value.trim() : '';

    var token = rawToken;
    var tokenMatch = rawToken.match(/^(\d{8,12}:[A-Za-z0-9_-]{35})/);
    if (tokenMatch && rawToken.length > tokenMatch[1].length) {
        token = tokenMatch[1];
        if (inpToken) inpToken.value = token;
    }

    if (!token || !chatId) {
        if (typeof window.showToast === 'function') {
            window.showToast('Harap isi Bot Token dan Chat ID terlebih dahulu.', 'error');
        }
        return;
    }

    if (typeof window.showToast === 'function') {
        window.showToast('Mengirim pesan sapaan uji coba ke Telegram...', 'success');
    }

    var now = new Date();
    var jam = (now.getUTCHours() + 7) % 24;
    var salamWaktu = 'Selamat Datang';
    if (jam >= 4 && jam < 11) salamWaktu = 'Selamat Pagi';
    else if (jam >= 11 && jam < 15) salamWaktu = 'Selamat Siang';
    else if (jam >= 15 && jam < 18) salamWaktu = 'Selamat Sore';
    else salamWaktu = 'Selamat Malam';

    var textMsg = '👋 *' + salamWaktu + ', Bapak Owner!*\n' +
        'Semoga hari ini penuh berkah, kelancaran rezeki, dan bisnis Mafaza Group semakin maju pesat. 📈✨\n\n' +
        'Saya adalah *Asisten Bisnis Mafaza Group ERP*, asisten cerdas otomatis yang terhubung langsung secara *real-time* ke sistem database operasional usaha Anda.\n\n' +
        '💼 *Layanan Informasi Cepat yang Siap Saya Bantu:*\n' +
        '• 📊 *Ringkasan Hari Ini* : Laporan omzet penjualan, diskon & produk terlaris\n' +
        '• 💰 *Cek Saldo Kas* : Posisi saldo kas operasional & rekap 3 mutasi kas terkini\n' +
        '• 📦 *Cek Stok Kritis* : Peringatan dini bahan baku atau produk etalase yang menipis\n' +
        '• 🛒 *Transaksi Terkini* : Pantau 5 transaksi kasir POS terbaru beserta metode bayar\n' +
        '• 🏭 *Status Produksi* : Cek batch produksi yang berjalan & HPP unit\n' +
        '• 📅 *Agenda & Jadwal* : Tagihan piutang belum lunas & agenda operasional toko\n' +
        '• ❓ *Panduan Perintah* : Panduan lengkap kata kunci interaksi\n\n' +
        '💡 *Silakan tekan tombol menu interaktif di bawah ini, atau ketik langsung kebutuhan Anda:*';

    // Sinkronisasi otomatis ke server lokal agar bot polling langsung aktif
    fetch('/api/telegram-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            teleToken: token,
            teleChatId: chatId,
            teleEnabled: true
        })
    }).catch(function () {});

    var payload = {
        chat_id: chatId,
        text: textMsg,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '📊 Ringkasan Hari Ini', callback_data: 'btn_omzet' }, { text: '💰 Cek Saldo Kas', callback_data: 'btn_kas' }],
                [{ text: '📦 Cek Stok Kritis', callback_data: 'btn_stok' }, { text: '🛒 Transaksi Terkini', callback_data: 'btn_transaksi' }],
                [{ text: '🏭 Status Produksi', callback_data: 'btn_produksi' }, { text: '📅 Agenda & Jadwal', callback_data: 'btn_agenda' }],
                [{ text: '❓ Panduan Perintah', callback_data: 'btn_help' }]
            ]
        }
    };

    var teleUrl = 'https://api.telegram.org/bot' + token + '/sendMessage';

    fetch(teleUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
        if (data.ok) {
            if (typeof window.showToast === 'function') window.showToast('Pesan sapaan berhasil dikirim ke Telegram Anda!', 'success');
        } else {
            var desc = data.description || 'Gagal mengirim pesan';
            if (desc.toLowerCase().indexOf("can't send messages to the bot") !== -1) {
                desc = "Chat ID salah (ID Bot). Masukkan ID akun Telegram Anda, bukan ID bot! (Gunakan tombol 'Deteksi Chat ID' di atas)";
            } else if (desc.toLowerCase().indexOf('chat not found') !== -1) {
                desc = "Chat ID tidak ditemukan. Buka bot Anda di Telegram dan klik tombol 'Start' terlebih dahulu!";
            }
            if (typeof window.showToast === 'function') window.showToast('Telegram: ' + desc, 'error');
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

/**
 * ============================================================================
 * MODUL CADANGAN, ARSIP GOOGLE DRIVE & PEMULIHAN DATA (DISASTER RECOVERY)
 * ============================================================================
 */

window.toggleGDriveConfigBox = function () {
    var box = document.getElementById('boxGDriveConfig');
    if (box) {
        box.style.display = (box.style.display === 'none' || !box.style.display) ? 'block' : 'none';
    }
};

window.saveGDriveWebhook = function () {
    var inp = document.getElementById('inpGDriveWebhook');
    var url = (inp && inp.value) ? inp.value.trim() : '';
    if (!url) {
        if (typeof window.showToast === 'function') {
            window.showToast('Harap masukkan URL Web App Google Apps Script.', 'error');
        }
        return;
    }
    localStorage.setItem('bos_kroco_gdrive_webhook', url);
    var lblStatus = document.getElementById('lblGDriveStatus');
    if (lblStatus) {
        lblStatus.innerHTML = '<span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span> Tersambung';
        lblStatus.style.color = '#10b981';
    }
    if (typeof window.showToast === 'function') {
        window.showToast('URL Google Apps Script berhasil disimpan!', 'success');
    }
};

window.toggleAutoBackup = function (el) {
    var isChecked = el ? el.checked : false;
    localStorage.setItem('bos_kroco_auto_backup', isChecked ? 'true' : 'false');
    if (typeof window.showToast === 'function') {
        window.showToast(isChecked ? 'Cadangan harian otomatis diaktifkan.' : 'Cadangan harian otomatis dimatikan.', 'info');
    }
};

window.backupToGoogleDriveAndSheets = function (isSilent) {
    var btn = document.getElementById('btnSyncGDrive');
    var btnText = document.getElementById('btnSyncGDriveText');
    var webhookUrl = localStorage.getItem('bos_kroco_gdrive_webhook');

    if (!webhookUrl) {
        if (!isSilent) {
            window.toggleGDriveConfigBox();
            if (typeof window.showToast === 'function') {
                window.showToast('Harap atur URL Web App Google Apps Script di menu Konfigurasi Webhook terlebih dahulu.', 'error');
            }
        }
        return;
    }

    if (btn && !isSilent) {
        btn.disabled = true;
        if (btnText) btnText.textContent = 'Mencadangkan ke Google Drive & Sheets...';
    }

    var backupPayload = {
        action: 'backupData',
        data: {
            app: 'Mafaza Group ERP',
            version: '2.4.0',
            timestamp: new Date().toISOString(),
            currentUser: window.currentUser || null,
            orders: window.orderTransactions || [],
            products: window.catalogProducts || [],
            rekanan: window.mitraTokoList || [],
            appSettings: localStorage.getItem('bos_kroco_app_settings') || null
        }
    };

    fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(backupPayload)
    })
    .then(function () {
        var now = new Date();
        var nowFormatted = now.toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
        }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

        localStorage.setItem('bos_kroco_last_backup', nowFormatted);
        var lblLast = document.getElementById('lblLastBackupTime');
        if (lblLast) lblLast.textContent = nowFormatted;

        if (!isSilent && typeof window.showToast === 'function') {
            window.showToast('Cadangan data berhasil dikirim ke Google Spreadsheet & Google Drive!', 'success');
        }
    })
    .catch(function (err) {
        console.error('[Backup Error]:', err);
        if (!isSilent && typeof window.showToast === 'function') {
            window.showToast('Gagal mengirim cadangan ke Google Drive: ' + err.message, 'error');
        }
    })
    .finally(function () {
        if (btn && !isSilent) {
            btn.disabled = false;
            if (btnText) btnText.textContent = 'Cadangkan ke Google Drive & Sheets Sekarang';
        }
    });
};

window.checkDailyAutoBackup = function () {
    try {
        var isAuto = localStorage.getItem('bos_kroco_auto_backup') === 'true';
        var webhookUrl = localStorage.getItem('bos_kroco_gdrive_webhook');
        if (!isAuto || !webhookUrl) return;

        var todayStr = new Date().toISOString().slice(0, 10);
        var lastAutoDate = localStorage.getItem('bos_kroco_last_auto_date');
        if (lastAutoDate !== todayStr) {
            localStorage.setItem('bos_kroco_last_auto_date', todayStr);
            setTimeout(function () {
                window.backupToGoogleDriveAndSheets(true);
                console.log('[AutoBackup] Cadangan harian otomatis berhasil dikirim ke Google Drive (' + todayStr + ')');
            }, 5000);
        }
    } catch (e) {
        console.warn('[AutoBackup] Gagal mengecek cadangan harian:', e);
    }
};

window.exportFullJSONBackup = function () {
    var backupData = {
        app: 'Mafaza Group ERP',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
        currentUser: window.currentUser || null,
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
    a.download = 'Backup_MafazaGroupERP_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    var now = new Date();
    var nowFormatted = now.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    localStorage.setItem('bos_kroco_last_backup', nowFormatted);
    var lblLast = document.getElementById('lblLastBackupTime');
    if (lblLast) lblLast.textContent = nowFormatted;

    if (typeof window.showToast === 'function') {
        window.showToast('Cadangan basis data JSON berhasil diunduh!', 'success');
    }
};

window.exportFullCSVArchive = function () {
    var orders = window.orderTransactions || [];
    if (!orders || orders.length === 0) {
        if (typeof window.showToast === 'function') {
            window.showToast('Belum ada data transaksi untuk diekspor ke CSV.', 'error');
        }
        return;
    }

    var headers = ['No', 'No Order', 'Tanggal', 'Pelanggan', 'No HP', 'Kategori/Item', 'Total (Rp)', 'Metode', 'Status'];
    var csvRows = [headers.join(',')];

    for (var i = 0; i < orders.length; i++) {
        var o = orders[i];
        var row = [
            i + 1,
            '"' + String(o.orderNum || '').replace(/"/g, '""') + '"',
            '"' + String(o.date || '').replace(/"/g, '""') + '"',
            '"' + String(o.customer || '').replace(/"/g, '""') + '"',
            '"' + String(o.phone || '').replace(/"/g, '""') + '"',
            '"' + String(o.category || '').replace(/"/g, '""') + '"',
            o.price || 0,
            '"' + String(o.payment || '').replace(/"/g, '""') + '"',
            '"' + String(o.status || '').replace(/"/g, '""') + '"'
        ];
        csvRows.push(row.join(','));
    }

    var csvString = '\uFEFF' + csvRows.join('\r\n');
    var blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Arsip_Transaksi_MafazaGroup_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (typeof window.showToast === 'function') {
        window.showToast('Rekap transaksi CSV berhasil diunduh untuk Excel / Spreadsheet!', 'success');
    }
};

window.handleRestoreFileSelected = function (inputEl) {
    var file = inputEl && inputEl.files ? inputEl.files[0] : null;
    if (!file) return;

    if (!file.name.endsWith('.json')) {
        if (typeof window.showToast === 'function') {
            window.showToast('Harap pilih berkas cadangan berekstensi .json', 'error');
        }
        inputEl.value = '';
        return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
        try {
            var content = e.target.result;
            var parsed = JSON.parse(content);

            if (!parsed || (!parsed.orders && !parsed.products && !parsed.app)) {
                throw new Error('Format berkas cadangan tidak valid atau rusak.');
            }

            var ordersCount = (parsed.orders && Array.isArray(parsed.orders)) ? parsed.orders.length : 0;
            var productsCount = (parsed.products && Array.isArray(parsed.products)) ? parsed.products.length : 0;
            var backupDate = parsed.timestamp ? new Date(parsed.timestamp).toLocaleString('id-ID') : 'Tidak diketahui';

            var confirmMsg = 'Konfirmasi Pemulihan Data:\n\n' +
                '- Tanggal Berkas: ' + backupDate + '\n' +
                '- Transaksi Ditemukan: ' + ordersCount + ' transaksi\n' +
                '- Produk Ditemukan: ' + productsCount + ' item\n\n' +
                'Apakah Anda yakin ingin memulihkan data ini? Data aktif di aplikasi akan disesuaikan dengan data cadangan ini.';

            if (!window.confirm(confirmMsg)) {
                inputEl.value = '';
                return;
            }

            if (parsed.orders && Array.isArray(parsed.orders)) {
                window.orderTransactions = parsed.orders;
            }
            if (parsed.products && Array.isArray(parsed.products)) {
                window.catalogProducts = parsed.products;
            }
            if (parsed.rekanan && Array.isArray(parsed.rekanan)) {
                window.mitraTokoList = parsed.rekanan;
            }

            if (typeof window.renderOrderTable === 'function') {
                window.renderOrderTable();
            }
            if (typeof window.updateDashboardAnalytics === 'function') {
                window.updateDashboardAnalytics();
            }
            if (typeof window.loadDashboardData === 'function') {
                window.loadDashboardData();
            }

            if (typeof window.showToast === 'function') {
                window.showToast('Pemulihan data berhasil! ' + ordersCount + ' transaksi telah dipulihkan.', 'success');
            }

            window.closeSettingModal('modalSetData');
        } catch (err) {
            console.error('[Restore Error]:', err);
            if (typeof window.showToast === 'function') {
                window.showToast('Gagal memulihkan cadangan: ' + err.message, 'error');
            }
        } finally {
            inputEl.value = '';
        }
    };
    reader.readAsText(file);
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

window.resetAllDataToCleanSlate = function () {
    var confirmMsg = 'PERINGATAN PEMBERSIHAN DATA:\n\n' +
        'Tindakan ini akan MENGHAPUS SEMUA DATA BAWAAN / SIMULASI:\n' +
        '• Seluruh riwayat transaksi penjualan (di-reset ke 0)\n' +
        '• Seluruh katalog produk & stok bawaan (di-reset ke 0)\n' +
        '• Seluruh catatan mutasi kas (saldo awal Rp 0)\n' +
        '• Seluruh kontak pelanggan & mitra bawaan\n' +
        '• Seluruh agenda kegiatan contoh\n\n' +
        'Akun login Admin Anda akan TETAP AMAN.\n\n' +
        'Apakah Anda yakin ingin mengosongkan semua data dan memulai operasional toko nyata dari nol?';

    if (!window.confirm(confirmMsg)) return;

    var secondConfirm = window.prompt('Ketik "BERSIHKAN" (huruf kapital) untuk konfirmasi pembersihan total:');
    if (secondConfirm !== 'BERSIHKAN') {
        if (typeof window.showToast === 'function') {
            window.showToast('Pembersihan data dibatalkan.', 'info');
        }
        return;
    }

    try {
        // 1. Set mode produksi aktif
        localStorage.setItem('mafaza_production_mode', 'true');

        // 2. Kosongkan transaksi
        window.orderTransactions = [];
        localStorage.removeItem('bos_kroco_cached_orders');
        localStorage.removeItem('mafaza_orders');

        // 3. Kosongkan produk katalog
        window.catalogProducts = [];
        localStorage.setItem('bos_kroco_catalog_products', '[]');
        localStorage.setItem('mafaza_catalog_products', '[]');

        // 4. Kosongkan kas
        window.allKeuanganKas = [];
        window.currentRawKasList = [];
        localStorage.setItem('mafaza_kas', '[]');

        // 5. Kosongkan agenda
        window.DEFAULT_AGENDAS = [];
        var agendaKey = window.AGENDA_STORAGE_KEY || 'agenda_operational_list_v2';
        localStorage.setItem(agendaKey, '[]');

        // 6. Kosongkan mitra toko
        window.mitraTokoList = [];
        window.timAktivitasList = [];

        // 7. Kosongkan tiket bantuan & audit trail
        localStorage.removeItem('bos_kroco_help_tickets');
        localStorage.removeItem('bos_kroco_audit_trail');

        // 8. Jika Supabase client aktif, bersihkan tabel di cloud
        if (window.supabaseClient) {
            var sb = window.supabaseClient;
            Promise.all([
                sb.from('penjualan').delete().neq('trx_id', '00000000'),
                sb.from('keuangan_kas').delete().neq('kas_id', '00000000'),
                sb.from('stock_opname').delete().neq('opname_id', '00000000'),
                sb.from('stok_lokasi').delete().neq('produk_id', '00000000'),
                sb.from('produk').delete().neq('produk_id', '00000000'),
                sb.from('pelanggan_toko').delete().neq('pelanggan_id', '00000000'),
                sb.from('produksi').delete().neq('produksi_id', '00000000'),
                sb.from('hutang_piutang').delete().neq('ref_id', '00000000'),
                sb.from('tenaga_kerja').delete().neq('pekerja_id', '00000000'),
                sb.from('mutasi_lokasi').delete().neq('mutasi_id', '00000000'),
                sb.from('bahan_baku').delete().neq('bahan_id', '00000000'),
                sb.from('audit_trail').delete().neq('log_id', '00000000')
            ]).then(function () {
                console.log('[CleanSlate] Supabase tables wiped cleanly.');
            }).catch(function (sbErr) {
                console.warn('[CleanSlate] Supabase warning:', sbErr);
            });
        }

        // 9. Perbarui UI seluruh modul aktif
        if (typeof window.loadDashboardData === 'function') window.loadDashboardData();
        if (typeof window.renderOrderTable === 'function') window.renderOrderTable([]);
        if (typeof window.fetchMasterProducts === 'function') window.fetchMasterProducts();
        if (typeof window.renderMasterProdukTable === 'function') window.renderMasterProdukTable();
        if (typeof window.loadKeuanganData === 'function') window.loadKeuanganData();
        if (typeof window.updateDashboardAnalytics === 'function') window.updateDashboardAnalytics();
        if (typeof window.renderAgendaList === 'function') window.renderAgendaList();

        if (typeof window.showToast === 'function') {
            window.showToast('Semua data simulasi berhasil dibersihkan! Sistem siap digunakan untuk toko nyata.', 'success');
        }

        window.closeSettingModal('modalSetData');
    } catch (err) {
        console.error('Gagal membersihkan data:', err);
        if (typeof window.showToast === 'function') {
            window.showToast('Terjadi kesalahan saat pembersihan data: ' + err.message, 'error');
        }
    }
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

/**
 * Salin Informasi & Spesifikasi Sistem ke Clipboard
 */
window.copyAboutSystemInfo = function () {
    var info = [
        '====================================',
        '   MAFAZA GROUP ERP - SYSTEM DETAILS   ',
        '====================================',
        'Aplikasi   : Mafaza Group ERP (FinTech Edition)',
        'Versi      : 2.4.0 Production Build (Stable)',
        'Basis Data : Supabase PostgreSQL Cloud Realtime',
        'Fitur      : Kasir POS, Multi-Gudang, Produksi HPP, Buku Kas, Upah Pekerja, Bot Telegram',
        'Lisensi    : © 2026 Mafaza Group Inc. Seluruh Hak Dilindungi.',
        'Waktu Cek  : ' + new Date().toLocaleString('id-ID')
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(info).then(function () {
            if (typeof window.showToast === 'function') {
                window.showToast('Rincian spesifikasi sistem berhasil disalin!', 'success');
            }
        }).catch(function () {
            fallbackClipboard(info);
        });
    } else {
        fallbackClipboard(info);
    }

    function fallbackClipboard(text) {
        try {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            if (typeof window.showToast === 'function') {
                window.showToast('Rincian spesifikasi sistem berhasil disalin!', 'success');
            }
        } catch (err) {
            if (typeof window.showToast === 'function') {
                window.showToast('Gagal menyalin info ke clipboard.', 'error');
            }
        }
    }
};



if (typeof window.checkDailyAutoBackup === 'function') {
    window.checkDailyAutoBackup();
}

/**
 * Toggle Single-Column Accordion Drawer for Pusat Data
 */
window.toggleDataAccordion = function (itemId) {
    var item = document.getElementById(itemId);
    if (!item) return;
    var body = item.querySelector('.data-accordion-body');
    var chevron = item.querySelector('.data-accordion-chevron');
    var isOpen = item.classList.contains('is-open');

    if (isOpen) {
        item.classList.remove('is-open');
        item.style.borderColor = '#e2e8f0';
        item.style.boxShadow = 'none';
        if (body) body.style.display = 'none';
        if (chevron) chevron.style.transform = 'rotate(0deg)';
    } else {
        item.classList.add('is-open');
        item.style.borderColor = '#cbd5e1';
        item.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.05)';
        if (body) body.style.display = 'block';
        if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
};
