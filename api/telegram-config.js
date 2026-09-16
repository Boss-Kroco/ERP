module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method === 'GET') {
        return res.status(200).json({
            success: true,
            config: {
                teleToken: process.env.TELE_TOKEN || '',
                teleChatId: process.env.TELE_CHAT_ID || '',
                teleEnabled: true,
                botName: 'Asisten Virtual Bos Kroco ERP'
            }
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Konfigurasi diterima di cloud Vercel.'
    });
};
