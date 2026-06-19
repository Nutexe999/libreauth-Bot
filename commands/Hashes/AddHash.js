const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const { resolveSellerKey, appAutocomplete } = require("../../utils/appResolver");
const { sellerRequest, hintForError } = require("../../utils/sellerApi");
const { getBotFooter } = require("../../utils/botBrand");

function normalizeMd5(raw) {
    return String(raw || "").trim().toLowerCase();
}

function isMd5(hex) {
    return /^[a-f0-9]{32}$/.test(hex);
}

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
        const hash = normalizeMd5(interaction.options.getString("hash"));

        if (!isMd5(hash)) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription("MD5 ต้องเป็น hex 32 ตัว (a-f, 0-9)")
                        .setColor(Colors.Red)
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

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
                    .setDescription(hintForError(json.message) || null)
                    .setColor(Colors.Red)
                    .setFooter({ text: getBotFooter(interaction.client) })
                    .setTimestamp(),
            ],
            ...(ephemeral && { flags: 64 }),
        });
    },
};
