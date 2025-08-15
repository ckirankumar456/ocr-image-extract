const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const tesseract = require("node-tesseract-ocr");
const path = require("path");
const mysql = require("mysql2");
const app = express();
const PORT = 5000;
app.use(cors());
app.use(express.json());
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const db = mysql
  .createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "testdb",
  })
  .promise();
async function initDB() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        data LONGBLOB NOT NULL,
        mimetype VARCHAR(50) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("'images' table is ready");
  } catch (err) {
    console.error("Error creating table:", err);
  }
}
initDB();
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
app.post("/uploads", upload.array("fileUpload[]"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    let allText = "";
    for (const file of req.files) {
      const buffer = fs.readFileSync(file.path);
      await db.query(
        "INSERT INTO images (filename, data, mimetype) VALUES (?, ?, ?)",
        [file.originalname, buffer, file.mimetype]
      );
      const text = await tesseract.recognize(file.path, { lang: "eng" });
      allText += text + "\n\n";
      fs.unlinkSync(file.path);
    }
    res.json({ text: allText.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OCR failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
