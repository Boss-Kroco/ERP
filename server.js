/**
 * ============================================================================
 * BOS KROCO ERP - HIGH PERFORMANCE LOCAL SERVER & BOT ASISTEN RUNNER
 * ============================================================================
 * Menjalankan server web lokal (localhost:8080) sekaligus Bot Asisten Telegram.
 * Zero external dependencies - Murni Node.js Standard Library.
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const bot = require('./bot-asisten.js');

let PORT = 8080;
const HOST = '127.0.0.1';
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8'
};

function sendJSON(res, statusCode, obj) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
    // Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // ------------------------------------------------------------------------
    // API ROUTES
    // ------------------------------------------------------------------------

    // 1. GET /api/telegram-config
    if (req.method === 'GET' && pathname === '/api/telegram-config') {
        const cfg = bot.getConfig();
        return sendJSON(res, 200, { success: true, config: cfg });
    }

    // 2. POST /api/telegram-config
    if (req.method === 'POST' && pathname === '/api/telegram-config') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                bot.saveConfig({
                    teleToken: (data.teleToken || '').trim(),
                    teleChatId: (data.teleChatId || '').trim(),
                    teleEnabled: data.teleEnabled !== false
                });
                return sendJSON(res, 200, {
                    success: true,
                    message: 'Konfigurasi Telegram disimpan dan Bot Asisten aktif!'
                });
            } catch (err) {
                return sendJSON(res, 400, { success: false, message: err.message });
            }
        });
        return;
    }

    // 3. GET /api/bot-status
    if (req.method === 'GET' && pathname === '/api/bot-status') {
        const cfg = bot.getConfig();
        return sendJSON(res, 200, {
            success: true,
            running: true,
            hasToken: Boolean(cfg.teleToken),
            enabled: cfg.teleEnabled,
            botName: cfg.botName || 'Asisten Virtual Bos Kroco ERP'
        });
    }

    // ------------------------------------------------------------------------
    // STATIC FILE SERVING
    // ------------------------------------------------------------------------

    let relativePath = pathname;
    if (relativePath === '/' || relativePath === '') {
        relativePath = '/index.html';
    }

    const safePath = path.normalize(path.join(ROOT_DIR, relativePath));
    if (!safePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('403 Forbidden');
    }

    fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found: ' + pathname);
        }

        const ext = path.extname(safePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(safePath);
        stream.pipe(res);
    });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.warn(`[Server] Port ${PORT} sedang digunakan. Mencoba port ${PORT + 1}...`);
        PORT++;
        server.listen(PORT, HOST);
    } else {
        console.error('[Server error]:', err.message);
    }
});

server.listen(PORT, HOST, () => {
    console.log('============================================================');
    console.log('  BOS KROCO ERP - LOCAL SERVER & ASISTEN TELEGRAM RUNNER');
    console.log('============================================================');
    console.log(`  Web App       : http://${HOST}:${PORT}`);
    console.log(`  Localhost     : http://localhost:${PORT}`);
    console.log('============================================================');

    // Jalankan service bot Telegram
    try {
        bot.startPolling();
    } catch (e) {
        console.warn('[Server] Bot startup warning:', e.message);
    }

    // Buka browser otomatis
    const openCmd = process.platform === 'win32' ? `start http://localhost:${PORT}` : `open http://localhost:${PORT}`;
    exec(openCmd, () => {});
});
