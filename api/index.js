require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { createClient } = require('@libsql/client');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();

// Initialize Turso
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage for Multer (Vercel has read-only filesystem)
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static files from 'public' for local testing
app.use(express.static('public'));

// Create table if it doesn't exist
async function initDb() {
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        excerpt TEXT,
        date TEXT,
        image_url TEXT,
        is_main INTEGER DEFAULT 0
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}
initDb();

// Cloudinary upload helper
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
      let cld_upload_stream = cloudinary.uploader.upload_stream(
        { folder: "fmlatranquera" },
        (error, result) => {
           if (result) {
             resolve(result);
           } else {
             reject(error);
           }
        }
      );
      streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

// API Routes
app.get('/api/news', async (req, res) => {
    try {
        const rs = await db.execute("SELECT * FROM news ORDER BY id DESC");
        // Convert integer booleans
        const data = rs.rows.map(row => ({
            ...row,
            is_main: row.is_main === 1
        }));
        res.json({
            "message": "success",
            "data": data
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

app.get('/api/settings', async (req, res) => {
    try {
        const rs = await db.execute("SELECT * FROM settings");
        const data = {};
        rs.rows.forEach(row => {
            data[row.key] = row.value;
        });
        res.json({ "message": "success", "data": data });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { key, value } = req.body;
        await db.execute({
            sql: `INSERT INTO settings (key, value) VALUES (?, ?) 
                  ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
            args: [key, value]
        });
        res.json({ "message": "success" });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

app.post('/api/news', upload.single('image'), async (req, res) => {
    try {
        const { title, excerpt, date, is_main } = req.body;
        let imageUrl = '';
        
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            imageUrl = result.secure_url;
        }

        const isMainInt = is_main === '1' || is_main === 'true' || is_main === 1 ? 1 : 0;
        
        const rs = await db.execute({
            sql: `INSERT INTO news (title, excerpt, date, image_url, is_main) VALUES (?, ?, ?, ?, ?)`,
            args: [title, excerpt, date, imageUrl, isMainInt]
        });
        
        res.json({
            "message": "success",
            "data": { id: Number(rs.lastInsertRowid), title, excerpt, date, image_url: imageUrl, is_main: isMainInt === 1 }
        });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

app.delete('/api/news/:id', async (req, res) => {
    try {
        const rs = await db.execute({
            sql: 'DELETE FROM news WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ "message": "deleted", changes: rs.rowsAffected });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Allow running locally
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.listen(3000, () => {
        console.log(`Server running locally on port 3000`);
    });
}

// Export for Vercel
module.exports = app;
