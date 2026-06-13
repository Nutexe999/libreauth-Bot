const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const { resolveSellerKey, appAutocomplete } = require("../../utils/appResolver");
const { sellerRequest } = require("../../utils/sellerApi");
const { getBotFooter } = require("../../utils/botBrand");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("keyinfo")
        .setDescription("ดูข้อมูลคีย์")
        .addStringOption((opt) => opt.setName("key").setDescription("คีย์ที่ต้องการดู").setRequired(true))
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
        const json = await sellerRequest(sellerkey, "info", { key });

        if (!json.success) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(json.message || "ไม่พบข้อมูลคีย์")
                        .setColor(Colors.Red)
                        .setFooter({ text: getBotFooter(interaction.client) })
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`ข้อมูลคีย์: ${key}`)
            .addFields(
                { name: "HWID", value: `${json.hwid || "-"}` },
                { name: "สถานะ", value: `${json.status ?? "-"}` },
                { name: "ระดับ", value: `${json.level ?? "-"}` },
                { name: "สร้างโดย", value: `${json.createdby ?? "-"}` },
                { name: "วันที่สร้าง", value: `${json.creationdate ?? "-"}` }
            )
            .setColor(Colors.Blue)
            .setTimestamp();

        return interaction.editReply({ embeds: [embed], ...(ephemeral && { flags: 64 }) });
    },
};
