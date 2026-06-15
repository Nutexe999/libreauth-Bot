const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const db = require("../../utils/database");
const { appAutocomplete, bustAppCache } = require("../../utils/appResolver");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("delete-application")
        .setDescription("ลบแอปพลิเคชัน / Seller Key")
        .addStringOption((opt) =>
            opt
                .setName("application")
                .setDescription("เลือกแอปที่ต้องการลบ")
                .setRequired(true)
                .setAutocomplete(true)
        ),
    autocomplete: appAutocomplete,
    async execute(interaction) {
        const idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
        const ephemeral = !!interaction.guild;
        const appName = interaction.options.getString("application");
        const applications = (await db.get(`applications_${idfrom}`)) || [];

        if (!applications.length) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription("ยังไม่มีแอป กรุณาใช้ `/add-application` ก่อน")
                        .setColor(Colors.Red)
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        const idx = applications.findIndex(
            (app) => app.application.toLowerCase() === String(appName).trim().toLowerCase()
        );
        if (idx === -1) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`ไม่พบแอป \`${appName}\``)
                        .setColor(Colors.Red)
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        const removed = applications.splice(idx, 1)[0];
        await db.set(`applications_${idfrom}`, applications);
        bustAppCache(idfrom);

        const current = await db.get(`token_${idfrom}`);
        if (current === removed.sellerkey) {
            await db.set(`token_${idfrom}`, applications[0]?.sellerkey || null);
        }

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("ลบแอปสำเร็จ")
                    .addFields(
                        { name: "แอป", value: `\`${removed.application}\`` },
                        { name: "SellerKey", value: `\`${removed.sellerkey.slice(0, 12)}...\`` }
                    )
                    .setColor(Colors.Green)
                    .setTimestamp(),
            ],
            ...(ephemeral && { flags: 64 }),
        });
    },
};
