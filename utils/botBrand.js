function getBotName(client) {
    return client?.user?.username ?? "LibreAuth Bot";
}

function getBotFooter(client) {
    return `${getBotName(client)} · LibreAuth`;
}

function getKeyPrefix(client) {
    const prefix = getBotName(client).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return prefix.slice(0, 24) || "KEY";
}

function getLifetimeKeyMask(client) {
    return `${getKeyPrefix(client)}-******`;
}

function getAddKeyNote(client) {
    return `Added by ${getBotFooter(client)}`;
}

module.exports = {
    getBotName,
    getBotFooter,
    getKeyPrefix,
    getLifetimeKeyMask,
    getAddKeyNote,
};
