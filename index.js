const express = require('express');
const multer = require('multer');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// ********** ใส่ URL Web App ล่าสุดของคุณที่นี่ **********
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwgUOVrgC5YY6oanUcMAOilp6hthVELuBi3ImmauhpHrOZJouKyOx8eVOQku6NARA0/exec'; 

aapp.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => res.render('index'));

// API Proxy (สำคัญ: ส่ง query param ไปให้ Google ด้วย)
app.get('/api/data', async (req, res) => {
    try {
        const response = await axios.get(GAS_API_URL, { params: req.query });
        res.json(response.data);
    } catch (e) { res.json([]); }
});

app.get('/api/settings', async (req, res) => {
    try {
        const response = await axios.get(GAS_API_URL, { params: { type: 'settings' } });
        res.json(response.data);
    } catch (e) { res.json({}); }
});

app.post('/api/save-settings', async (req, res) => {
    try {
        await axios.post(GAS_API_URL, { action: 'saveSettings', settings: req.body.settings });
        res.json({ status: 'success' });
    } catch (e) { res.status(500).json({ status: 'error' }); }
});

app.post('/submit', upload.single('pdfFile'), async (req, res) => {
    try {
        const file = req.file;
        let fileData = null; let fileName = null; let mimeType = null;
        if (file) {
            fileData = file.buffer.toString('base64');
            fileName = file.originalname;
            mimeType = file.mimetype;
        }
        const payload = {
            ...req.body, fileData, fileName, mimeType
        };
        await axios.post(GAS_API_URL, payload);
        res.json({ status: 'success' });
    } catch (e) { res.status(500).json({ status: 'error' }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
