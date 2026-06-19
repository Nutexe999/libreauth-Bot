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
        .setName("delhash")
        .setDescription("ลบ MD5 hash จาก whitelist")
        .addStringOption((opt) =>
            opt
                .setName("hash")
                .setDescription("MD5 32 ตัว หรือพิมพ์ all เพื่อลบทั้งหมด")
                .setRequired(true)
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

        const { sellerkey, applicationDisplayName, ephemeral } = resolved;
        const raw = interaction.options.getString("hash").trim();

        if (/^all$/i.test(raw)) {
            const json = await sellerRequest(sellerkey, "resethashes", {});
            if (json.success) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(json.message || "ลบ hash ทั้งหมดแล้ว")
                            .setDescription(
                                applicationDisplayName
                                    ? `แอป: \`${applicationDisplayName}\``
                                    : null
                            )
                            .setColor(Colors.Green)
                            .setFooter({ text: getBotFooter(interaction.client) })
                            .setTimestamp(),
                    ],
                    ...(ephemeral && { flags: 64 }),
                });
            }
            const hint = hintForError(json.message);
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(json.message || "ลบ hash ไม่สำเร็จ")
                        .setDescription(hint || null)
                        .setColor(Colors.Red)
                        .setFooter({ text: getBotFooter(interaction.client) })
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        const hash = normalizeMd5(raw);
        if (!isMd5(hash)) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription("MD5 ต้องเป็น hex 32 ตัว หรือพิมพ์ `all` เพื่อลบทั้งหมด")
                        .setColor(Colors.Red)
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        const json = await sellerRequest(sellerkey, "delhash", { hash });

        if (json.success) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(json.message || "ลบ hash สำเร็จ")
                        .addFields({ name: "Hash", value: `\`${hash}\`` })
                        .setColor(Colors.Green)
                        .setFooter({ text: getBotFooter(interaction.client) })
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }

        const hint = hintForError(json.message);
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(json.message || "ลบ hash ไม่สำเร็จ")
                    .setDescription(hint || null)
                    .setColor(Colors.Red)
                    .setFooter({ text: getBotFooter(interaction.client) })
                    .setTimestamp(),
            ],
            ...(ephemeral && { flags: 64 }),
        });
    },
};
