const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const { resolveSellerKey, appAutocomplete } = require("../../utils/appResolver");
const { sellerRequest } = require("../../utils/sellerApi");
const { getBotFooter } = require("../../utils/botBrand");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reset-hwid")
        .setDescription("รีเซ็ต HWID ของคีย์/ผู้ใช้")
        .addStringOption((opt) => opt.setName("key").setDescription("คีย์หรือ username").setRequired(true))
        .addStringOption((opt) =>
            opt
                .setName("application")
                .setDescription("เลือกแอป (ไม่ระบุ = แอปที่เลือกไว้)")
                .setRequired(false)
                .setAutocomplete(true)
        ),
    autocomplete: appAutocomplete,
    async execute(interaction) {
        const appName = interaction.options.getString("application");
        const resolved = await resolveSellerKey(interaction, appName);
        if (resolved.error) return interaction.editReply(resolved.error);

        const { sellerkey, ephemeral } = resolved;
        const key = interaction.options.getString("key");
        const json = await sellerRequest(sellerkey, "resetuser", { user: key });

        if (json.success) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("รีเซ็ต HWID สำเร็จ")
                        .addFields({ name: "คีย์ / ผู้ใช้", value: `\`${key}\`` })
                        .setColor(Colors.Green)
                        .setFooter({ text: getBotFooter(interaction.client) })
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(json.message || "รีเซ็ตไม่สำเร็จ")
                    .setColor(Colors.Red)
                    .setFooter({ text: getBotFooter(interaction.client) })
                    .setTimestamp(),
            ],
            ...(ephemeral && { flags: 64 }),
        });
    },
};
