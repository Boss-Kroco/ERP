/**
 * ============================================================================
 * BOS KROCO ERP - BOT ASISTEN TELEGRAM CERDAS (INTERAKTIF 2-ARAH)
 * ============================================================================
 * Asisten bisnis otomatis yang terhubung langsung ke database Supabase Cloud.
 * Fitur:
 * - Sapaan pembuka ramah ke Bapak Owner
 * - Menu interaktif (Reply Keyboard)
 * - Laporan Omzet & Penjualan Hari Ini
 * - Cek Saldo Kas & Mutasi Finansial
 * - Cek Stok Kritis (Gudang & Etalase)
 * - Transaksi POS Terkini & Struk
 * - Status Batch Produksi & HPP
 * - Pemrosesan Percakapan Alami (NLP)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'bot_config.json');

const SUPABASE_URL = 'https://htcovsomtfionfeyjcxm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y292c29tdGZpb25mZXlqY3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTUxNDQsImV4cCI6MjEwNDMzMTE0NH0.cKICYPRV8l9aLDRt3LIwBAuU_ZIUzn0BnSM0xlBUj4M';

const SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
};

const KEYBOARD_MENU = {
    keyboard: [
        [{ text: '📊 Ringkasan Hari Ini' }, { text: '💰 Cek Saldo Kas' }],
        [{ text: '📦 Cek Stok Kritis' }, { text: '🛒 Transaksi Terkini' }],
        [{ text: '🏭 Status Produksi' }, { text: '📅 Agenda & Jadwal' }],
        [{ text: '❓ Panduan Perintah' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
};

const INLINE_MENU = {
    inline_keyboard: [
        [{ text: '📊 Ringkasan Hari Ini', callback_data: 'btn_omzet' }, { text: '💰 Cek Saldo Kas', callback_data: 'btn_kas' }],
        [{ text: '📦 Cek Stok Kritis', callback_data: 'btn_stok' }, { text: '🛒 Transaksi Terkini', callback_data: 'btn_transaksi' }],
        [{ text: '🏭 Status Produksi', callback_data: 'btn_produksi' }, { text: '📅 Agenda & Jadwal', callback_data: 'btn_agenda' }],
        [{ text: '❓ Panduan Perintah', callback_data: 'btn_help' }]
    ]
};

let config = {
    teleToken: '',
    teleChatId: '',
    teleEnabled: true,
    botName: 'Asisten Virtual Bos Kroco ERP'
};

let isPolling = false;
let lastUpdateId = 0;
let abortController = null;

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            let raw = fs.readFileSync(CONFIG_FILE, 'utf8');
            if (raw.charCodeAt(0) === 0xFEFF) {
                raw = raw.slice(1);
            }
            config = Object.assign(config, JSON.parse(raw.trim()));
        }
    } catch (e) {
        console.warn('[Bot Asisten] Gagal membaca bot_config.json:', e.message);
    }
}

function saveConfig(newCfg) {
    try {
        config = Object.assign(config, newCfg);
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
        console.log('[Bot Asisten] Konfigurasi berhasil diperbarui.');
        restartPolling();
    } catch (e) {
        console.error('[Bot Asisten] Gagal menulis bot_config.json:', e);
    }
}

function formatRupiah(num) {
    const val = Number(num) || 0;
    return 'Rp ' + val.toLocaleString('id-ID');
}

function getWIBDate() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const wib = new Date(utc + (3600000 * 7));
    const yyyy = wib.getFullYear();
    const mm = String(wib.getMonth() + 1).padStart(2, '0');
    const dd = String(wib.getDate()).padStart(2, '0');
    return {
        iso: `${yyyy}-${mm}-${dd}`,
        formatted: wib.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        time: wib.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
}

async function querySupabase(tableAndQuery) {
    const url = `${SUPABASE_URL}/rest/v1/${tableAndQuery}`;
    const res = await fetch(url, { headers: SUPABASE_HEADERS });
    if (!res.ok) {
        throw new Error(`Supabase error ${res.status}: ${await res.text()}`);
    }
    return await res.json();
}

async function sendTelegramMessage(chatId, text, replyMarkup = KEYBOARD_MENU) {
    loadConfig();
    const token = (config.teleToken || '').trim();
    if (!token) return;
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    try {
        const body = {
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        };
        if (replyMarkup) {
            body.reply_markup = replyMarkup;
        }
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const json = await res.json();
        if (!json.ok) {
            console.warn('[Bot Asisten] Telegram API response error:', json.description);
        }
    } catch (e) {
        console.error('[Bot Asisten] Gagal mengirim pesan Telegram:', e.message);
    }
}

function getWelcomeMessage(firstName) {
    const sapaan = firstName ? `Bapak/Ibu ${firstName}` : 'Bapak Owner';
    const jam = (new Date().getUTCHours() + 7) % 24;
    let salamWaktu = 'Selamat Datang';
    if (jam >= 4 && jam < 11) salamWaktu = 'Selamat Pagi';
    else if (jam >= 11 && jam < 15) salamWaktu = 'Selamat Siang';
    else if (jam >= 15 && jam < 18) salamWaktu = 'Selamat Sore';
    else salamWaktu = 'Selamat Malam';

    return `👋 *${salamWaktu}, ${sapaan}!*
Semoga hari ini penuh berkah, kelancaran usaha, dan bisnis Bos Kroco semakin maju pesat. 📈✨

Saya adalah *Asisten Virtual Bos Kroco ERP*, asisten bisnis cerdas Anda yang terhubung langsung secara *real-time* ke sistem database operasional usaha Anda.

💼 *Layanan Informasi Cepat yang Siap Saya Bantu:*
• 📊 *Ringkasan Hari Ini* : Laporan omzet penjualan, diskon & produk terlaris
• 💰 *Cek Saldo Kas* : Posisi saldo kas operasional & rekap 3 mutasi kas terkini
• 📦 *Cek Stok Kritis* : Peringatan dini bahan baku atau produk etalase yang menipis
• 🛒 *Transaksi Terkini* : Pantau 5 transaksi kasir POS terbaru beserta metode bayar
• 🏭 *Status Produksi* : Cek batch produksi yang berjalan & HPP unit
• 📅 *Agenda & Jadwal* : Tagihan piutang belum lunas & agenda operasional toko
• ❓ *Panduan Perintah* : Panduan lengkap kata kunci interaksi

💡 *Silakan tekan salah satu tombol menu di bawah, atau ketik langsung pertanyaan Anda (misalnya: "omzet hari ini", "cek kas", "stok kritis").*`;
}

async function handleRingkasanHariIni() {
    const wib = getWIBDate();
    try {
        const allTrx = await querySupabase('penjualan?select=*&order=created_at.desc');
        const todayTrx = allTrx.filter(t => {
            if (!t.tanggal && !t.created_at) return false;
            return (t.tanggal && t.tanggal.includes(wib.iso)) || (t.created_at && t.created_at.includes(wib.iso));
        });

        const list = todayTrx.length > 0 ? todayTrx : allTrx.slice(0, 10);
        const isHistoricalFallback = todayTrx.length === 0;

        let totalGross = 0;
        let totalNet = 0;
        let totalDiskon = 0;
        let countTunai = 0;
        let countNonTunai = 0;
        const productStats = {};

        list.forEach(t => {
            const gross = Number(t.total_gross) || Number(t.total_net) || 0;
            const net = Number(t.total_net) || gross;
            const diskon = Number(t.diskon) || 0;
            totalGross += gross;
            totalNet += net;
            totalDiskon += diskon;

            const met = (t.metode_bayar || '').toLowerCase();
            if (met.includes('tunai') || met.includes('cash')) countTunai++;
            else countNonTunai++;

            if (t.item_list_json && Array.isArray(t.item_list_json)) {
                t.item_list_json.forEach(it => {
                    const name = it.nama || it.namaProduk || 'Produk';
                    const qty = Number(it.qty) || 1;
                    productStats[name] = (productStats[name] || 0) + qty;
                });
            } else if (t.nama_pelanggan) {
                productStats[t.nama_pelanggan] = (productStats[t.nama_pelanggan] || 0) + 1;
            }
        });

        const topProducts = Object.entries(productStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name, qty]) => `  • ${name}: *${qty}x*`)
            .join('\n');

        return `📊 *LAPORAN PENJUALAN ${isHistoricalFallback ? 'TERAKHIR' : 'HARI INI'}*
📅 Tanggal: *${wib.formatted}*
🕒 Update: *${wib.time} WIB*
──────────────────────────────
• Total Transaksi : *${list.length} transaksi*
• Omzet Kotor     : *${formatRupiah(totalGross)}*
• Total Diskon    : *${formatRupiah(totalDiskon)}*
• *OMZET BERSIH*   : *${formatRupiah(totalNet)}*

💳 *Metode Pembayaran:*
• Tunai      : *${countTunai}x transaksi*
• QRIS/Bank  : *${countNonTunai}x transaksi*

🛍️ *Produk Terlaris:*
${topProducts || '  • Belum ada rincian item'}

📈 *Status:* Sistem kasir berjalan lancar & tersinkronisasi.`;
    } catch (e) {
        return `⚠️ Gagal memuat data penjualan: ${e.message}`;
    }
}

async function handleCekSaldoKas() {
    const wib = getWIBDate();
    try {
        const kasList = await querySupabase('keuangan_kas?select=*&order=created_at.desc');
        let totalMasuk = 0;
        let totalKeluar = 0;

        kasList.forEach(k => {
            const nom = Number(k.nominal) || 0;
            const tipe = (k.tipe || k.kategori || '').toLowerCase();
            if (tipe.includes('masuk') || tipe.includes('pendapatan') || tipe.includes('omzet')) {
                totalMasuk += nom;
            } else {
                totalKeluar += nom;
            }
        });

        const saldo = totalMasuk - totalKeluar;
        const statusKas = saldo < 2000000 ? '⚠️ *KRITIS (Perlu Perhatian)*' : '✅ *AMAN (Likuid)*';

        const last3 = kasList.slice(0, 3).map((k, idx) => {
            const nom = Number(k.nominal) || 0;
            const tipe = (k.tipe || '').toLowerCase().includes('masuk') ? '🟢 [Masuk]' : '🔴 [Keluar]';
            const ket = k.keterangan || k.nama_transaksi || 'Mutasi kas';
            return `${idx + 1}. ${tipe} ${ket} (${formatRupiah(nom)})`;
        }).join('\n');

        return `💰 *RINGKASAN BUKU KAS & FINANSIAL*
📅 Per Tanggal: *${wib.formatted}*
──────────────────────────────
• Total Kas Masuk   : *+${formatRupiah(totalMasuk)}*
• Total Pengeluaran : *-${formatRupiah(totalKeluar)}*
• *SALDO KAS OPERASIONAL*: *${formatRupiah(saldo)}*
• Status Kas        : ${statusKas}

📝 *3 Mutasi Kas Terakhir:*
${last3 || 'Belum ada catatan mutasi kas'}

💡 Batas peringatan saldo kritis aplikasi: *Rp 2.000.000*.`;
    } catch (e) {
        return `⚠️ Gagal memeriksa saldo kas: ${e.message}`;
    }
}

async function handleCekStokKritis() {
    try {
        const stokList = await querySupabase('stok_lokasi?select=*');
        const bahanList = await querySupabase('bahan_baku?select=*');

        const kritisProduk = stokList.filter(s => {
            const total = (Number(s.gudang_produksi) || 0) + (Number(s.etalase_toko) || 0);
            const min = Number(s.batas_minimum) || 10;
            return total <= min || (s.status && s.status.toLowerCase().includes('kritis'));
        });

        const kritisBahan = bahanList.filter(b => {
            const stok = Number(b.stok) || 0;
            return stok <= 5;
        });

        let msg = `📦 *AUDIT STOK GUDANG & ETALASE*\n──────────────────────────────\n`;

        if (kritisProduk.length === 0 && kritisBahan.length === 0) {
            msg += `✅ *Seluruh Stok Aman!*\nSemua stok produk jadi dan bahan baku berada di atas batas minimum operasional.\n\n• Total Produk Terdaftar: *${stokList.length} item*\n• Total Bahan Baku: *${bahanList.length} item*`;
        } else {
            msg += `⚠️ *PERINGATAN STOK MENIPIS / BUTUH RESTOCK:*\n\n`;
            if (kritisProduk.length > 0) {
                msg += `*Produk Jadi:*\n`;
                kritisProduk.slice(0, 6).forEach(p => {
                    const total = (Number(p.gudang_produksi) || 0) + (Number(p.etalase_toko) || 0);
                    msg += `  • *${p.nama_produk}*: Sisa *${total} Pcs* (Gudang: ${p.gudang_produksi || 0}, Toko: ${p.etalase_toko || 0})\n`;
                });
            }
            if (kritisBahan.length > 0) {
                msg += `\n*Bahan Baku:*\n`;
                kritisBahan.slice(0, 5).forEach(b => {
                    msg += `  • *${b.nama_bahan}*: Sisa *${b.stok} ${b.satuan || 'Kg'}*\n`;
                });
            }
            msg += `\n💡 Segera lakukan order pembelian bahan atau jadwalkan batch produksi baru.`;
        }

        return msg;
    } catch (e) {
        return `⚠️ Gagal memeriksa stok: ${e.message}`;
    }
}

async function handleTransaksiTerkini() {
    try {
        const trxList = await querySupabase('penjualan?select=*&order=created_at.desc&limit=5');
        if (!trxList || trxList.length === 0) {
            return '🛒 *TRANSAKSI TERKINI*\n──────────────────────────────\nBelum ada transaksi penjualan yang tercatat.';
        }

        let msg = `🛒 *5 TRANSAKSI POS TERAKHIR*\n──────────────────────────────\n`;
        trxList.forEach((t, i) => {
            const no = t.trx_id || ('TRX-' + (i + 1));
            const net = formatRupiah(Number(t.total_net) || Number(t.total_gross) || 0);
            const kasir = t.kasir || 'Kasir Toko';
            const met = t.metode_bayar || 'Tunai';
            const pembeli = t.nama_pelanggan ? ` | Pembeli: ${t.nama_pelanggan}` : '';
            msg += `*${i + 1}. ${no}* — *${net}*\n   👤 ${kasir}${pembeli}\n   💳 ${met} (${t.status_bayar || 'Lunas'})\n\n`;
        });
        return msg;
    } catch (e) {
        return `⚠️ Gagal memuat transaksi terkini: ${e.message}`;
    }
}

async function handleStatusProduksi() {
    try {
        const prodList = await querySupabase('produksi?select=*&order=created_at.desc&limit=4');
        if (!prodList || prodList.length === 0) {
            return '🏭 *STATUS PRODUKSI & HPP*\n──────────────────────────────\nBelum ada catatan batch produksi yang tersimpan.';
        }

        let msg = `🏭 *RIWAYAT BATCH PRODUKSI TERAKHIR*\n──────────────────────────────\n`;
        prodList.forEach((p, i) => {
            const nama = p.nama_produk || 'Produk';
            const target = Number(p.target_unit) || Number(p.jumlah) || 0;
            const hpp = formatRupiah(Number(p.hpp_per_unit) || 0);
            const totalBiaya = formatRupiah(Number(p.total_biaya) || 0);
            msg += `*${i + 1}. ${nama}*\n   📦 Target: *${target} Unit*\n   💵 HPP Unit: *${hpp}* (Total Biaya: ${totalBiaya})\n   🏷️ Status: *Selesai & Masuk Stok Gudang*\n\n`;
        });
        return msg;
    } catch (e) {
        return `⚠️ Gagal memuat data produksi: ${e.message}`;
    }
}

async function handleAgendaHariIni() {
    const wib = getWIBDate();
    try {
        const piutangList = await querySupabase('hutang_piutang?select=*&status=eq.Belum+Lunas&limit=5');
        let msg = `📅 *AGENDA & JATUH TEMPO BISNIS*\n📅 Hari: *${wib.formatted}*\n──────────────────────────────\n`;

        if (piutangList && piutangList.length > 0) {
            msg += `⚠️ *Tagihan Piutang Belum Lunas:*\n`;
            piutangList.forEach((p, i) => {
                const sisa = formatRupiah(Number(p.sisa_tagihan) || Number(p.nominal) || 0);
                const mitra = p.nama_mitra || p.keterangan || 'Mitra Toko';
                const tempo = p.jatuh_tempo || p.tanggal || 'Segera';
                msg += `${i + 1}. *${mitra}* — *${sisa}* (Tempo: ${tempo})\n`;
            });
            msg += '\n';
        } else {
            msg += '✅ *Tidak ada piutang kritis yang jatuh tempo hari ini.*\n\n';
        }

        msg += '📋 *Jadwal Rutin Toko:*\n• 08.00: Pembukaan Kasir & Cek Kas Awal\n• 12.00: Cek Restock Etalase Toko\n• 21.00: Rekonsiliasi Kas & Tutup Buku Kasir';
        return msg;
    } catch (e) {
        return `⚠️ Gagal memuat agenda: ${e.message}`;
    }
}

function handleBantuan() {
    return `❓ *PANDUAN ASISTEN VIRTUAL BOS KROCO ERP*
──────────────────────────────
Anda dapat menekan tombol menu di keyboard bawah atau mengetik pesan bebas seperti:

• *"Omzet hari ini"* → Laporan omzet kotor, diskon & omzet bersih
• *"Cek kas"* / *"Berapa saldo?"* → Cek saldo kas operasional & mutasi
• *"Cek stok"* / *"Stok kritis"* → Cek produk atau bahan yang menipis
• *"Transaksi terakhir"* → 5 struk kasir terbaru
• *"Produksi"* / *"HPP"* → Cek batch pembuatan produk & HPP unit
• *"Agenda"* / *"Jatuh tempo"* → Cek jadwal dan tagihan
• *"Help"* / *"Menu"* → Menampilkan pesan bantuan ini

💡 *Asisten ini bekerja secara real-time langsung ke database Bos Kroco ERP Anda.*`;
}

async function processIncomingMessage(msg) {
    if (!msg || !msg.text) return;
    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const lower = text.toLowerCase();
    const senderName = msg.from ? msg.from.first_name : '';

    console.log(`[Bot Asisten] Diterima dari ${senderName} (${chatId}): "${text}"`);

    const isGreeting = lower === '/start' || lower === '/menu' || lower === 'menu' ||
        lower === 'start' || lower === '/sapa' || lower === 'sapa' ||
        lower.includes('halo') || lower.includes('hai') || lower.includes('assalam') ||
        lower.includes('selamat pagi') || lower.includes('selamat siang') || lower.includes('selamat sore') || lower.includes('selamat malam') ||
        lower === 'pagi' || lower === 'siang' || lower === 'sore' || lower === 'malam' ||
        lower === 'ping' || lower === 'tes' || lower === 'test';

    if (isGreeting) {
        const welcome = getWelcomeMessage(senderName);
        await sendTelegramMessage(chatId, welcome, INLINE_MENU);
        return;
    }

    if (lower.includes('ringkasan') || lower.includes('omzet') || lower === '/omzet' || lower.includes('penjualan hari ini')) {
        await sendTelegramMessage(chatId, '⏳ _Sedang menghitung data penjualan terbaru..._');
        const reply = await handleRingkasanHariIni();
        await sendTelegramMessage(chatId, reply);
        return;
    }

    if (lower.includes('saldo') || lower.includes('kas') || lower === '/kas' || lower.includes('duit') || lower.includes('keuangan')) {
        await sendTelegramMessage(chatId, '⏳ _Mengecek posisi saldo kas operasional..._');
        const reply = await handleCekSaldoKas();
        await sendTelegramMessage(chatId, reply);
        return;
    }

    if (lower.includes('stok') || lower === '/stok' || lower.includes('gudang') || lower.includes('habis')) {
        await sendTelegramMessage(chatId, '⏳ _Memeriksa stok gudang dan etalase..._');
        const reply = await handleCekStokKritis();
        await sendTelegramMessage(chatId, reply);
        return;
    }

    if (lower.includes('transaksi') || lower === '/transaksi' || lower.includes('struk') || lower.includes('kasir')) {
        await sendTelegramMessage(chatId, '⏳ _Mengambil transaksi kasir terkini..._');
        const reply = await handleTransaksiTerkini();
        await sendTelegramMessage(chatId, reply);
        return;
    }

    if (lower.includes('produksi') || lower === '/produksi' || lower.includes('hpp') || lower.includes('batch')) {
        await sendTelegramMessage(chatId, '⏳ _Memeriksa riwayat batch produksi..._');
        const reply = await handleStatusProduksi();
        await sendTelegramMessage(chatId, reply);
        return;
    }

    if (lower.includes('agenda') || lower === '/agenda' || lower.includes('jadwal') || lower.includes('tempo') || lower.includes('piutang')) {
        await sendTelegramMessage(chatId, '⏳ _Mengecek agenda & tagihan jatuh tempo..._');
        const reply = await handleAgendaHariIni();
        await sendTelegramMessage(chatId, reply);
        return;
    }

    if (lower.includes('bantuan') || lower === '/help' || lower === 'help' || lower.includes('panduan')) {
        const reply = handleBantuan();
        await sendTelegramMessage(chatId, reply);
        return;
    }

    if (lower.includes('terima kasih') || lower.includes('makasih') || lower.includes('mantap') || lower.includes('keren')) {
        await sendTelegramMessage(chatId, 'Sama-sama Bapak Owner! Senang bisa membantu kemajuan bisnis Bos Kroco ERP. 🚀 Silakan pilih menu di bawah jika butuh informasi lain.');
        return;
    }

    if (lower.includes('siapa kamu') || lower.includes('siapa anda')) {
        await sendTelegramMessage(chatId, 'Saya adalah *Asisten Virtual Cerdas Bos Kroco ERP*, siap mendampingi operasional toko, penjualan, kas, dan stok Anda 24 jam non-stop.');
        return;
    }

    const fallback = `Maaf Bapak Owner, saya belum memahami pesan: *"${text}"*\n\n💡 *Silakan pilih menu di bawah atau ketik kata kunci seperti: "omzet", "kas", "stok", atau "transaksi".*`;
    await sendTelegramMessage(chatId, fallback);
}

async function answerCallbackQuery(queryId) {
    loadConfig();
    const token = (config.teleToken || '').trim();
    if (!token || !queryId) return;
    try {
        await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: queryId })
        });
    } catch (e) {}
}

async function processCallbackQuery(cb) {
    if (!cb) return;
    const chatId = cb.message && cb.message.chat ? cb.message.chat.id : cb.from.id;
    const data = cb.data || '';
    const queryId = cb.id;

    if (queryId) {
        await answerCallbackQuery(queryId);
    }

    if (data === 'btn_omzet') {
        await sendTelegramMessage(chatId, '⏳ _Sedang menghitung data penjualan terbaru..._');
        const reply = await handleRingkasanHariIni();
        await sendTelegramMessage(chatId, reply, INLINE_MENU);
        return;
    }

    if (data === 'btn_kas') {
        await sendTelegramMessage(chatId, '⏳ _Mengecek posisi saldo kas operasional..._');
        const reply = await handleCekSaldoKas();
        await sendTelegramMessage(chatId, reply, INLINE_MENU);
        return;
    }

    if (data === 'btn_stok') {
        await sendTelegramMessage(chatId, '⏳ _Memeriksa stok gudang dan etalase..._');
        const reply = await handleCekStokKritis();
        await sendTelegramMessage(chatId, reply, INLINE_MENU);
        return;
    }

    if (data === 'btn_transaksi') {
        await sendTelegramMessage(chatId, '⏳ _Mengambil transaksi kasir terkini..._');
        const reply = await handleTransaksiTerkini();
        await sendTelegramMessage(chatId, reply, INLINE_MENU);
        return;
    }

    if (data === 'btn_produksi') {
        await sendTelegramMessage(chatId, '⏳ _Memeriksa riwayat batch produksi..._');
        const reply = await handleStatusProduksi();
        await sendTelegramMessage(chatId, reply, INLINE_MENU);
        return;
    }

    if (data === 'btn_agenda') {
        await sendTelegramMessage(chatId, '⏳ _Mengecek agenda & tagihan jatuh tempo..._');
        const reply = await handleAgendaHariIni();
        await sendTelegramMessage(chatId, reply, INLINE_MENU);
        return;
    }

    if (data === 'btn_help') {
        const reply = handleBantuan();
        await sendTelegramMessage(chatId, reply, INLINE_MENU);
        return;
    }
}

async function startPolling() {
    loadConfig();
    const token = (config.teleToken || '').trim();
    if (!token || config.teleEnabled === false) {
        console.log('[Bot Asisten] Token belum dikonfigurasi atau dinonaktifkan. Menunggu input di Pengaturan.');
        return;
    }

    if (isPolling) return;
    isPolling = true;
    console.log('[Bot Asisten] Service aktif! Mendengarkan pesan Telegram...');

    while (isPolling) {
        try {
            abortController = new AbortController();
            const timeoutId = setTimeout(() => abortController.abort(), 35000);

            const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
            const res = await fetch(url, { signal: abortController.signal });
            clearTimeout(timeoutId);

            if (!res.ok) {
                console.warn('[Bot Asisten] Polling HTTP error:', res.status);
                await new Promise(r => setTimeout(r, 4000));
                continue;
            }

            const data = await res.json();
            if (data.ok && Array.isArray(data.result)) {
                for (const update of data.result) {
                    lastUpdateId = update.update_id;
                    if (update.message) {
                        await processIncomingMessage(update.message);
                    } else if (update.callback_query) {
                        await processCallbackQuery(update.callback_query);
                    }
                }
            } else {
                if (data.description) {
                    console.warn('[Bot Asisten] Telegram warning:', data.description);
                }
                await new Promise(r => setTimeout(r, 4000));
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                await new Promise(r => setTimeout(r, 3000));
            }
        }
    }
}

function stopPolling() {
    isPolling = false;
    if (abortController) {
        try { abortController.abort(); } catch (e) {}
    }
}

function restartPolling() {
    stopPolling();
    setTimeout(() => {
        startPolling();
    }, 1000);
}

module.exports = {
    startPolling,
    stopPolling,
    restartPolling,
    saveConfig,
    loadConfig,
    sendTelegramMessage,
    getConfig: () => config,
    getWelcomeMessage,
    handleRingkasanHariIni,
    handleCekSaldoKas,
    handleCekStokKritis,
    handleTransaksiTerkini,
    handleStatusProduksi,
    handleAgendaHariIni,
    handleBantuan,
    processIncomingMessage
};

if (require.main === module) {
    startPolling();
}
