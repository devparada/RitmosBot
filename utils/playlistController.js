const fs = require("fs");
const path = require("path");
const { useMainPlayer } = require("discord-player");
const { MongoClient } = require("mongodb");

const DATABASE_PATH = process.env.DATABASE_PATH;
const MONGO_URI = process.env.MONGODB_URI;

const playlistsPath = path.join(__dirname, "..", DATABASE_PATH);
const mongo = new MongoClient(MONGO_URI);
const db = mongo.db("ritmosbot");
const coleccion = db.collection("playlists");

// Crea la playlist con un nombre y un serverId
async function crearPlaylistMongo(serverId, nombre) {
    try {
        await mongo.connect();
        const playlistExistente = await coleccion.findOne({ nombre: nombre });

        if (playlistExistente) {
            return { color: "Red", mensaje: `La playlist **${nombre}** ya existe` };
        } else {
            // Crea la playlist en la base de datos
            await coleccion.updateOne(
                { serverId: serverId },
                { $set: { [`${nombre}`]: {} } },
                { upsert: true },
            );
            return { color: "Green", mensaje: `La playlist **${nombre}** fue creada correctamente` };
        }
    } catch (error) {
        console.error("Error al crear la playlist:", error);
        return { color: "Red", mensaje: `Error al crear la playlist ${nombre}` };
    } finally {
        await mongo.close();
    }
}

// Crea la playlist con un nombre y un serverId
async function crearPlaylist(serverId, nombre) {
    var playlists = JSON.parse(fs.readFileSync(playlistsPath, "utf8"));

    if (!playlists[serverId]) {
        playlists[serverId] = {};
    }

    // Si la playlist con el nombre existe
    if (playlists[serverId][nombre]) {
        return { color: "Red", mensaje: `La playlist **${nombre}** ya existe` };
    } else {
        playlists[serverId][nombre] = {};
        fs.writeFileSync(DATABASE_PATH, JSON.stringify(playlists, null, 2));
        return { color: "Green", mensaje: `La playlist **${nombre}** fue creada correctamente` };
    }
}

// Elimina la playlist con un nombre y un serverId
async function eliminarPlaylistMongo(serverId, nombrePlaylist) {
    try {
        await mongo.connect();
        const resultado = await coleccion.updateOne(
            { serverId: serverId },
            // Elimina la playlist de la base de datos
            { $unset: { [`${nombrePlaylist}`]: "" } },
        );

        if (resultado.modifiedCount > 0) {
            return { color: "Green", mensaje: `La playlist **${nombrePlaylist}** fue eliminada correctamente` };
        } else {
            return { color: "Red", mensaje: `La playlist **${nombrePlaylist}** no existe` };
        }
    } catch (error) {
        console.error("Error al eliminar la playlist:", error);
        return { color: "Red", mensaje: `Error al eliminar la playlist ${nombrePlaylist}` };
    } finally {
        await mongo.close();
    }
}

// Elimina la playlist con un nombre y un serverId
function eliminarPlaylist(serverId, nombrePlaylist) {
    var playlists = JSON.parse(fs.readFileSync(playlistsPath, "utf8"));

    if (checkExistPlaylist(serverId, nombrePlaylist)["color"] === "Red") {
        return checkExistPlaylist(serverId, nombrePlaylist);
    } else {
        delete playlists[serverId][nombrePlaylist];
        fs.writeFileSync(DATABASE_PATH, JSON.stringify(playlists, null, 2));
        return { color: "Green", mensaje: `:white_check_mark: La playlist **${nombrePlaylist}** fue eliminada correctamente` };
    }
}

// Muestra las playlists del servidor
async function mostrarPlaylistsMongo(serverId) {
    try {
        await mongo.connect();
        const resultado = await coleccion.find({ serverId }).toArray();

        if (!resultado || resultado.length === 0) {
            return { color: "Red", mensaje: "No hay playlists creadas en este servidor" };
        }

        let playlistTexto = "";

        resultado.forEach((playlist) => {
            // Recorremos cada cancion
            Object.keys(playlist).forEach((playlistName) => {
                if (playlistName !== "serverId" && playlistName !== "_id") {
                    const trackList = playlist[playlistName];

                    // Si la playlist no es nulo y tiene canciones
                    if (trackList !== null && Object.keys(trackList).length > 0) {
                        // Formatear la lista de canciones
                        const canciones = Object.keys(trackList)
                            .map((track) => `${track}: ${trackList[track]}`)
                            .join("\n - ");
                        playlistTexto += `**Playlist: ${playlistName}**\n - ${canciones}\n\n`;
                    } else {
                        playlistTexto += `**Playlist: ${playlistName}**\n - No hay canciones en esta playlist\n\n`;
                    }
                }
            });
        });

        return { color: "Blue", mensaje: playlistTexto };
    } catch (error) {
        console.error("Error al mostrar la playlist:", error);
        return { color: "Red", mensaje: "Error al mostrar la playlist" };
    } finally {
        await mongo.close();
    }
}

