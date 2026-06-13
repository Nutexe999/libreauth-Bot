const config = require("./utils/config.js");
const db = require("./utils/database");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");
const {
    Client,
    Events,
    GatewayIntentBits,
    ActivityType,
    Collection,
    EmbedBuilder,
    Colors,
    MessageFlags,
} = require("discord.js");
const { loadCommandsJSON, registerCommands } = require("./utils/registerCommands");
const { getBotName, getBotFooter } = require("./utils/botBrand");

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const clientCommands = new Collection();

(function loadCommandHandlers(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(directory, e.name);
        if (e.isDirectory()) loadCommandHandlers(full);
        else if (e.name.endsWith(".js")) {
            const cmd = require(full);
            if (cmd.data) clientCommands.set(cmd.data.name, cmd);
        }
    }
})(path.join(__dirname, "commands"));

client.on("error", console.error);

process.on("unhandledRejection", (error) => {
    console.error("[unhandledRejection]", error);
});

process.on("uncaughtException", (error) => {
    console.error("[uncaughtException]", error);
    process.exit(1);
});

const readyEvent = Events.ClientReady || Events.Ready || "ready";

client.once(readyEvent, async () => {
    console.log("LibreAuth Bot online:", client.user.tag);

    try {
        const count = await registerCommands(
            client.user.id,
            config.token,
            config.type,
            config.DevelopmentServerId,
            client
        );
        console.log(`Slash commands: ${count} (${config.type === "production" ? "Global" : "Guild"})`);
    } catch (err) {
        console.error("Register commands failed:", err.message || err);
    }

    client.user.setPresence({
        activities: [{ name: getBotName(client), type: ActivityType.Competing }],
        status: "online",
    });
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete()) {
        const command = clientCommands.get(interaction.commandName);
        if (command?.autocomplete) {
            try {
                await command.autocomplete(interaction);
            } catch (e) {
                console.error(e);
            }
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = clientCommands.get(interaction.commandName);
    if (!command) return;

    const idfrom = interaction.guild ? interaction.guild.id : interaction.user.id;
    const ephemeral = !!interaction.guild;

    await interaction.deferReply({ ...(ephemeral && { flags: MessageFlags.Ephemeral }) });

    if (interaction.member) {
        const hasPerms = interaction.member.roles.cache.find((x) => x.name === "perms");
        if (!hasPerms) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription("ต้องมีบทบาท `perms` ถึงจะใช้คำสั่งได้")
                        .setColor(Colors.Red)
                        .setTimestamp(),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }
    }

    let content = `**${interaction.user.username}** ใช้ \`/${interaction.commandName}\`\n`;
    for (const option of interaction.options._hoistedOptions) {
        content += `\n${option.name}: ${option.value}`;
    }

    const whUrl = await db.get(`wh_url_${idfrom}`);
    if (whUrl) {
        fetch(whUrl, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({ content }),
        }).catch(() => {});
    }

    try {
        await command.execute(interaction);
    } catch (err) {
        console.error(err);
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({ name: "ดำเนินการไม่สำเร็จ" })
                    .setColor(Colors.Red)
                    .setTimestamp()
                    .setFooter({ text: getBotFooter(client), iconURL: client.user.displayAvatarURL() }),
            ],
            flags: MessageFlags.Ephemeral,
        });
    }
});

console.log("[startup] connecting...");

client.login(config.token).catch((err) => {
    console.error("[login]", err.message || err);
    process.exit(1);
});
