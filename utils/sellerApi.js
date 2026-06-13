const fetch = require("node-fetch");

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
        return { success: !text.includes('"success":false') && !text.includes('"message"'), raw: text };
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

async function verifySellerKey(sellerkey) {
    const json = await sellerRequest(sellerkey, "info");
    return json.success === true;
}

module.exports = {
    BASE,
    sellerRequest,
    sellerText,
    verifySellerKey,
};
