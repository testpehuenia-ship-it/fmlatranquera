require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { createClient } = require('@libsql/client');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Parser = require('rss-parser');
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
    await db.execute(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        location TEXT,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_read INTEGER DEFAULT 0
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        day TEXT,
        month TEXT,
        title TEXT,
        location TEXT
    )`);
    await db.execute(`CREATE TABLE IF NOT EXISTS ads (
        slot INTEGER PRIMARY KEY,
        image_url TEXT,
        link_url TEXT
    )`);
    try { await db.execute('ALTER TABLE news ADD COLUMN is_auto INTEGER DEFAULT 0'); } catch(e) {}
    try { await db.execute('ALTER TABLE news ADD COLUMN link_url TEXT'); } catch(e) {}
    // Update existing news to JULIO 2026 for demo
    await db.execute(`UPDATE news SET date = 'JULIO 2026' WHERE date != 'JULIO 2026'`);
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}
initDb();

const https = require('https');
const http = require('http');

function fetchOgImage(url) {
    return new Promise((resolve) => {
        if (!url || !url.startsWith('http')) return resolve('');
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchOgImage(res.headers.location).then(resolve);
            }
            
            let data = '';
            res.on('data', chunk => {
                data += chunk.toString();
                const match = data.match(/<meta[^>]*property="og:image"[^>]*content="([^">]+)"/i) || data.match(/<meta[^>]*name="twitter:image"[^>]*content="([^">]+)"/i);
                if (match) {
                    req.destroy();
                    resolve(match[1]);
                } else if (data.includes('</head>')) {
                    req.destroy();
                    resolve('');
                }
            });
            res.on('end', () => {
                const match = data.match(/<meta[^>]*property="og:image"[^>]*content="([^">]+)"/i);
                resolve(match ? match[1] : '');
            });
        }).on('error', () => {
            resolve('');
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            resolve('');
        });
    });
}

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

const uploadToCloudinaryWebP = (buffer) => {
  return new Promise((resolve, reject) => {
      let cld_upload_stream = cloudinary.uploader.upload_stream(
        { folder: "fmlatranquera", format: "webp", resource_type: "auto" },
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

app.patch('/api/news/:id/main', async (req, res) => {
    try {
        await db.execute("UPDATE news SET is_main = 0");
        await db.execute({
            sql: "UPDATE news SET is_main = 1 WHERE id = ?",
            args: [req.params.id]
        });
        res.json({ message: "success" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/news', upload.single('image'), async (req, res) => {
    try {
        const rsCount = await db.execute("SELECT COUNT(*) as count FROM news");
        if (rsCount.rows[0].count >= 3) {
            return res.status(400).json({ error: "No puedes agregar más de 3 noticias." });
        }

        const { title, excerpt, date, is_main } = req.body;
        let imageUrl = '';
        
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            imageUrl = result.secure_url;
        }

        const isMainInt = is_main === '1' || is_main === 'true' || is_main === 1 ? 1 : 0;
        
        const rs = await db.execute({
            sql: `INSERT INTO news (title, excerpt, date, image_url, is_main, is_auto) VALUES (?, ?, ?, ?, ?, 0)`,
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

// --- Messages API ---

app.post('/api/messages', async (req, res) => {
    try {
        const { name, location, content } = req.body;
        const rs = await db.execute({
            sql: `INSERT INTO messages (name, location, content) VALUES (?, ?, ?)`,
            args: [name, location, content]
        });
        res.json({ message: "success", id: Number(rs.lastInsertRowid) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let sql = "SELECT * FROM messages";
        let args = [];
        
        if (startDate && endDate) {
            sql += " WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)";
            args = [startDate, endDate];
        } else if (startDate) {
            sql += " WHERE date(created_at) >= date(?)";
            args = [startDate];
        } else if (endDate) {
            sql += " WHERE date(created_at) <= date(?)";
            args = [endDate];
        }
        
        sql += " ORDER BY id DESC";

        const rs = await db.execute({ sql, args });
        const data = rs.rows.map(row => ({
            ...row,
            is_read: row.is_read === 1
        }));
        res.json({ message: "success", data });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.patch('/api/messages/:id/read', async (req, res) => {
    try {
        const { is_read } = req.body;
        const isReadInt = is_read ? 1 : 0;
        await db.execute({
            sql: `UPDATE messages SET is_read = ? WHERE id = ?`,
            args: [isReadInt, req.params.id]
        });
        res.json({ message: "success" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/messages', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let sql = "DELETE FROM messages";
        let args = [];
        
        if (startDate && endDate) {
            sql += " WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)";
            args = [startDate, endDate];
        } else if (startDate) {
            sql += " WHERE date(created_at) >= date(?)";
            args = [startDate];
        } else if (endDate) {
            sql += " WHERE date(created_at) <= date(?)";
            args = [endDate];
        }
        
        const rs = await db.execute({ sql, args });
        res.json({ message: "deleted", changes: rs.rowsAffected });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- News Update API ---
app.put('/api/news/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, excerpt, date, is_main } = req.body;
        const isMainInt = is_main === '1' || is_main === 'true' || is_main === 1 ? 1 : 0;
        
        let updateSql = `UPDATE news SET title = ?, excerpt = ?, date = ?, is_main = ?`;
        let args = [title, excerpt, date, isMainInt];

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            updateSql += `, image_url = ?`;
            args.push(result.secure_url);
        }

        updateSql += ` WHERE id = ?`;
        args.push(req.params.id);

        await db.execute({ sql: updateSql, args });
        res.json({ message: "success" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- Events API ---
app.get('/api/events', async (req, res) => {
    try {
        const rs = await db.execute("SELECT * FROM events ORDER BY id ASC");
        res.json({ message: "success", data: rs.rows });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/events', async (req, res) => {
    try {
        const rsCount = await db.execute("SELECT COUNT(*) as count FROM events");
        if (rsCount.rows[0].count >= 3) {
            return res.status(400).json({ error: "No puedes agregar más de 3 eventos." });
        }
        
        const { day, month, title, location } = req.body;
        const rs = await db.execute({
            sql: `INSERT INTO events (day, month, title, location, is_auto) VALUES (?, ?, ?, ?, 0)`,
            args: [day, month, title, location]
        });
        res.json({ message: "success", id: Number(rs.lastInsertRowid) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/events/:id', async (req, res) => {
    try {
        const rs = await db.execute({
            sql: 'DELETE FROM events WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ message: "deleted", changes: rs.rowsAffected });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- RSS Cron API ---
app.get('/api/cron/rss', async (req, res) => {
    try {
        const force = req.query.force === 'true';
        const rs = await db.execute("SELECT key, value FROM settings WHERE key IN ('rss_url', 'rss_time', 'events_rss_url')");
        let rssUrl = '';
        let rssTime = '';
        let eventsRssUrl = '';
        rs.rows.forEach(r => {
            if (r.key === 'rss_url') rssUrl = r.value;
            if (r.key === 'rss_time') rssTime = r.value;
            if (r.key === 'events_rss_url') eventsRssUrl = r.value;
        });

        if (!rssTime) {
            return res.json({ message: "RSS time not configured" });
        }

        const targetHour = parseInt(rssTime.split(':')[0], 10);
        const d = new Date();
        const currentHour = new Date(d.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })).getHours();

        if (currentHour !== targetHour && !force) {
            return res.json({ message: `Not the right time. Current: ${currentHour}, Target: ${targetHour}` });
        }

        const parser = new Parser({
            requestOptions: {
                rejectUnauthorized: false
            },
            customFields: {
                item: [
                    ['media:content', 'mediaContent', {keepArray: true}],
                    ['content:encoded', 'contentEncoded']
                ]
            }
        });
        let logs = [];

        // News RSS
        if (rssUrl) {
            try {
                await db.execute('DELETE FROM news WHERE is_auto = 1');
                
                const rsCountNews = await db.execute("SELECT COUNT(*) as count FROM news WHERE is_auto = 0");
                const manualNewsCount = rsCountNews.rows[0].count;
                const newsSpotsLeft = 3 - manualNewsCount;

                if (newsSpotsLeft > 0) {
                    const feed = await parser.parseURL(rssUrl);
                    let inserted = 0;
                    if (feed.items && feed.items.length > 0) {
                        await db.execute('UPDATE news SET is_main = 0');
                    }
                    for (const item of feed.items) {
                        if (inserted >= newsSpotsLeft) break;
                        
                        const title = (item.title || 'Noticia RSS').substring(0, 100);
                        const excerpt = item.contentSnippet ? item.contentSnippet.substring(0, 150) + '...' : 'Noticia automática';
                        const date = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
                        
                        let imageUrl = '';
                        if (item.enclosure && item.enclosure.url && (item.enclosure.type && item.enclosure.type.startsWith('image/') || item.enclosure.url.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i))) {
                            imageUrl = item.enclosure.url;
                        } else if (item.mediaContent && item.mediaContent.length > 0 && item.mediaContent[0].$) {
                            imageUrl = item.mediaContent[0].$.url;
                        } else if (item.contentEncoded || item.content) {
                            const content = item.contentEncoded || item.content;
                            const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
                            if (imgMatch) {
                                imageUrl = imgMatch[1];
                            }
                        }
                        
                        const linkUrl = item.link || '#';
                        if (!imageUrl && linkUrl !== '#') {
                            imageUrl = await fetchOgImage(linkUrl);
                        }
                        
                        const isMain = inserted === 0 ? 1 : 0;
                        await db.execute({
                            sql: `INSERT INTO news (title, excerpt, date, image_url, is_main, is_auto, link_url) VALUES (?, ?, ?, ?, ?, 1, ?)`,
                            args: [title, excerpt, date, imageUrl, isMain, linkUrl]
                        });
                        inserted++;
                    }
                    logs.push(`Inserted ${inserted} auto news`);
                } else {
                    logs.push("No spots left for auto news");
                }
            } catch (err) {
                logs.push(`Error in news RSS: ${err.message}`);
            }
        }

        // Events RSS
        if (eventsRssUrl) {
            try {
                await db.execute('DELETE FROM events WHERE is_auto = 1');
                
                const rsCount = await db.execute("SELECT COUNT(*) as count FROM events WHERE is_auto = 0");
                const manualCount = rsCount.rows[0].count;
                const spotsLeft = 3 - manualCount;

                if (spotsLeft > 0) {
                    const eFeed = await parser.parseURL(eventsRssUrl);
                    let inserted = 0;
                    for (const item of eFeed.items) {
                        if (inserted >= spotsLeft) break;
                        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
                        const dayStr = pubDate.getDate().toString();
                        const monthStr = pubDate.toLocaleString('es-AR', { month: 'short' }).substring(0, 3).toUpperCase();
                        
                        const title = (item.title || 'Evento Automático').substring(0, 50);
                        const location = (item.contentSnippet || 'Evento RSS').substring(0, 60);

                        await db.execute({
                            sql: `INSERT INTO events (day, month, title, location, is_auto) VALUES (?, ?, ?, ?, 1)`,
                            args: [dayStr, monthStr, title, location]
                        });
                        inserted++;
                    }
                    logs.push(`Inserted ${inserted} auto events`);
                } else {
                    logs.push("No spots left for auto events");
                }
            } catch (err) {
                logs.push(`Error in events RSS: ${err.message}`);
            }
        }

        res.json({ message: "cron completed", logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Ads Routes
app.get('/api/ads', async (req, res) => {
    try {
        const rs = await db.execute("SELECT * FROM ads");
        res.json({ message: "success", data: rs.rows });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/ads', upload.single('image'), async (req, res) => {
    try {
        const { slot, link_url } = req.body;
        if (!slot) return res.status(400).json({ error: "Missing slot" });
        if (!req.file) return res.status(400).json({ error: "No image file provided" });

        const result = await uploadToCloudinaryWebP(req.file.buffer);
        const imageUrl = result.secure_url;

        await db.execute({
            sql: "INSERT INTO ads (slot, image_url, link_url) VALUES (?, ?, ?) ON CONFLICT(slot) DO UPDATE SET image_url=excluded.image_url, link_url=excluded.link_url",
            args: [parseInt(slot), imageUrl, link_url || '']
        });
        res.json({ message: "Ad saved successfully", url: imageUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/ads/:slot', async (req, res) => {
    try {
        await db.execute({
            sql: "DELETE FROM ads WHERE slot = ?",
            args: [req.params.slot]
        });
        res.json({ message: "deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
