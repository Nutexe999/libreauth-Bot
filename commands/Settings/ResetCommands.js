const { SlashCommandBuilder, EmbedBuilder, Colors } = require("discord.js");
const config = require("../../utils/config");
const { registerCommands } = require("../../utils/registerCommands");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reset-commands")
        .setDescription("รีเซ็ต slash commands ลงทะเบียนใหม่"),
    async execute(interaction) {
        const ephemeral = !!interaction.guild;
        try {
            const count = await registerCommands(
                interaction.client.user.id,
                config.token,
                config.type,
                config.DevelopmentServerId,
                interaction.client
            );
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("รีเซ็ต Slash Commands สำเร็จ")
                        .setDescription(`ลงทะเบียน ${count} คำสั่ง`)
                        .setColor(Colors.Green)
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        } catch (err) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("รีเซ็ตไม่สำเร็จ")
                        .setDescription(`\`\`\`${err.message}\`\`\``)
                        .setColor(Colors.Red)
                        .setTimestamp(),
                ],
                ...(ephemeral && { flags: 64 }),
            });
        }
    },
};
