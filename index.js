const express = require('express');
const multer = require('multer');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// ********** ใส่ URL Web App ล่าสุดของคุณที่นี่ **********
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwgUOVrgC5YY6oanUcMAOilp6hthVELuBi3ImmauhpHrOZJouKyOx8eVOQku6NARA0/exec'; 

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => {
    res.render('index');
});

// API Routes
app.get('/api/data', async (req, res) => {
    try {
        const sheetName = req.query.sheet || 'Sheet1';
        const response = await axios.get(`${GAS_API_URL}?sheet=${encodeURIComponent(sheetName)}`);
        // ถ้า GAS ส่ง error หรือ html กลับมา ให้ส่ง [] ไปแทน กันเว็บพัง
        if (typeof response.data !== 'object') res.json([]);
        else res.json(response.data);
    } catch (error) { res.json([]); }
});

app.get('/api/settings', async (req, res) => {
    try {
        const response = await axios.get(`${GAS_API_URL}?type=settings`);
        if (typeof response.data !== 'object') res.json({});
        else res.json(response.data);
    } catch (error) { res.json({}); }
});

app.post('/api/save-settings', async (req, res) => {
    try {
        await axios.post(GAS_API_URL, { action: 'saveSettings', settings: req.body.settings });
        res.json({ status: 'success' });
    } catch (error) { res.status(500).json({ status: 'error' }); }
});

app.post('/api/bulk-submit', async (req, res) => {
    try {
        await axios.post(GAS_API_URL, { action: 'bulkImport', sheetName: req.body.sheetName, rows: req.body.rows });
        res.json({ status: 'success' });
    } catch (error) { res.status(500).json({ status: 'error' }); }
});

app.post('/submit', upload.single('pdfFile'), async (req, res) => {
    try {
        const file = req.file;
        let fileData = null;
        let fileName = null;
        let mimeType = null;
        if (file) {
            fileData = file.buffer.toString('base64');
            fileName = file.originalname;
            mimeType = file.mimetype;
        }
        const payload = {
            ...req.body, sheetName: req.body.sheetName,
            fileData: fileData, fileName: fileName, mimeType: mimeType,
            action: req.body.action, rowIndex: req.body.rowIndex, oldFileUrl: req.body.oldFileUrl
        };
        await axios.post(GAS_API_URL, payload);
        res.json({ status: 'success', message: 'ดำเนินการสำเร็จ' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดที่ Server' });
    }
});

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
