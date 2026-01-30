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

// --- API Routes ---

// 1. ดึงข้อมูล (Table Data & Sheet Names)
app.get('/api/data', async (req, res) => {
    try {
        // [จุดที่แก้ไข] ส่งต่อ req.query ไปด้วย (เช่น ?type=getSheetNames)
        const response = await axios.get(GAS_API_URL, { params: req.query });
        
        if (typeof response.data !== 'object') {
            console.error("Data Error: Received invalid format");
            res.json([]); 
        } else {
            res.json(response.data);
        }
    } catch (error) {
        console.error("Data Exception:", error.message);
        res.json([]);
    }
});

// 2. ดึง Settings
app.get('/api/settings', async (req, res) => {
    try {
        const response = await axios.get(GAS_API_URL, { params: { type: 'settings' } });
        res.json(response.data);
    } catch (error) {
        res.json({});
    }
});

// 3. บันทึก Settings
app.post('/api/save-settings', async (req, res) => {
    try {
        await axios.post(GAS_API_URL, { action: 'saveSettings', settings: req.body.settings });
        res.json({ status: 'success' });
    } catch (error) {
        res.status(500).json({ status: 'error' });
    }
});

// 4. บันทึกข้อมูล (Add/Edit)
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
        console.error("Submit Error:", error.message);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดที่ Server' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
