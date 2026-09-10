/**
 * ============================================================================
 * BOS KROCO ERP - SUPABASE CONFIGURATION
 * File: js/config.js
 * ============================================================================
 * Masukkan Project URL dan Anon Public Key dari Dashboard Supabase Anda:
 * Dashboard -> Project Settings -> API -> Project URL & Project API Keys (anon public)
 * ============================================================================
 */

window.SUPABASE_CONFIG = {
    // Masukkan Supabase Project URL Anda di sini
    url: 'https://htcovsomtfionfeyjcxm.supabase.co',

    // Masukkan Supabase Anon Key Anda di sini
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y292c29tdGZpb25mZXlqY3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTUxNDQsImV4cCI6MjEwNDMzMTE0NH0.cKICYPRV8l9aLDRt3LIwBAuU_ZIUzn0BnSM0xlBUj4M',

    // Timezone baku aplikasi
    timezone: 'Asia/Jakarta',

    // Helper untuk mendeteksi apakah kredensial Supabase sudah dipasang
    isConfigured: function () {
        return Boolean(
            this.url &&
            this.anonKey &&
            this.url.trim().length > 10 &&
            this.anonKey.trim().length > 20 &&
            !this.url.includes('xyzcompany')
        );
    }
};
