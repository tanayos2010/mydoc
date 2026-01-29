const express = require('express');
const multer = require('multer');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// ********** ใส่ URL ของ Google Apps Script ที่นี่ **********
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwgUOVrgC5YY6oanUcMAOilp6hthVELuBi3ImmauhpHrOZJouKyOx8eVOQku6NARA0/exec'; 

// ตั้งค่า Environment
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());

// ตั้งค่า Multer (รับไฟล์เข้า RAM)
const upload = multer({ storage: multer.memoryStorage() });

// Route 1: หน้าแรก
app.get('/', (req, res) => {
    res.render('index');
});

// Route 2: API ดึงข้อมูล (รับ Parameter ?sheet=xxx)
app.get('/api/data', async (req, res) => {
    try {
        const sheetName = req.query.sheet || 'Sheet1';
        // ส่ง sheetName ไปบอก Google Apps Script ว่าจะเอาชีทไหน
        const response = await axios.get(`${GAS_API_URL}?sheet=${encodeURIComponent(sheetName)}`);
        res.json(response.data);
    } catch (error) {
        console.error("Error fetching data:", error.message);
        res.json([]); // ส่งอาเรย์ว่างกลับไปถ้า error
    }
});

// Route 3: API บันทึกข้อมูล
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
            // ส่งค่า action และ rowIndex (ถ้ามี) ไปให้ Google
            action: req.body.action, 
            rowIndex: req.body.rowIndex,
            oldFileUrl: req.body.oldFileUrl // ส่งลิงก์เดิมไปด้วย กรณีแก้ข้อมูลแต่ไม่อัปไฟล์ใหม่
        };

        await axios.post(GAS_API_URL, payload);

        res.json({ status: 'success', message: 'ดำเนินการสำเร็จ' });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
