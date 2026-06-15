const BASE = process.env.SELLER_API_URL || "https://libreauth.nutexe.dev/seller-api/";

async function sellerRequest(sellerkey, type, params = {}) {
    const url = new URL(BASE);
    url.searchParams.set("sellerkey", sellerkey);
    url.searchParams.set("type", type);
    for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== "") {
            url.searchParams.set(key, String(val));
        }
    }
    const res = await fetch(url.toString());
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return { success: true, raw: text };
    }
}

async function sellerText(sellerkey, type, params = {}) {
    const url = new URL(BASE);
    url.searchParams.set("sellerkey", sellerkey);
    url.searchParams.set("type", type);
    for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== "") {
            url.searchParams.set(key, String(val));
        }
    }
    const res = await fetch(url.toString());
    return res.text();
}

function parseAddKeyResponse(text) {
    const raw = String(text || "").trim();
    if (!raw) return { ok: false, error: "API ตอบกลับว่างเปล่า" };

    try {
        const json = JSON.parse(raw);
        if (json.success === false) {
            return { ok: false, error: json.message || raw };
        }
        const key =
            json.key ||
            json.license ||
            (Array.isArray(json.keys) ? json.keys[0] : null) ||
            (Array.isArray(json.key) ? json.key[0] : null);
        if (key) return { ok: true, key: String(key).trim() };
        if (typeof json.message === "string" && json.message.length > 0) {
            return { ok: true, key: json.message.trim() };
        }
        return { ok: false, error: "ไม่พบคีย์ใน response" };
    } catch {
        if (raw.startsWith("{")) {
            return { ok: false, error: raw };
        }
        return { ok: true, key: raw.split("\n")[0].trim() };
    }
}

async function createKey(sellerkey, params) {
    const types = ["addkey", "add"];
    for (const type of types) {
        const text = await sellerText(sellerkey, type, { ...params, format: "text" });
        const parsed = parseAddKeyResponse(text);
        if (parsed.ok && parsed.key) return parsed;
        if (!parsed.ok && type === types[types.length - 1]) return parsed;
    }
    return { ok: false, error: "สร้างคีย์ไม่สำเร็จ" };
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
};
