const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "data.sqlite");
const dir = path.dirname(dbPath);

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const sql = new DatabaseSync(dbPath);
sql.exec(`
    CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
`);

const stmtGet = sql.prepare("SELECT value FROM kv WHERE key = ?");
const stmtSet = sql.prepare("INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)");
const stmtDel = sql.prepare("DELETE FROM kv WHERE key = ?");

function read(key) {
    const row = stmtGet.get(key);
    if (!row) return null;
    try {
        return JSON.parse(row.value);
    } catch {
        return row.value;
    }
}

function write(key, val) {
    stmtSet.run(key, JSON.stringify(val));
}

module.exports = {
    get(key) {
        return Promise.resolve(read(key));
    },
    set(key, val) {
        write(key, val);
        return Promise.resolve();
    },
    delete(key) {
        stmtDel.run(key);
        return Promise.resolve();
    },
};
