const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const { resolveSellerKey, appAutocomplete } = require("../../utils/appResolver");
const { sellerRequest } = require("../../utils/sellerApi");
const { getBotFooter } = require("../../utils/botBrand");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("seller-info")
        .setDescription("ดูข้อมูล Seller Key / แอป")
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

        const { sellerkey, applicationDisplayName, ephemeral } = resolved;
        const json = await sellerRequest(sellerkey, "info");

        if (!json.success) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(json.message || "ดึงข้อมูลไม่สำเร็จ")
                        .setColor(Colors.Red)
                        .setFooter({ text: getBotFooter(interaction.client) })
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        const fields = Object.entries(json)
            .filter(([k]) => !["success", "message"].includes(k))
            .slice(0, 12)
            .map(([k, v]) => ({ name: k, value: `\`${String(v).slice(0, 200)}\``, inline: true }));

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Seller Info · ${applicationDisplayName || "แอป"}`)
                    .addFields(fields.length ? fields : [{ name: "สถานะ", value: "OK" }])
                    .setColor(Colors.Blue)
                    .setFooter({ text: getBotFooter(interaction.client) })
                    .setTimestamp(),
            ],
            ...(ephemeral && { flags: 64 }),
        });
    },
};
