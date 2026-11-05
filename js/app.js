/**
 * ============================================================================
 * MAFAZA GROUP ERP - MAIN APPLICATION ORCHESTRATOR
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

window.getAppCurrencyConfig = function () {
    var rawSettings = localStorage.getItem('bos_kroco_app_settings') || localStorage.getItem('boss_kroco_app_settings');
    var currency = 'IDR';
    var prefix = 'Rp ';
    var symbol = 'Rp';
    var exchangeRate = 1;
    var locale = 'id-ID';
    var fraction = 0;
    
    if (rawSettings) {
        try {
            var cfgObj = JSON.parse(rawSettings);
            if (cfgObj && cfgObj.currency) {
                currency = cfgObj.currency;
            }
        } catch (e) {}
    }

    if (currency === 'USD') {
        prefix = '$ ';
        symbol = '$';
        exchangeRate = 15500;
        locale = 'en-US';
        fraction = 2;
    } else if (currency === 'SAR') {
        prefix = '﷼ ';
        symbol = '﷼';
        exchangeRate = 4770;
        locale = 'id-ID';
        fraction = 2;
    } else if (currency === 'YER') {
        prefix = '﷼ ';
        symbol = '﷼';
        exchangeRate = 62; // Standard Kurs Real Yaman (1 YER ~ Rp 62)
        locale = 'id-ID';
        fraction = 2;
    } else {
        // Standar Baku Kurs Rupiah (IDR)
        currency = 'IDR';
        prefix = 'Rp ';
        symbol = 'Rp';
        exchangeRate = 1;
        locale = 'id-ID';
        fraction = 0;
    }

    return {
        currency: currency,
        prefix: prefix,
        symbol: symbol,
        exchangeRate: exchangeRate,
        locale: locale,
        fraction: fraction
    };
};

window.toAppCurrency = function (numIdr) {
    var cfg = window.getAppCurrencyConfig();
    if (cfg.currency === 'IDR') {
        return Math.round(Number(numIdr || 0));
    }
    var val = Number(numIdr || 0) / cfg.exchangeRate;
    return parseFloat(val.toFixed(cfg.fraction));
};

window.fromAppCurrency = function (numCurr) {
    var cfg = window.getAppCurrencyConfig();
    if (cfg.currency === 'IDR') {
        return Math.round(Number(numCurr || 0));
    }
    return Math.round(Number(numCurr || 0) * cfg.exchangeRate);
};

window.formatAppCurrency = function (num) {
    var cfg = window.getAppCurrencyConfig();
    if (cfg.currency === 'IDR') {
        var bulatIdr = Math.round(Number(num || 0));
        return 'Rp ' + bulatIdr.toLocaleString('id-ID');
    }
    var convertedNum = Number(num || 0) / cfg.exchangeRate;
    return cfg.prefix + convertedNum.toLocaleString(cfg.locale, {
        minimumFractionDigits: cfg.fraction,
        maximumFractionDigits: cfg.fraction
    });
};

window.formatAppCurrencyValue = function (val) {
    var cfg = window.getAppCurrencyConfig();
    if (cfg.currency === 'IDR') {
        var bulatIdr = Math.round(Number(val || 0));
        return 'Rp ' + bulatIdr.toLocaleString('id-ID');
    }
    var num = Number(val || 0);
    return cfg.prefix + num.toLocaleString(cfg.locale, {
        minimumFractionDigits: cfg.fraction,
        maximumFractionDigits: cfg.fraction
    });
};

window.updateAppCurrencyUI = function () {
    var cfg = window.getAppCurrencyConfig();
    // Update semua elemen dengan class app-currency-symbol
    document.querySelectorAll('.app-currency-symbol').forEach(function (el) {
        el.textContent = cfg.symbol;
    });

    // Update elemen khusus yang mungkin belum ber-class
    var elPosPrefix = document.getElementById('posCurrencyPrefix');
    if (elPosPrefix) elPosPrefix.textContent = cfg.symbol;

    var lblKasNom = document.getElementById('lblKasNominal');
    if (lblKasNom) lblKasNom.innerHTML = 'Nominal (' + cfg.symbol + ')';

    var thMasuk = document.getElementById('thKasMasuk');
    if (thMasuk) thMasuk.textContent = 'Masuk (' + cfg.symbol + ')';

    var thKeluar = document.getElementById('thKasKeluar');
    if (thKeluar) thKeluar.textContent = 'Keluar (' + cfg.symbol + ')';

    var thHppSat = document.getElementById('thHppHargaSatuan');
    if (thHppSat) thHppSat.textContent = 'Harga Sat (' + cfg.symbol + ')';

    var optPosDiskon = document.getElementById('optPosDiskonRp');
    if (optPosDiskon) optPosDiskon.textContent = 'Nominal (' + cfg.symbol + ')';

    var prefixBadge = document.getElementById('posDiskonPrefixBadge');
    var elType = document.getElementById('posDiskonType');
    if (prefixBadge) prefixBadge.textContent = (elType && elType.value === 'persen') ? '%' : cfg.symbol;
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
    'dashboard', 'pos', 'transaksi', 'sewa', 'pelanggan', 'produk', 'produksi',
    'multilokasi', 'opname', 'keuangan', 'tenagakerja', 'agenda', 'audit', 'profil', 'pengaturan', 'bantuan'
];

window.loadAllViews = async function () {
    if (window._viewsLoaded) return true;
    var container = document.getElementById('pageContainer') || document.getElementById('viewContainer');
    var modalsContainer = document.getElementById('modalsContainer');
    if (!container) return;

    try {
        var viewVersion = '?v=4.0.' + Date.now();
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
        if (typeof window.updateAppCurrencyUI === 'function') window.updateAppCurrencyUI();
        console.log('[Mafaza Group] Seluruh 11 modul view berhasil dimuat.');
        return true;
    } catch (err) {
        console.error('[Mafaza Group] Gagal memuat view templates:', err);
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
    if (typeof window.refreshTimRekanan === 'function') {
        window.refreshTimRekanan();
    }
    if (typeof window.renderOrderTable === 'function') {
        window.renderOrderTable();
    }
    if (typeof window.fetchDueAlerts === 'function') {
        window.fetchDueAlerts();
    }
    if (typeof window.fetchMasterProducts === 'function') {
        window.fetchMasterProducts();
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

// ==========================================
// PDF GENERATION HELPER
// ==========================================
window.downloadStrukPdf = function(htmlContent, filename) {
    if (typeof window.html2pdf !== 'function') {
        if(window.showToast) window.showToast('Gagal memuat pembuat PDF. Coba ulangi atau muat ulang halaman.', 'error');
        return;
    }
    
    var container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.padding = '0';
    container.style.background = '#fff';
    container.style.width = '280px'; // Exact width for 80mm thermal printer
    
    var opt = {
        margin:       2,
        filename:     filename || 'Struk.pdf',
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: [80, 200], orientation: 'portrait' }
    };
    
    window.html2pdf().set(opt).from(container).save().then(function() {
        if(window.showToast) window.showToast('Struk PDF berhasil diunduh.', 'success');
    }).catch(function(err) {
        console.error('PDF generation error:', err);
        if(window.showToast) window.showToast('Terjadi kesalahan saat membuat PDF.', 'error');
    });
};

window.downloadStrukImage = function(htmlContent, filename) {
    if (typeof window.html2canvas !== 'function') {
        if(window.showToast) window.showToast('Gagal memuat pembuat Gambar.', 'error');
        return;
    }
    var container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.padding = '20px';
    container.style.background = '#fff';
    container.style.color = '#000';
    container.style.width = '340px'; 
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    
    window.html2canvas(container, { scale: 2 }).then(function(canvas) {
        document.body.removeChild(container);
        var link = document.createElement('a');
        link.download = (filename || 'Struk') + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        if(window.showToast) window.showToast('Struk Gambar berhasil diunduh.', 'success');
    }).catch(function(err) {
        if(container.parentNode) document.body.removeChild(container);
        console.error('Image generation error:', err);
        if(window.showToast) window.showToast('Terjadi kesalahan saat membuat Gambar.', 'error');
    });
};

window.toggleLanguage = function() {
    var currentLangLbl = document.getElementById('langSwitchLabel');
    var currentIsID = (currentLangLbl.innerText === 'ID');
    
    var selectElement = document.querySelector('.goog-te-combo');
    
    if (selectElement) {
        if (currentIsID) {
            selectElement.value = 'ar';
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent("change", true, true);
            selectElement.dispatchEvent(evt);
            currentLangLbl.innerText = 'AR';
            document.cookie = 'googtrans=/id/ar; path=/';
        } else {
            selectElement.value = '';
            var evt2 = document.createEvent("HTMLEvents");
            evt2.initEvent("change", true, true);
            selectElement.dispatchEvent(evt2);
            
            try {
                var iframe = document.querySelector('iframe.goog-te-banner-frame');
                if (iframe) {
                    var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
                    var restoreBtn = innerDoc.getElementById('restore');
                    if (restoreBtn) restoreBtn.click();
                }
            } catch(e) {}
            
            currentLangLbl.innerText = 'ID';
            document.cookie = 'googtrans=/id/id; path=/';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
    } else {
        // Fallback: Use cookie and reload
        if (currentIsID) {
            document.cookie = 'googtrans=/id/ar; path=/';
            window.location.reload();
        } else {
            document.cookie = 'googtrans=/id/id; path=/';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.reload();
        }
    }
};

// Check language state on load
window.addEventListener('load', function() {
    var lbl = document.getElementById('langSwitchLabel');
    if (lbl && document.cookie.indexOf('/ar') !== -1) {
        lbl.innerText = 'AR';
    }
});

// Helper Navigasi Geser Naik & Turun Layar (Panah Samping Kanan)
window.appScrollStep = function (delta) {
    // 1. Cek apakah ada modal aktif yang sedang terbuka
    var activeModal = document.querySelector('.modal-overlay-custom.active .modal-sheet-body') ||
                      document.querySelector('.modal-overlay-custom.active');
    if (activeModal && activeModal.scrollHeight > activeModal.clientHeight) {
        activeModal.scrollBy({ top: delta, behavior: 'smooth' });
        return;
    }

    // 2. Cek apakah di halaman POS ada produk grid yang sedang di-scroll
    var posGrid = document.getElementById('posProductGrid');
    if (posGrid && posGrid.offsetParent !== null && posGrid.scrollHeight > posGrid.clientHeight) {
        posGrid.scrollBy({ top: delta, behavior: 'smooth' });
        return;
    }

    // 3. Cek container utama aplikasi
    var mainContent = document.querySelector('.main-content') || document.querySelector('main') || document.getElementById('appMainContent');
    if (mainContent && mainContent.scrollHeight > mainContent.clientHeight) {
        mainContent.scrollBy({ top: delta, behavior: 'smooth' });
        return;
    }

    // 4. Fallback ke window / documentElement
    window.scrollBy({ top: delta, behavior: 'smooth' });
};



// ============================================================
// MODAL ACCESSIBILITY: FOCUS TRACKING & RESTORATION
// ============================================================
(function initModalFocusRestoration() {
    window._modalFocusStack = [];
    window._lastNonModalTrigger = null;

    // 1. Catat elemen pemicu interaksi non-modal (klik, sentuhan, atau enter/spasi)
    function recordTrigger(target) {
        if (!target) return;
        var el = target.closest ? target.closest('button, a, input, select, textarea, [tabindex], [role="button"]') : target;
        if (!el) el = target;
        // Jangan catat jika interaksi terjadi di dalam modal yang sedang aktif
        if (el.closest && el.closest('.modal-overlay-custom.active, .modal-sheet-card, #drawerPanel.active, [role="dialog"][style*="display: flex"], [role="dialog"][style*="display: block"]')) {
            return;
        }
        window._lastNonModalTrigger = el;
    }

    document.addEventListener('pointerdown', function (e) {
        recordTrigger(e.target);
    }, true);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            recordTrigger(e.target);
        }
    }, true);

    document.addEventListener('focusin', function (e) {
        if (e.target && e.target.closest) {
            var inModal = e.target.closest('.modal-overlay-custom, .modal-overlay, #drawerPanel, #drawerOverlay, [role="dialog"]');
            if (!inModal) {
                window._lastNonModalTrigger = e.target;
            }
        }
    }, true);

    // 2. Fungsi deteksi apakah suatu elemen adalah modal atau drawer
    function isModalElement(el) {
        if (!el || !el.id) return false;
        if (el.id.startsWith('modal')) return true;
        if (el.id === 'drawerPanel' || el.id === 'drawerOverlay' || el.id === 'mobileDrawer') return true;
        if (el.classList && (el.classList.contains('modal-overlay-custom') || el.classList.contains('modal-overlay'))) return true;
        return false;
    }

    // 3. Fungsi cek apakah modal sedang terlihat
    function isModalVisible(el) {
        if (!el) return false;
        if (el.classList && (el.classList.contains('active') || el.classList.contains('open'))) return true;
        if (el.style && (el.style.display === 'flex' || el.style.display === 'block')) return true;
        return false;
    }

    // 4. Fungsi pemulihan fokus yang aman (safe fallback)
    window.restoreModalFocusSafely = function (trigger, modalIdentifier) {
        if (!trigger) {
            console.warn('[a11y focus] Tidak ada elemen pemicu yang tersimpan untuk modal:', modalIdentifier);
            return false;
        }
        if (!document.body.contains(trigger)) {
            console.warn('[a11y focus] Elemen pemicu untuk modal ' + modalIdentifier + ' sudah tidak ada di DOM.');
            return false;
        }
        var style = window.getComputedStyle ? window.getComputedStyle(trigger) : null;
        if (style && (style.display === 'none' || style.visibility === 'hidden')) {
            console.warn('[a11y focus] Elemen pemicu untuk modal ' + modalIdentifier + ' sedang tersembunyi.');
            return false;
        }
        if (trigger.offsetParent === null && (!style || style.position !== 'fixed')) {
            console.warn('[a11y focus] Elemen pemicu untuk modal ' + modalIdentifier + ' tidak terlihat.');
            return false;
        }
        try {
            if (typeof trigger.focus === 'function') {
                trigger.focus();
                return document.activeElement === trigger;
            }
        } catch (err) {
            console.warn('[a11y focus] Gagal memfokuskan elemen pemicu modal ' + modalIdentifier + ':', err);
        }
        return false;
    };

    // 5. MutationObserver untuk memantau pembukaan dan penutupan modal otomatis
    function onModalMutation(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var el = mutations[i].target;
            if (!isModalElement(el)) continue;

            var visible = isModalVisible(el);
            var wasVisible = !!el._modalWasVisible;

            if (!wasVisible && visible) {
                // Modal baru saja terbuka: simpan pemicu fokus
                el._modalWasVisible = true;
                var trigger = document.activeElement;
                if (!trigger || trigger === document.body || (el.contains && el.contains(trigger))) {
                    trigger = window._lastNonModalTrigger || null;
                }
                window._modalFocusStack.push({ modal: el, trigger: trigger });
            } else if (wasVisible && !visible) {
                // Modal baru saja tertutup: kembalikan fokus ke pemicu
                el._modalWasVisible = false;
                var foundIdx = -1;
                for (var s = window._modalFocusStack.length - 1; s >= 0; s--) {
                    if (window._modalFocusStack[s].modal === el) {
                        foundIdx = s;
                        break;
                    }
                }
                if (foundIdx !== -1) {
                    var entry = window._modalFocusStack.splice(foundIdx, 1)[0];
                    setTimeout(function () {
                        window.restoreModalFocusSafely(entry.trigger, el.id || 'modal');
                    }, 0);
                }
            }
        }
    }

    if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(onModalMutation);
        function startObserving() {
            var root = document.body || document.documentElement;
            if (root) {
                observer.observe(root, {
                    attributes: true,
                    subtree: true,
                    attributeFilter: ['class', 'style']
                });
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startObserving);
        } else {
            startObserving();
        }
    }
})();

// ============================================================
// MODAL ACCESSIBILITY: CLOSE ACTIVE MODALS ON ESCAPE KEY
// ============================================================
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
        // 1. Modal Setting Header Struk (z-index highest)
        var modalSettingHeader = document.getElementById('modalSettingHeaderStruk');
        if (modalSettingHeader && (modalSettingHeader.style.display === 'flex' || modalSettingHeader.style.display === 'block')) {
            if (typeof closeSettingHeaderStruk === 'function') {
                closeSettingHeaderStruk();
            } else {
                modalSettingHeader.style.display = 'none';
            }
            e.preventDefault();
            return;
        }

        // 2. Modal Preview Struk
        var modalPreview = document.getElementById('modalPreviewStruk');
        if (modalPreview && (modalPreview.style.display === 'flex' || modalPreview.style.display === 'block')) {
            if (typeof closePreviewStrukModal === 'function') {
                closePreviewStrukModal();
            } else {
                modalPreview.style.display = 'none';
            }
            e.preventDefault();
            return;
        }

        // 3. Modals with class .active or inline display flex/block
        var activeModals = Array.from(document.querySelectorAll('.modal-overlay-custom, .modal-overlay'));
        for (var i = activeModals.length - 1; i >= 0; i--) {
            var m = activeModals[i];
            var isVisible = m.classList.contains('active') ||
                            m.style.display === 'flex' ||
                            m.style.display === 'block';
            if (isVisible) {
                var closeBtn = m.querySelector('button[onclick*="close"], button[onclick*="Close"]');
                if (closeBtn) {
                    closeBtn.click();
                } else {
                    m.classList.remove('active');
                    m.style.display = 'none';
                }
                e.preventDefault();
                return;
            }
        }

        // 4. Mobile Drawer
        var drawer = document.getElementById('mobileDrawer');
        var drawerOverlay = document.getElementById('drawerOverlay');
        if ((drawer && drawer.classList.contains('active')) || (drawerOverlay && drawerOverlay.classList.contains('active'))) {
            if (typeof closeMobileDrawer === 'function') closeMobileDrawer();
            e.preventDefault();
            return;
        }
    }
});


