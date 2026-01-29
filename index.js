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
        console.log("------------------------------------------------");
        console.log("1. กำลังเรียกข้อมูล Settings จาก Google...");
        
        const response = await axios.get(`${GAS_API_URL}?type=settings`);
        
        console.log("2. สถานะตอบกลับ (Status):", response.status);
        console.log("3. ประเภทข้อมูล (Content-Type):", response.headers['content-type']);
        
        // ลองแปลงข้อมูลเป็น String เพื่อดูว่าหน้าตาเป็นยังไง
        const dataString = JSON.stringify(response.data);
        console.log("4. ข้อมูลที่ได้ (Data Preview):", dataString.substring(0, 200)); // ดูแค่ 200 ตัวอักษรแรก

        // เช็คว่าเป็น HTML หรือเปล่า (ถ้าใช่ แสดงว่า URL ผิด หรือ สิทธิ์ผิด)
        if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
            console.error("!!! ERROR: ได้รับ HTML แทนที่จะเป็น JSON (สิทธิ์การเข้าถึงอาจจะผิด)");
            // บังคับส่งค่า Default ให้หน้าเว็บทำงานต่อได้
            return res.json({
                sheet: [{ label: "สมุดสำรอง (Connection Error)", value: "Sheet1" }]
            });
        }

        if (typeof response.data !== 'object') {
            console.error("!!! ERROR: รูปแบบข้อมูลไม่ถูกต้อง");
            res.json({});
        } else {
            console.log(">>> สำเร็จ! ส่งข้อมูลไปหน้าเว็บ");
            res.json(response.data);
        }
        console.log("------------------------------------------------");

    } catch (error) {
        console.error("!!! CRITICAL ERROR:", error.message);
        // กรณีเชื่อมต่อไม่ได้จริงๆ ส่งค่าว่างกลับไป
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

