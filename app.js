// Import necessary modules
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000; // Define the port for the server to listen on

// Set EJS as the view engine (อาจจะไม่ได้ใช้ในบริบทนี้ แต่เก็บไว้ถ้ามีหน้าที่ต้อง render)
app.set('view engine', 'ejs');
// Specify the directory for view files (HTML templates)
app.set('views', path.join(__dirname, 'views'));

// Middleware to process URL-encoded form data (from HTML forms)
app.use(express.urlencoded({ extended: true }));
// Middleware เพื่อประมวลผลข้อมูล JSON (สำคัญสำหรับการรับข้อมูลจาก frontend เช่น fetch API)
app.use(express.json()); 

// Middleware เพื่อให้บริการไฟล์ Static
// __dirname คือพาธของ directory ปัจจุบันที่ script กำลังรันอยู่
// เราใช้ express.static เพื่อให้ไฟล์ใน directory นี้ (รวมถึง index.html) สามารถเข้าถึงได้
app.use(express.static(__dirname)); 
app.use(express.static(path.join(__dirname, 'public'))); // เผื่อมีโฟลเดอร์ public ด้วย

// กำหนดโฟลเดอร์สำหรับบันทึกข้อมูล
const dataFolder = 'Data';
const dataFolderPath = path.join(__dirname, dataFolder);

// สร้างโฟลเดอร์ Data ถ้ายังไม่มี
if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath, { recursive: true }); // recursive: true ensures parent directories are created if needed
    console.log(`Folder '${dataFolder}' has been created at: ${dataFolderPath}`);
}

// Route หลักสำหรับแสดงหน้าเว็บ index.html
// เมื่อเข้าสู่ http://localhost:3000/ จะแสดงหน้านี้
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // ตรวจสอบชื่อไฟล์ HTML ของคุณ
});

// Route สำหรับรับข้อมูลค่าห้องจาก Form เมื่อมีการ Submit (จากตัวอย่างเดิมที่เคยทำ)
// อาจจะไม่มีใช้ในโปรเจกต์ปัจจุบัน แต่เก็บไว้เผื่ออนาคต
app.post('/save-data', (req, res) => {
    const { month, year, roomNumber, rent, electricity, water } = req.body;
    if (!month || !year || !roomNumber || !rent || !electricity || !water) {
        return res.status(400).send('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
    const parsedRent = parseFloat(rent);
    const parsedElectricity = parseFloat(electricity);
    const parsedWater = parseFloat(water);
    if (isNaN(parsedRent) || isNaN(parsedElectricity) || isNaN(parsedWater)) {
        return res.status(400).send('ค่าเช่า, ค่าไฟ, ค่าน้ำ ต้องเป็นตัวเลข');
    }
    const total = parsedRent + parsedElectricity + parsedWater;
    const roomData = { month, year: parseInt(year), roomNumber, rent: parsedRent, electricity: parsedElectricity, water: parsedWater, total };
    const dataToSave = `
เดือน: ${roomData.month} ${roomData.year}
ห้อง: ${roomData.roomNumber}
ค่าเช่า: ${roomData.rent} บาท
ค่าไฟ: ${roomData.electricity} บาท
ค่าน้ำ: ${roomData.water} บาท
รวมทั้งหมด: ${roomData.total} บาท
--------------------
`;
    const fileName = `room_data_${roomData.month}_${roomData.year}_${roomData.roomNumber}.txt`;
    const filePath = path.join(dataFolderPath, fileName);

    fs.writeFile(filePath, dataToSave, { encoding: 'utf8', flag: 'a' }, (err) => {
        if (err) {
            console.error('Error saving file:', err);
            res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } else {
            console.log(`Room data saved to: ${filePath}`);
            res.send(`
                <!DOCTYPE html>
                <html lang="th">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>บันทึกข้อมูลสำเร็จ</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                        .container { background-color: #e6ffe6; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; max-width: 500px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        h1 { color: #28a745; }
                        p { margin-bottom: 20px; }
                        a { color: #007bff; text-decoration: none; }
                        a:hover { text-decoration: underline; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>บันทึกข้อมูลค่าห้องสำเร็จ!</h1>
                        <p>ข้อมูลสำหรับห้อง ${roomData.roomNumber} เดือน ${roomData.month} ${roomData.year} ได้ถูกบันทึกแล้ว</p>
                        <p><a href="/">กลับไปหน้าบันทึกข้อมูล</a></p>
                    </div>
                </body>
                </html>
            `);
        }
    });
});

// ************************************************************
// ************ Route สำหรับบันทึกคะแนนนักเรียนรายเดือน ************
// ************************************************************
app.post('/save-student-scores', (req, res) => {
    const { studentId, studentName, scores } = req.body;

    if (!studentId || !studentName || !scores) {
        return res.status(400).json({ message: 'Missing student ID, name, or scores data.' });
    }

    let fileContent = `ข้อมูลคะแนนนักเรียน: ${studentName} (รหัส: ${studentId})\n`;
    fileContent += `----------------------------------------\n`;
    for (const month in scores) {
        if (scores.hasOwnProperty(month)) {
            fileContent += `${month}: ${scores[month]} คะแนน\n`;
        }
    }
    fileContent += `----------------------------------------\n`;
    fileContent += `บันทึกเมื่อ: ${new Date().toLocaleString('th-TH')}\n`; // บันทึกวันที่และเวลาปัจจุบัน

    const fileName = `student_scores_${studentId}.txt`;
    const filePath = path.join(dataFolderPath, fileName);

    // ใช้ flag 'w' เพื่อเขียนทับไฟล์เดิมด้วยข้อมูลใหม่ล่าสุด (ถ้าไฟล์มีอยู่)
    // ถ้าไฟล์ไม่มีอยู่ จะสร้างไฟล์ใหม่
    fs.writeFile(filePath, fileContent, { encoding: 'utf8', flag: 'w' }, (err) => {
        if (err) {
            console.error('Error saving student scores file:', err);
            res.status(500).json({ message: 'Failed to save student scores data.' });
        } else {
            console.log(`Student scores for ${studentName} (ID: ${studentId}) saved to: ${filePath}`);
            res.status(200).json({ message: 'Student scores saved successfully.' });
        }
    });
});

// ************************************************************
// ************ Route สำหรับโหลดข้อมูลคะแนนนักเรียนรายเดือน ************
// ************************************************************
app.get('/get-student-scores/:studentId', (req, res) => {
    const studentId = req.params.studentId;
    const fileName = `student_scores_${studentId}.txt`;
    const filePath = path.join(dataFolderPath, fileName);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            // หากไฟล์ไม่พบ ถือว่ายังไม่มีคะแนนสำหรับนักเรียนคนนี้
            console.warn(`Scores file not found for student ID: ${studentId}. Returning empty scores.`);
            return res.status(200).json({ studentId, scores: {} });
        }

        // แปลงข้อมูลจากไฟล์ .txt กลับเป็น object ที่ frontend เข้าใจได้
        const scores = {};
        const lines = data.split('\n');
        // เราจะข้าม 2 บรรทัดแรก (header) และ 2 บรรทัดสุดท้าย (separator และ timestamp)
        for (let i = 2; i < lines.length - 2; i++) {
            const line = lines[i].trim();
            if (line) {
                const parts = line.split(':');
                if (parts.length === 2) {
                    const month = parts[0].trim();
                    const score = parseInt(parts[1].trim().replace(' คะแนน', '')) || 0;
                    scores[month] = score;
                }
            }
        }
        res.status(200).json({ studentId, scores });
    });
});


// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`Data saving folder: ${dataFolderPath}`);
});
