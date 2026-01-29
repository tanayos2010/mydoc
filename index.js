const express = require('express');
const multer = require('multer');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// ********** ใส่ URL Web App ล่าสุดของคุณที่นี่ **********
const GAS_API_URL = 'https://script.google.com/macros/s/xxxxxxxxxxxxxxxxx/exec'; 

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => {
    res.render('index');
});

// API ดึงข้อมูล
app.get('/api/data', async (req, res) => {
    try {
        const sheetName = req.query.sheet || 'Sheet1';
        const response = await axios.get(`${GAS_API_URL}?sheet=${encodeURIComponent(sheetName)}`);
        res.json(response.data);
    } catch (error) {
        res.json([]);
    }
});

// API ดึง Settings
app.get('/api/settings', async (req, res) => {
    try {
        const response = await axios.get(`${GAS_API_URL}?type=settings`);
        res.json(response.data);
    } catch (error) {
        res.json({});
    }
});

// API บันทึก Settings
app.post('/api/save-settings', async (req, res) => {
    try {
        const payload = {
            action: 'saveSettings',
            settings: req.body.settings 
        };
        await axios.post(GAS_API_URL, payload);
        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error' });
    }
});

// API Bulk Import
app.post('/api/bulk-submit', async (req, res) => {
    try {
        const payload = {
            action: 'bulkImport',
            sheetName: req.body.sheetName,
            rows: req.body.rows
        };
        await axios.post(GAS_API_URL, payload);
        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error' });
    }
});

// API บันทึก/แก้ไขข้อมูล
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
            ...req.body, 
            sheetName: req.body.sheetName,
            fileData: fileData,
            fileName: fileName,
            mimeType: mimeType,
            action: req.body.action, 
            rowIndex: req.body.rowIndex,
            oldFileUrl: req.body.oldFileUrl
        };

        await axios.post(GAS_API_URL, payload);
        res.json({ status: 'success', message: 'ดำเนินการสำเร็จ' });

    } catch (error) {
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดที่ Server' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
