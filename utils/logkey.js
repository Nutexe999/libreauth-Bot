const { EmbedBuilder } = require("discord.js");

async function logKey(executor, key, targetUser, applicationName) {
    const webhookUrl = process.env.LOG_WEBHOOK_URL;
    if (!webhookUrl) return;

    const receivedAt = new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const fields = [
        { name: "👤 ผู้ใช้", value: `<@${executor.id}> | ID: \`${executor.id}\``, inline: true },
        {
            name: "📤 ส่งไปที่",
            value: targetUser ? `<@${targetUser.id}> | ID: \`${targetUser.id}\`` : "แชท",
            inline: true,
        },
        { name: "🔑 คีย์", value: `\`\`\`\n${key}\n\`\`\``, inline: false },
        { name: "📅 เวลา", value: receivedAt, inline: false },
    ];

    if (applicationName) {
        fields.splice(2, 0, { name: "📱 แอปพลิเคชัน", value: `\`${applicationName}\``, inline: true });
    }

    const embed = new EmbedBuilder()
        .setTitle("📋 Log: /getkey")
        .setColor(0x5865f2)
        .addFields(...fields)
        .setTimestamp()
        .setFooter({ text: "LibreAuth Key Log" });

    await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed.toJSON()] }),
    }).catch(() => {});
}

module.exports = { logKey };
