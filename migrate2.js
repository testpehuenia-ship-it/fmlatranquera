require('dotenv').config();
const { createClient } = require('@libsql/client');

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function runMigration() {
    try {
        await db.execute("ALTER TABLE news ADD COLUMN is_auto INTEGER DEFAULT 0;");
        console.log("Migration successful");
    } catch (err) {
        if (err.message.includes("duplicate column")) {
            console.log("Column already exists");
        } else {
            console.error("Migration error:", err.message);
        }
    }
}

runMigration();
