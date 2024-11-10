const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();
const DATABASE_PATH = process.env.DATABASE_PATH;
const playlists = require(`../${DATABASE_PATH}`);

// Crea la playlist con un nombre y un serverId
function crearPlaylist(serverId, nombre) {
    if (!playlists[serverId]) {
        playlists[serverId] = {};
    }

    // Si la playlist con el nombre existe
    if (playlists[serverId][nombre]) {
        return `La playlist ${nombre} ya existe`;
    } else {
        playlists[serverId][nombre] = [];
        fs.writeFileSync(DATABASE_PATH, JSON.stringify(playlists, null, 2));
        return `La playlist "${nombre}" fue creada correctamente`;
    }
}

module.exports = { crearPlaylist };
