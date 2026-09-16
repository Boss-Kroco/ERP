module.exports = (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
        success: true,
        running: true,
        platform: 'vercel',
        botName: 'Asisten Virtual Bos Kroco ERP'
    });
};
