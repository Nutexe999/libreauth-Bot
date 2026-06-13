const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const { resolveSellerKey, appAutocomplete } = require("../../utils/appResolver");
const { sellerRequest } = require("../../utils/sellerApi");
const { getBotFooter } = require("../../utils/botBrand");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addhash")
        .setDescription("เพิ่ม MD5 hash ลง whitelist (ป้องกัน E04/E05)")
        .addStringOption((opt) => opt.setName("hash").setDescription("MD5 hash ของไฟล์ exe/dll").setRequired(true))
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
        const hash = interaction.options.getString("hash").trim();
        const json = await sellerRequest(sellerkey, "addhash", { hash });

        if (json.success) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(json.message || "เพิ่ม hash สำเร็จ")
                        .addFields({ name: "Hash", value: `\`${hash}\`` })
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
                    .setTitle(json.message || "เพิ่ม hash ไม่สำเร็จ")
                    .setColor(Colors.Red)
                    .setFooter({ text: getBotFooter(interaction.client) })
                    .setTimestamp(),
            ],
            ...(ephemeral && { flags: 64 }),
        });
    },
};
