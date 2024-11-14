const fs = require("fs");
const dotenv = require("dotenv");
const path = require('path');

dotenv.config();
const DATABASE_PATH = process.env.DATABASE_PATH;

const playlistsPath = path.join(__dirname, '..', process.env.DATABASE_PATH);
const dominiosPermitidos = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'spotify.com', 'www.spotify.com', 'open.spotify.com'];

// Crea la playlist con un nombre y un serverId
function crearPlaylist(serverId, nombre) {
    const playlists = JSON.parse(fs.readFileSync(playlistsPath, 'utf8'));

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
    const playlists = JSON.parse(fs.readFileSync(playlistsPath, 'utf8'));

    if (!playlists[serverId]) {
        return "No hay playlists disponibles en este servidor"
    } else {
        var playlistsServer = playlists[serverId];
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

// Muesra las playlists del servidor
function addCancionPlaylist(serverId, url, nombrePlaylist, tituloCancion) {
    const playlists = JSON.parse(fs.readFileSync(playlistsPath, 'utf8'));
    if (!playlists[serverId]) {
        playlists[serverId] = {};
    }

    if (!playlists[serverId][nombrePlaylist]) {
        playlists[serverId][nombrePlaylist] = {};
    }

    if (verificarUrl(url)) {
        playlists[serverId][nombrePlaylist][tituloCancion] = url;
        fs.writeFileSync(playlistsPath, JSON.stringify(playlists, null, 2));
        return `La canción ${tituloCancion} se ha agregado a la playlist ${nombrePlaylist}`;
    } else {
        return `La canción no se ha podido añadir a la playlist ${nombrePlaylist}`;
    }
}

function verificarUrl(url) {
    try {
        const comprobarUrl = new URL(url);
        if (dominiosPermitidos.includes(comprobarUrl.hostname)) {
            return true;
        }
    } catch (error) {
        console.log(error);
    }
    return false;
}

module.exports = { crearPlaylist, mostrarPlaylists, addCancionPlaylist };
