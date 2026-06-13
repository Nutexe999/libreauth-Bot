# libreauth-Bot

บอท Discord ตัวอย่างสำหรับจัดการ [LibreAuth Seller API](https://libreauth.nutexe.dev/docs/?p=seller-api) — สร้างคีย์, แบน, เพิ่ม hash, ต่ออายุ user

อิงโครงจาก KeyAuth Discord Bot ปรับ endpoint เป็น LibreAuth

## ความต้องการ

- Node.js 20+
- Discord Bot Token ([Developer Portal](https://discord.com/developers/applications))
- LibreAuth Seller Key ([Panel → Seller API](https://libreauth.nutexe.dev/docs/?p=seller-api))

## ติดตั้ง

```bash
git clone https://github.com/Nutexe999/libreauth-Bot.git
cd libreauth-Bot
npm install
cp .env.example .env
# แก้ .env ใส่ TOKEN และ TYPE
npm start
```

## ตัวแปรสภาพแวดล้อม

| ตัวแปร | คำอธิบาย |
|--------|----------|
| `TOKEN` | Discord Bot Token |
| `TYPE` | `production` (global commands) หรือ `development` (guild only) |
| `DEVELOPMENT_SERVER_ID` | Guild ID — จำเป็นเมื่อ `TYPE=development` |
| `LOG_WEBHOOK_URL` | (ไม่บังคับ) Webhook สำหรับ log `/getkey` |
| `SELLER_API_URL` | (ไม่บังคับ) ค่าเริ่มต้น `https://libreauth.nutexe.dev/seller-api/` |
| `DATABASE_PATH` | path SQLite สำหรับเก็บแอป/seller key |

## คำสั่ง Slash

| คำสั่ง | รายละเอียด |
|--------|------------|
| `/add-application` | เพิ่ม Seller Key (verify ด้วย `type=info`) |
| `/delete-application` | ลบแอปออกจากบอท |
| `/seller-info` | ดูข้อมูล Seller Key |
| `/getkey` | สร้างคีย์ (`type=addkey`) |
| `/keyinfo` | ดูข้อมูลคีย์ |
| `/bankey` | แบนคีย์ |
| `/unbankey` | ยกเลิกแบน |
| `/deletekey` | ลบคีย์ |
| `/reset-hwid` | รีเซ็ต HWID |
| `/addhash` | เพิ่ม MD5 hash whitelist |
| `/extend-user` | ต่ออายุ subscription |
| `/reset-commands` | ลงทะเบียน slash commands ใหม่ |

## สิทธิ์ใน Discord

สร้างบทบาทชื่อ **`perms`** แล้วมอบให้แอดมินที่ใช้คำสั่งได้

## Seller API

Endpoint: `https://libreauth.nutexe.dev/seller-api/`

ทดสอบ key:

```bash
curl -G 'https://libreauth.nutexe.dev/seller-api/' \
  --data-urlencode 'sellerkey=YOUR_SELLER_KEY' \
  --data-urlencode 'type=info'
```

> อย่า commit Seller Key ลง repo — เก็บใน `.env` เท่านั้น  
> ถ้ารันบน VPS ให้ whitelist IP ใน Panel → Seller API

## Docker

```bash
docker compose up -d --build
```

ตั้ง env ใน `docker-compose.yml` หรือ `.env` ข้าง compose file

## เอกสารเพิ่มเติม

- [LibreAuth Seller API](https://libreauth.nutexe.dev/docs/?p=seller-api)
- [LibreAuth Docs](https://libreauth.nutexe.dev/docs/)

## License

MIT
