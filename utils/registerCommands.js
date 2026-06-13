const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

const commandsDir = path.join(__dirname, "..", "commands");

function buildGuildInviteUrl(clientId, guildId) {
    const params = new URLSearchParams({
        client_id: clientId,
        scope: "bot applications.commands",
        guild_id: guildId,
        disable_guild_select: "true",
    });
    return `https://discord.com/oauth2/authorize?${params}`;
}

function guildNotJoinedError(guildId, clientId) {
    const invite = buildGuildInviteUrl(clientId, guildId);
    return new Error(
        `บอทไม่อยู่ในเซิร์ฟเวอร์ ID: ${guildId}\n` +
            `เชิญบอทเข้าเซิร์ฟเวอร์ก่อน: ${invite}\n` +
            `หรือตั้ง TYPE=production ใน .env`
    );
}

function loadCommandsJSON(client = null) {
    const commands = [];
    function readDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) readDir(full);
            else if (e.name.endsWith(".js")) {
                const cmd = require(full);
                if (cmd.buildData && client) commands.push(cmd.buildData(client).toJSON());
                else if (cmd.data) commands.push(cmd.data.toJSON());
            }
        }
    }
    readDir(commandsDir);
    return commands;
}

async function registerCommands(clientId, token, type, developmentServerId, client = null) {
    const rest = new REST().setToken(token);
    const commands = loadCommandsJSON(client);

    if (type === "development" && !developmentServerId) {
        throw new Error("TYPE=development ต้องมี DEVELOPMENT_SERVER_ID");
    }

    await new Promise((r) => setTimeout(r, 2000));

    const isGuild = type === "development";
    const guildId = developmentServerId;

    if (isGuild && client && !client.guilds.cache.has(guildId)) {
        throw guildNotJoinedError(guildId, clientId);
    }

    try {
        await rest.put(Routes.applicationCommands(clientId), { body: [] });
        if (isGuild && guildId) {
            try {
                await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
            } catch (e) {
                if (e.code === 50001) throw guildNotJoinedError(guildId, clientId);
                throw e;
            }
        }

        const route = isGuild
            ? Routes.applicationGuildCommands(clientId, guildId)
            : Routes.applicationCommands(clientId);

        await rest.put(route, { body: commands });
    } catch (err) {
        if (err.code === 50001) throw guildNotJoinedError(guildId, clientId);
        throw err;
    }

    return commands.length;
}

module.exports = { loadCommandsJSON, registerCommands, buildGuildInviteUrl };
