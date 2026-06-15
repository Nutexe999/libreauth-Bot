const { SlashCommandBuilder, Colors, EmbedBuilder } = require("discord.js");
const { resolveSellerKey, appAutocomplete } = require("../../utils/appResolver");
const { createKey, normalizeMask, maskHint } = require("../../utils/sellerApi");
const { logKey } = require("../../utils/logkey");
const { getBotFooter, getLifetimeKeyMask, getAddKeyNote } = require("../../utils/botBrand");

function buildData(client) {
    const lifetimeMask = getLifetimeKeyMask(client);
    return new SlashCommandBuilder()
        .setName("getkey")
        .setDescription("สร้างคีย์ลิขสิทธิ์")
        .addStringOption((opt) =>
            opt
                .setName("key_mask")
                .setDescription("รูปแบบคีย์และอายุ")
                .setRequired(true)
                .addChoices(
                    { name: "1day-******", value: "1day-******" },
                    { name: "3day-******", value: "3day-******" },
                    { name: "7day-******", value: "7day-******" },
                    { name: lifetimeMask, value: lifetimeMask },
                    { name: "กำหนดเอง", value: "custom" }
                )
        )
        .addIntegerOption((opt) =>
            opt.setName("custom_days").setDescription("จำนวนวัน (เมื่อเลือกกำหนดเอง)").setRequired(false)
        )
        .addStringOption((opt) =>
            opt.setName("custom_mask").setDescription("รูปแบบคีย์ เช่น DEV-******").setRequired(false)
        )
        .addStringOption((opt) =>
            opt
                .setName("application")
                .setDescription("เลือกแอป (ไม่ระบุ = แอปที่เลือกไว้)")
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addUserOption((opt) =>
            opt.setName("user").setDescription("ส่งคีย์ไป DM (ไม่ระบุ = แสดงในแชท)").setRequired(false)
        );
}

module.exports = {
    buildData,
    data: buildData({ user: { username: "KEY" } }),
    autocomplete: appAutocomplete,
    async execute(interaction) {
        const appName = interaction.options.getString("application");
        const resolved = await resolveSellerKey(interaction, appName);
        if (resolved.error) return interaction.editReply(resolved.error);

        const { sellerkey, applicationDisplayName, ephemeral } = resolved;
        const keyMask = interaction.options.getString("key_mask");
        const customDays = interaction.options.getInteger("custom_days");
        const customMask = interaction.options.getString("custom_mask");
        const targetUser = interaction.options.getUser("user");
        const lifetimeMask = getLifetimeKeyMask(interaction.client);

        let days;
        let mask;
        const rawMaskInput = keyMask === "custom" ? customMask : keyMask;

        if (keyMask === "custom") {
            if (!customDays || customDays <= 0 || !customMask) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription("กรุณาระบุ `custom_days` และ `custom_mask` เมื่อเลือกกำหนดเอง")
                            .setColor(Colors.Red)
                            .setTimestamp(),
                    ],
                    ...(ephemeral && { flags: 64 }),
                });
            }
            days = customDays;
            mask = normalizeMask(customMask);
        } else {
            const daysMap = { "1day-******": 1, "3day-******": 3, "7day-******": 7, [lifetimeMask]: 3650 };
            days = daysMap[keyMask] ?? 1;
            mask = normalizeMask(keyMask);
        }

        const durationLabel = days >= 3650 ? "ตลอดชีพ" : `${days} วัน`;

        try {
            const result = await createKey(sellerkey, {
                expiry: days,
                mask,
                level: 1,
                amount: 1,
                character: 1,
                note: getAddKeyNote(interaction.client),
            });

            if (!result.ok || !result.key) {
                const hint = result.hint || "ตรวจสอบ Seller Key, สิทธิ์ addkey และแพ็กเกจ Pro/Enterprise ใน Panel";
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(String(result.error || "สร้างคีย์ไม่สำเร็จ"))
                            .setDescription(hint)
                            .setColor(Colors.Red)
                            .setFooter({ text: getBotFooter(interaction.client) })
                            .setTimestamp(),
                    ],
                    ...(ephemeral && { flags: 64 }),
                });
            }

            const key = String(result.key || "").trim();
            const sentMask = result.mask || mask;
            const hint = maskHint(rawMaskInput, sentMask);
            if (!key) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("ได้รับ response แต่ไม่มีคีย์")
                            .setDescription(
                                result.hint ||
                                    "LibreAuth API addkey ตอบกลับว่าง — เปิดสิทธิ์ addkey ใน Panel → Seller API"
                            )
                            .setColor(Colors.Red)
                            .setFooter({ text: getBotFooter(interaction.client) })
                            .setTimestamp(),
                    ],
                    ...(ephemeral && { flags: 64 }),
                });
            }

            await logKey(interaction.user, key, targetUser, applicationDisplayName);

            if (targetUser) {
                try {
                    const receivedAt = new Date().toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    });
                    const dmEmbed = new EmbedBuilder()
                        .setTitle("🎫 คีย์ของคุณ")
                        .setDescription(`\`\`\`\n${key}\n\`\`\``)
                        .addFields(
                            { name: "สินค้า", value: applicationDisplayName ? `\`${applicationDisplayName}\`` : "-", inline: false },
                            { name: "📅 วันที่ได้รับ", value: receivedAt, inline: false }
                        )
                        .setColor(0x00ae86)
                        .setAuthor({
                            name: interaction.client.user.username,
                            iconURL: interaction.client.user.displayAvatarURL(),
                        })
                        .setTimestamp();
                    await targetUser.send({ embeds: [dmEmbed] });
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(`ส่งคีย์ไป DM ของ ${targetUser.tag} แล้ว\nแอป: \`${applicationDisplayName || "-"}\``)
                                .setColor(Colors.Green)
                                .setTimestamp(),
                        ],
                        ...(ephemeral && { flags: 64 }),
                    });
                } catch {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription(`ส่ง DM ไม่ได้\nแอป: \`${applicationDisplayName || "-"}\`\nคีย์:\n\`\`\`\n${key}\n\`\`\``)
                                .setColor(Colors.Yellow)
                                .setTimestamp(),
                        ],
                        ...(ephemeral && { flags: 64 }),
                    });
                }
            }

            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("✅ สร้างคีย์สำเร็จ")
                        .setDescription(
                            (hint ? `${hint}\n\n` : "") + `\`\`\`\n${key}\n\`\`\``
                        )
                        .addFields(
                            { name: "แอป", value: applicationDisplayName ? `\`${applicationDisplayName}\`` : "-", inline: true },
                            { name: "ระยะเวลา", value: durationLabel, inline: true },
                            { name: "Mask", value: `\`${sentMask}\``, inline: true },
                        )
                        .setColor(Colors.Green)
                        .setFooter({ text: getBotFooter(interaction.client) })
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        } catch (err) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`เกิดข้อผิดพลาด: ${err.message}`)
                        .setColor(Colors.Red)
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }
    },
};
