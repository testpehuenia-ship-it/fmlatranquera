require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
    try {
        await db.execute('ALTER TABLE events ADD COLUMN is_auto INTEGER DEFAULT 0');
        console.log('Migration successful');
    } catch (e) {
        console.error('Migration failed:', e.message);
    }
}
run();
