const { EmbedBuilder, Colors } = require("discord.js");
const db = require("./database");

async function resolveSellerKey(interaction, appName) {
    const idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
    const ephemeral = !!interaction.guild;
    const applications = (await db.get(`applications_${idfrom}`)) || [];

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

async function appAutocomplete(interaction) {
    const idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
    const applications = (await db.get(`applications_${idfrom}`)) || [];
    const focused = interaction.options.getFocused();
    const filtered = applications
        .filter((app) => app.application.toLowerCase().includes(focused.toLowerCase()))
        .slice(0, 25)
        .map((app) => ({ name: app.application, value: app.application }));
    await interaction.respond(filtered);
}

module.exports = { resolveSellerKey, appAutocomplete };
