const { EmbedBuilder, Colors } = require("discord.js");
const db = require("./database");

const appCache = new Map();

async function getApplications(idfrom) {
    const hit = appCache.get(idfrom);
    if (hit && Date.now() - hit.at < 60000) return hit.list;
    const list = (await db.get(`applications_${idfrom}`)) || [];
    appCache.set(idfrom, { list, at: Date.now() });
    return list;
}

function bustAppCache(idfrom) {
    appCache.delete(idfrom);
}

async function resolveSellerKey(interaction, appName) {
    const idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
    const ephemeral = !!interaction.guild;
    const applications = await getApplications(idfrom);

    let sellerkey;
    let applicationDisplayName = null;

    if (appName) {
        const name = String(appName).trim();
        const app = applications.find((a) => a.application.toLowerCase() === name.toLowerCase());
        if (!app) {
            return {
                error: {
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`ไม่พบแอปพลิเคชัน \`${appName}\` กรุณาเลือกจากรายการที่มี`)
                            .setColor(Colors.Red)
                            .setTimestamp(),
                    ],
                    ...(ephemeral && { flags: 64 }),
                },
            };
        }
        sellerkey = app.sellerkey;
        applicationDisplayName = app.application;
    } else {
        sellerkey = await db.get(`token_${idfrom}`);
        const matched = applications.find((a) => a.sellerkey === sellerkey);
        if (matched) applicationDisplayName = matched.application;
    }

    if (!sellerkey) {
        return {
            error: {
                embeds: [
                    new EmbedBuilder()
                        .setDescription("ยังไม่มีแอปที่เลือกไว้ กรุณาใช้ `/add-application` ก่อน หรือระบุแอปในคำสั่ง")
                        .setColor(Colors.Red)
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            },
        };
    }

    return { sellerkey, applicationDisplayName, idfrom, ephemeral, applications };
}

const IGNORE_INTERACTION = new Set([10062, 40060]);

async function appAutocomplete(interaction) {
    if (interaction.responded) return;
    try {
        const idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        const applications = await getApplications(idfrom);
        const focused = (interaction.options.getFocused() || "").toLowerCase();
        const filtered = applications
            .filter((app) => app.application.toLowerCase().includes(focused))
            .slice(0, 25)
            .map((app) => ({ name: app.application, value: app.application }));
        await interaction.respond(filtered);
    } catch (e) {
        if (!IGNORE_INTERACTION.has(e.code)) console.error(e);
        if (!interaction.responded) {
            try {
                await interaction.respond([]);
            } catch {}
        }
    }
}

module.exports = { resolveSellerKey, appAutocomplete, bustAppCache };
