const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Set up database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            excerpt TEXT,
            date TEXT,
            image_url TEXT,
            is_main INTEGER DEFAULT 0
        )`);
    }
});

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// API Routes
app.get('/api/news', (req, res) => {
    db.all("SELECT * FROM news ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

app.post('/api/news', upload.single('image'), (req, res) => {
    const { title, excerpt, date, is_main } = req.body;
    let imageUrl = '';
    
    if (req.file) {
        imageUrl = '/uploads/' + req.file.filename;
    }

    const sql = `INSERT INTO news (title, excerpt, date, image_url, is_main) VALUES (?, ?, ?, ?, ?)`;
    const params = [title, excerpt, date, imageUrl, is_main ? 1 : 0];
    
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: this.lastID, title, excerpt, date, image_url: imageUrl, is_main }
        });
    });
});

app.delete('/api/news/:id', (req, res) => {
    db.run(
        'DELETE FROM news WHERE id = ?',
        req.params.id,
        function (err, result) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({ "message": "deleted", changes: this.changes });
        }
    );
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
