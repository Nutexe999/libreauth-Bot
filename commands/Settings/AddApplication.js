const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require("../../utils/database");
const { verifySellerKey } = require("../../utils/sellerApi");
const { getBotFooter } = require("../../utils/botBrand");

function idGen() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < 32; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("add-application")
        .setDescription("เพิ่มแอปพลิเคชัน / Seller Key")
        .addStringOption((opt) =>
            opt.setName("sellerkey").setDescription("Seller Key จาก LibreAuth Panel").setRequired(true)
        )
        .addStringOption((opt) =>
            opt.setName("application").setDescription("ชื่อแอป (ไม่บังคับ)")
        ),
    async execute(interaction) {
        const idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        const ephemeral = !!interaction.guild;
        const sellerkey = interaction.options.getString("sellerkey");
        const application = interaction.options.getString("application");
        const name = application || sellerkey.substring(0, 8);

        if (application && !/^[a-zA-Z0-9_-]+$/.test(application)) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription("ชื่อแอปใช้ได้เฉพาะตัวอักษร ตัวเลข `_` และ `-`")
                        .setColor(Colors.Red)
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        let applications = (await db.get(`applications_${idfrom}`)) || [];
        if (applications.some((app) => app.application === name)) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`แอป \`${name}\` มีอยู่แล้ว`)
                        .setColor(Colors.Red)
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        const ok = await verifySellerKey(sellerkey);
        if (!ok) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("Seller Key ไม่ถูกต้อง")
                        .setDescription("ตรวจสอบ key ใน Panel → Seller API และ IP whitelist ของ VPS")
                        .setColor(Colors.Red)
                        .setFooter({ text: getBotFooter(interaction.client) })
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        applications.push({ application: name, sellerkey, id: idGen() });
        await db.set(`applications_${idfrom}`, applications);
        await db.set(`token_${idfrom}`, sellerkey);

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`เพิ่มแอป ${name} สำเร็จ`)
                    .setDescription("เลือกแอปนี้ไว้ใช้งานแล้ว พร้อมใช้คำสั่งอื่นได้ทันที")
                    .setColor(Colors.Green)
                    .setTimestamp(),
            ],
            ...(ephemeral && { flags: 64 }),
        });
    },
};
