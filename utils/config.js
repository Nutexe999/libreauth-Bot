const dotenv = require("dotenv");
dotenv.config();

const { TOKEN, DEVELOPMENT_SERVER_ID, TYPE } = process.env;
const type = (TYPE || "development").toLowerCase();

if (!TOKEN || !TYPE) {
    console.error("[config] ต้องตั้ง environment variables:");
    console.error("  TOKEN, TYPE (และ DEVELOPMENT_SERVER_ID ถ้า TYPE=development)");
    throw new Error("Missing required environment variables: TOKEN, TYPE");
}

if (type !== "production" && !DEVELOPMENT_SERVER_ID) {
    console.error("[config] TYPE=development ต้องมี DEVELOPMENT_SERVER_ID (Guild ID)");
    throw new Error("Missing DEVELOPMENT_SERVER_ID for development mode");
}

module.exports = {
    token: TOKEN,
    DevelopmentServerId: DEVELOPMENT_SERVER_ID || null,
    type,
};
