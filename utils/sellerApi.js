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

async function sellerRaw(sellerkey, type, params = {}) {
    const body = buildParams(sellerkey, type, params);
    const res = await fetch(`${BASE}?${body.toString()}`);
    const text = await res.text();
    return { status: res.status, text };
}

async function sellerRequest(sellerkey, type, params = {}) {
    const { status, text } = await sellerRaw(sellerkey, type, params);
    if (status >= 500 && !text.trim()) {
        return { success: false, message: `LibreAuth API error (HTTP ${status})`, httpStatus: status };
    }
    try {
        return JSON.parse(text);
    } catch {
        return { success: true, raw: text, httpStatus: status };
    }
}

async function sellerText(sellerkey, type, params = {}) {
    const { text } = await sellerRaw(sellerkey, type, params);
    return text;
}

const ERROR_HINTS = {
    "Unknown seller API type":
        "Seller Key ไม่มีสิทธิ์ addkey — เปิดใน Panel → แอป → Seller API → Key Permissions",
    "Invalid sellerkey": "Seller Key ไม่ถูกต้อง หรือ IP ไม่ตรง whitelist",
    "Seller API is not available":
        "แพ็กเกจต้องเป็น Pro หรือ Enterprise ถึงจะใช้ Seller API ได้",
    "LibreAuth API error":
        "API addkey ล้มเหลว (HTTP 500) — เปิดสิทธิ์ **Keys / addkey** ใน Panel → Seller API แล้วสร้าง key ใหม่",
};

function hintForError(msg) {
    if (!msg) return null;
    for (const [key, hint] of Object.entries(ERROR_HINTS)) {
        if (String(msg).includes(key)) return hint;
    }
    return null;
}

function extractKey(json) {
    if (!json || typeof json !== "object") return null;
    const key =
        json.key ||
        json.license ||
        (Array.isArray(json.keys) ? json.keys[0] : null) ||
        (Array.isArray(json.key) ? json.key[0] : null);
    if (key) return String(key).trim();
    if (typeof json.message === "string") {
        const msg = json.message.trim();
        if (msg.length > 3 && !/seller|error|fail|invalid|unknown/i.test(msg)) {
            return msg;
        }
    }
    return null;
}

function parseAddKeyResponse(text, httpStatus) {
    const raw = String(text || "").trim();

    if (httpStatus >= 500 && !raw) {
        return {
            ok: false,
            error: `LibreAuth API error (HTTP ${httpStatus})`,
            hint: hintForError("LibreAuth API error"),
        };
    }

    if (!raw) {
        return {
            ok: false,
            error: "API ไม่ส่งคีย์กลับมา",
            hint: "เปิดสิทธิ์ addkey ใน Panel → Seller API → Key Permissions",
        };
    }

    try {
        const json = JSON.parse(raw);
        if (json.success === false) {
            return { ok: false, error: json.message || raw, hint: hintForError(json.message) };
        }
        const key = extractKey(json);
        if (key) return { ok: true, key };
        return { ok: false, error: json.message || "ไม่พบคีย์ใน response" };
    } catch {
        if (raw.startsWith("{")) {
            return { ok: false, error: raw };
        }
        const line = raw.split("\n").map((s) => s.trim()).find(Boolean);
        if (line) return { ok: true, key: line };
        return { ok: false, error: "ไม่พบคีย์ใน response" };
    }
}

async function createKey(sellerkey, params) {
    const formats = ["json", "text"];
    let lastFail = null;

    for (const format of formats) {
        const { status, text } = await sellerRaw(sellerkey, "addkey", { ...params, format });
        const parsed = parseAddKeyResponse(text, status);
        if (parsed.ok && parsed.key) return parsed;
        lastFail = parsed;
        if (parsed.error && parsed.error !== "API ไม่ส่งคีย์กลับมา") break;
    }

    return lastFail || { ok: false, error: "สร้างคีย์ไม่สำเร็จ" };
}

async function verifySellerKey(sellerkey) {
    const json = await sellerRequest(sellerkey, "info");
    return json.success === true;
}

module.exports = {
    BASE,
    sellerRequest,
    sellerText,
    sellerRaw,
    parseAddKeyResponse,
    createKey,
    verifySellerKey,
    hintForError,
};
