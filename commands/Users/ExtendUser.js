const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const { resolveSellerKey, appAutocomplete } = require("../../utils/appResolver");
const { sellerRequest } = require("../../utils/sellerApi");
const { getBotFooter } = require("../../utils/botBrand");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("extend-user")
        .setDescription("ต่ออายุ subscription ของผู้ใช้")
        .addStringOption((opt) =>
            opt.setName("user").setDescription("username หรือ all").setRequired(true)
        )
        .addStringOption((opt) => opt.setName("sub").setDescription("ชื่อ subscription").setRequired(true))
        .addIntegerOption((opt) => opt.setName("days").setDescription("จำนวนวันที่เพิ่ม").setRequired(true))
        .addBooleanOption((opt) =>
            opt.setName("active_only").setDescription("ต่อเฉพาะ sub ที่ยัง active").setRequired(false)
        )
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
        const user = interaction.options.getString("user");
        const sub = interaction.options.getString("sub");
        const days = interaction.options.getInteger("days");
        const activeOnly = interaction.options.getBoolean("active_only") ?? true;

        const json = await sellerRequest(sellerkey, "extend", {
            user,
            sub,
            expiry: days,
            activeOnly: activeOnly ? 1 : 0,
        });

        if (json.success) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(json.message || "ต่ออายุสำเร็จ")
                        .addFields(
                            { name: "ผู้ใช้", value: `\`${user}\`` },
                            { name: "Sub", value: `\`${sub}\`` },
                            { name: "เพิ่ม", value: `${days} วัน` }
                        )
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
                    .setTitle(json.message || "ต่ออายุไม่สำเร็จ")
                    .setColor(Colors.Red)
                    .setFooter({ text: getBotFooter(interaction.client) })
                    .setTimestamp(),
            ],
            ...(ephemeral && { flags: 64 }),
        });
    },
};