// Muestra las playlists del servidor
function mostrarPlaylists(serverId) {
    var playlists = JSON.parse(fs.readFileSync(playlistsPath, "utf8"));

    if (!playlists[serverId]) {
        return { color: "Red", mensaje: "No hay playlists creadas en este servidor" };
    } else {
        var playlistsServer = playlists[serverId];
        var playlistServerCount = Object.keys(playlistsServer).length;
        var playlistTexto = "";

        // Si hay playlists en el servidor
        if (playlistServerCount > 0) {
            // Formato de las playlists y canciones
            for (let nombrePlaylist in playlistsServer) {
                const playlistList = playlistsServer[nombrePlaylist];
                // Si hay canciones dentro de la playlist
                if (typeof playlistList === "object" && Object.keys(playlistList).length > 0) {
                    const cancionesObj = playlistsServer[nombrePlaylist];

                    const canciones = Object.entries(cancionesObj)
                        .map(([nombre, valor]) => `${nombre}: ${valor} `)
                        .join("\n - ");
                    playlistTexto += `**Playlist: ${nombrePlaylist}**\n - ${canciones}\n\n`;
                }
                else {
                    playlistTexto += `**Playlist: ${nombrePlaylist}**\n - No hay canciones en esta playlist\n\n`;
                }
            }
            return { color: "Blue", mensaje: playlistTexto };
        } else {
            return { color: "Red", mensaje: "No hay canciones en esta playlist" };
        }
    }
}

// Añade la canción a la playlist
async function addCancionPlaylistMongo(serverId, url, nombrePlaylist, tituloCancion) {
    try {
        await mongo.connect();

        // Asegurarse de que la playlist exista y luego agregar la canción
        const result = await coleccion.updateOne(
            { serverId, [nombrePlaylist]: { $exists: true } },  // Verifica que la playlist exista
            { $set: { [`${nombrePlaylist}.${tituloCancion}`]: url } }, // Agrega o actualiza el título con la URL
        );

        if (result.modifiedCount > 0) {
            return { color: "Green", mensaje: `La canción **${tituloCancion}** se ha añadido a la playlist **${nombrePlaylist}**` };
        } else {
            return { color: "Red", mensaje: `La playlist **${nombrePlaylist}** no existe o ya tiene la canción` };
        }
    } catch (error) {
        console.error("Error añadiendo la canción:", error);
        return { color: "Red", mensaje: `Error añadiendo la canción a la playlist **${nombrePlaylist}**` };
    } finally {
        await mongo.close();
    }
}

// Añade la canción a la playlist
function addCancionPlaylist(serverId, url, nombrePlaylist, tituloCancion) {
    if (checkExistPlaylist(serverId, nombrePlaylist)["color"] === "Red") {
        return checkExistPlaylist(serverId, nombrePlaylist);
    }

    var playlists = JSON.parse(fs.readFileSync(playlistsPath, "utf8"));

    // Si ya existe la canción en la playlist
    if (playlists[serverId][nombrePlaylist][tituloCancion]) {
        return { color: "Red", mensaje: `La canción **${tituloCancion}** ya está añadida a la playlist` };
    }

    playlists[serverId][nombrePlaylist][tituloCancion] = url;
    fs.writeFileSync(playlistsPath, JSON.stringify(playlists, null, 2));
    return { color: "Green", mensaje: `La canción **${tituloCancion}** se ha añadido a la playlist` };
}

// Elimina la canción a la playlist
function eliminarCancionPlaylist(serverId, nombrePlaylist, tituloCancion) {
    if (checkExistPlaylist(serverId, nombrePlaylist)["color"] === "Red") {
        return checkExistPlaylist(serverId, nombrePlaylist);
    }

    var playlists = JSON.parse(fs.readFileSync(playlistsPath, "utf8"));

    // Si ya existe la canción en la playlist
    if (!playlists[serverId][nombrePlaylist][tituloCancion]) {
        return { color: "Red", mensaje: "La canción no está en la playlist" };
    }

    //playlists[serverId][nombrePlaylist][tituloCancion] = url;
    delete playlists[serverId][nombrePlaylist][tituloCancion];
    fs.writeFileSync(playlistsPath, JSON.stringify(playlists, null, 2));
    return { color: "Green", mensaje: `La canción **${tituloCancion}** se ha eliminado de la playlist` };
}

function playCheckPlaylist(serverId, nombrePlaylist) {
    if (checkExistPlaylist(serverId, nombrePlaylist)["color"] === "Red") {
        return checkExistPlaylist(serverId, nombrePlaylist);
    }

    return { color: "Green", mensaje: `La playlist **${nombrePlaylist}** se añadio a la cola correctamente` };
}

function checkExistPlaylist(serverId, nombrePlaylist) {
    var playlists = JSON.parse(fs.readFileSync(playlistsPath, "utf8"));

    if (!playlists[serverId]) {
        playlists[serverId] = {};
    }

    if (!playlists[serverId][nombrePlaylist]) {
        return { color: "Red", mensaje: `La playlist **${nombrePlaylist}** no existe` };
    }

    if (!playlists[serverId] || !playlists[serverId][nombrePlaylist]) {
        return { color: "Red", mensaje: `La playlist **${nombrePlaylist}** no existe` };
    } else {
        return { color: "Green", mensaje: `La playlist **${nombrePlaylist}** existe` };
    }
}

// Añade la canción a la playlist
async function playPlaylist(serverId, nombrePlaylist, interaction) {
    const player = useMainPlayer();
    var playlists = JSON.parse(fs.readFileSync(playlistsPath, "utf8"));
    var playlistUrl = playlists[serverId][nombrePlaylist];

    try {
        for (let url of Object.values(playlistUrl)) {
            await player.play(interaction.member.voice.channel, url, {
                nodeOptions: {
                    metadata: interaction,
                },
            });
        }
    } catch (error) {
        console.error("Error al reproducir la playlist:", error);
    }
}

module.exports = { checkExistPlaylist, crearPlaylist, crearPlaylistMongo, eliminarPlaylist, eliminarPlaylistMongo, playPlaylist, playCheckPlaylist, mostrarPlaylists, mostrarPlaylistsMongo, addCancionPlaylist, addCancionPlaylistMongo, eliminarCancionPlaylist };
