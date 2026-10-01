/**
 * ============================================================================
 * BOS KROCO ERP - SUPABASE CLIENT INITIALIZER
 * File: js/supabaseClient.js
 * ============================================================================
 */

window.supabaseClient = null;

(function () {
    try {
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.isConfigured()) {
            if (typeof supabase !== 'undefined' && supabase.createClient) {
                window.supabaseClient = supabase.createClient(
                    window.SUPABASE_CONFIG.url.trim(),
                    window.SUPABASE_CONFIG.anonKey.trim(),
                    {
                        auth: {
                            persistSession: true,
                            autoRefreshToken: true
                        }
                    }
                );
                console.log('[Supabase] Client initialized successfully with:', window.SUPABASE_CONFIG.url);
            } else {
                console.warn('[Supabase] Supabase SDK library not found. Falling back to local mode.');
            }
        } else {
            console.log('[Supabase] Kredensial belum diisi pada js/config.js. Menjalankan Mode Simulasi Lokal (Demo).');
        }
    } catch (e) {
        console.error('[Supabase] Initialization error:', e);
    }
})();

/**
 * Health check helper untuk menguji koneksi ke database Supabase
 */
window.checkSupabaseConnection = async function () {
    if (!window.supabaseClient) {
        return { connected: false, message: 'Supabase client belum dikonfigurasi (Mode Simulasi aktif).' };
    }
    try {
        var res = await window.supabaseClient.from('produk').select('count', { count: 'exact', head: true });
        if (res.error) throw res.error;
        return { connected: true, message: 'Terhubung ke database Supabase (Produk count: ' + res.count + ').' };
    } catch (err) {
        return { connected: false, message: err.message || 'Gagal tersambung ke Supabase.' };
    }
};
