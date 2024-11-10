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
        playlists[serverId][nombre] = {};
        fs.writeFileSync(DATABASE_PATH, JSON.stringify(playlists, null, 2));
        return `La playlist "${nombre}" fue creada correctamente`;
    }
}

// Muesra las playlists del servidor
function mostrarPlaylists(serverId) {
    if (!playlists[serverId]) {
        return "No hay playlists disponibles en este servidor"
    } else {
        var data = fs.readFileSync(DATABASE_PATH, "utf-8");
        var jsonData = JSON.parse(data);
        var playlistsServer = jsonData[serverId];
        var playlistList = "";

        // Formato de las playlists y canciones
        for (const nombrePlaylist in playlistsServer) {
            const item = playlistsServer[nombrePlaylist];
            var playlistCanciones = "";

            // Si hay canciones
            if (typeof item === "object" && Object.keys(item).length > 0) {
                const canciones = Object.entries(item)
                    .map(([nombre, valor]) => `${nombre}: ${valor} `)
                    .join("\n - ");
                playlistCanciones = canciones;
            } else {
                playlistCanciones = "No hay canciones en esta playlist";
            }

            playlistList += `**Playlist: ${nombrePlaylist}**\n - ${playlistCanciones}\n\n`
        }

        return playlistList;
    }
}

module.exports = { crearPlaylist, mostrarPlaylists };
