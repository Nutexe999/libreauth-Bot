const { QuickDB } = require("quick.db");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.DATABASE_PATH || "./json.sqlite";

if (process.env.DATABASE_PATH) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

module.exports = new QuickDB({ filePath: dbPath });
