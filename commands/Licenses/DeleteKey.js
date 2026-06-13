const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const { resolveSellerKey, appAutocomplete } = require("../../utils/appResolver");
const { sellerRequest } = require("../../utils/sellerApi");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deletekey")
        .setDescription("ลบคีย์")
        .addStringOption((opt) => opt.setName("key").setDescription("คีย์ที่ต้องการลบ").setRequired(true))
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
        const json = await sellerRequest(sellerkey, "del", { key, userToo: 1, format: "json" });

        if (json.success) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(json.message || "ลบคีย์สำเร็จ")
                        .addFields({ name: "คีย์", value: `\`${key}\`` })
                        .setColor(Colors.Green)
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(json.message || "ลบไม่สำเร็จ")
                    .setColor(Colors.Red)
                    .setTimestamp(),
            ],
            ...(ephemeral && { flags: 64 }),
        });
    },
};
