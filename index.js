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

// 1. ดึงข้อมูลเอกสาร (Table Data)
app.get('/api/data', async (req, res) => {
    try {
        const sheetName = req.query.sheet || 'Sheet1';
        const response = await axios.get(`${GAS_API_URL}?sheet=${encodeURIComponent(sheetName)}`);
        // ตรวจสอบว่าได้ข้อมูล JSON จริงไหม
        if (typeof response.data !== 'object') {
            console.error("Data fetch error: Received non-object", response.data);
            res.json([]);
        } else {
            res.json(response.data);
        }
    } catch (error) {
        console.error("Data fetch exception:", error.message);
        res.json([]);
    }
});

// 2. ดึงข้อมูลการตั้งค่า (Settings) **จุดสำคัญ**
app.get('/api/settings', async (req, res) => {
    try {
        // เพิ่ม Log เพื่อดูว่า Server ติดต่อ Google ได้จริงไหม
        console.log("Fetching Settings from Google..."); 
        
        const response = await axios.get(`${GAS_API_URL}?type=settings`);
        
        console.log("Response Status:", response.status);
        console.log("Response Data Preview:", JSON.stringify(response.data).substring(0, 100) + "...");

        if (typeof response.data !== 'object') {
            console.error("Settings Error: Received invalid format");
            res.json({});
        } else {
            res.json(response.data);
        }
    } catch (error) {
        console.error("Settings Exception:", error.message);
        if(error.response) console.error("Error Detail:", error.response.data);
        res.json({});
    }
});

// 3. บันทึกการตั้งค่า
app.post('/api/save-settings', async (req, res) => {
    try {
        await axios.post(GAS_API_URL, { action: 'saveSettings', settings: req.body.settings });
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Save Settings Error:", error.message);
        res.status(500).json({ status: 'error' });
    }
});

// 4. บันทึกข้อมูลแบบก้อน (Bulk Import)
app.post('/api/bulk-submit', async (req, res) => {
    try {
        await axios.post(GAS_API_URL, { action: 'bulkImport', sheetName: req.body.sheetName, rows: req.body.rows });
        res.json({ status: 'success' });
    } catch (error) {
        console.error("Bulk Import Error:", error.message);
        res.status(500).json({ status: 'error' });
    }
});

// 5. บันทึก/แก้ไขข้อมูลรายแถว
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
