const BASE = process.env.SELLER_API_URL || "https://libreauth.nutexe.dev/seller-api/";

function buildParams(sellerkey, type, params = {}) {
    const body = new URLSearchParams({ sellerkey, type });
    for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== "") {
            body.set(key, String(val));
        }
    }
    return body;
}

async function sellerRequest(sellerkey, type, params = {}) {
    const body = buildParams(sellerkey, type, params);
    const text = await fetch(`${BASE}?${body.toString()}`).then((r) => r.text());
    try {
        return JSON.parse(text);
    } catch {
        return { success: true, raw: text };
    }
}

async function sellerText(sellerkey, type, params = {}) {
    const body = buildParams(sellerkey, type, params);
    return fetch(`${BASE}?${body.toString()}`).then((r) => r.text());
}

const ERROR_HINTS = {
    "Unknown seller API type":
        "Seller Key ไม่มีสิทธิ์ addkey — เปิดใน Panel → แอป → Seller API → Key Permissions",
    "Invalid sellerkey": "Seller Key ไม่ถูกต้อง หรือ IP ไม่ตรง whitelist",
    "Seller API is not available":
        "แพ็กเกจต้องเป็น Pro หรือ Enterprise ถึงจะใช้ Seller API ได้",
};

function hintForError(msg) {
    if (!msg) return null;
    for (const [key, hint] of Object.entries(ERROR_HINTS)) {
        if (String(msg).includes(key)) return hint;
    }
    return null;
}

function parseAddKeyResponse(text) {
    const raw = String(text || "").trim();
    if (!raw) return { ok: false, error: "API ตอบกลับว่างเปล่า" };

    try {
        const json = JSON.parse(raw);
        if (json.success === false) {
            return { ok: false, error: json.message || raw, hint: hintForError(json.message) };
        }
        const key =
            json.key ||
            json.license ||
            (Array.isArray(json.keys) ? json.keys[0] : null) ||
            (Array.isArray(json.key) ? json.key[0] : null);
        if (key) return { ok: true, key: String(key).trim() };
        if (typeof json.message === "string" && json.message.length > 3 && !json.message.toLowerCase().includes("seller")) {
            return { ok: true, key: json.message.trim() };
        }
        return { ok: false, error: json.message || "ไม่พบคีย์ใน response" };
    } catch {
        if (raw.startsWith("{")) {
            return { ok: false, error: raw };
        }
        return { ok: true, key: raw.split("\n")[0].trim() };
    }
}

async function createKey(sellerkey, params) {
    const text = await sellerText(sellerkey, "addkey", {
        ...params,
        format: "text",
    });
    const parsed = parseAddKeyResponse(text);
    if (parsed.ok && parsed.key) return parsed;
    return parsed.ok === false ? parsed : { ok: false, error: "สร้างคีย์ไม่สำเร็จ" };
}

async function verifySellerKey(sellerkey) {
    const json = await sellerRequest(sellerkey, "info");
    return json.success === true;
}

module.exports = {
    BASE,
    sellerRequest,
    sellerText,
    parseAddKeyResponse,
    createKey,
    verifySellerKey,
    hintForError,
};
