const { useMainPlayer } = require("discord-player");
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI;

const mongo = new MongoClient(MONGO_URI);
const db = mongo.db("ritmosbot");
const coleccion = db.collection("playlists");

// Crea la playlist con un nombre y un serverId
async function crearPlaylist(serverId, nombre) {
    try {
        await mongo.connect();
        const playlistExiste = await checkExistPlaylist(serverId, nombre);

        // Si la playlist existe
        if (playlistExiste.color === "Red") {
            return playlistExiste;
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

// Elimina la playlist con un nombre y un serverId
async function eliminarPlaylist(serverId, nombrePlaylist) {
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

// Muestra las playlists del servidor
async function mostrarPlaylists(serverId) {
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

// Añade la canción a la playlist
async function addCancionPlaylist(serverId, url, nombrePlaylist, tituloCancion) {
    try {
        await mongo.connect();

        // Comprueba si existe la playlist y añade la canción
        const result = await coleccion.updateOne(
            { serverId, [nombrePlaylist]: { $exists: true } },
            { $set: { [`${nombrePlaylist}.${tituloCancion}`]: url } },
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

// Elimina la canción de la playlist
async function eliminarCancionPlaylist(serverId, nombrePlaylist, tituloCancion) {
    try {
        await mongo.connect();
        const playlistExiste = await checkExistPlaylist(serverId, nombrePlaylist);

        if (playlistExiste.color === "Red") {
            return playlistExiste;
        }

        // Comprueba si existe la playlist y elimina la canción
        const result = await coleccion.updateOne(
            { serverId, [nombrePlaylist]: { $exists: true } },
            { $unset: { [`${nombrePlaylist}.${tituloCancion}`]: "" } },
        );

        if (result.modifiedCount > 0) {
            return { color: "Green", mensaje: `La canción **${tituloCancion}** se ha eliminando a la playlist **${nombrePlaylist}**` };
        } else {
            return { color: "Red", mensaje: `La playlist **${nombrePlaylist}** no existe o no tiene la canción` };
        }
    } catch (error) {
        console.error("Error eliminando la canción:", error);
        return { color: "Red", mensaje: `Error eliminando la canción a la playlist **${nombrePlaylist}**` };
    } finally {
        await mongo.close();
    }
}

async function playCheckPlaylist(serverId, nombrePlaylist) {
    try {
        await mongo.connect();
        const playlistExiste = await checkExistPlaylist(serverId, nombrePlaylist);

        if (!playlistExiste.color === "Red") {
            return playlistExiste;
        } else {
            return { color: "Green", mensaje: `La playlist **${nombrePlaylist}** se añadio a la cola correctamente` };
        }
    } catch (error) {
        console.error(error);
    } finally {
        await mongo.close();
    }
}

async function checkExistPlaylist(serverId, nombrePlaylist) {
    try {
        await mongo.connect();
        const resultado = await coleccion.findOne({ serverId, [nombrePlaylist]: { $exists: true } });

        if (!resultado) {
            return { color: "Green", mensaje: `La playlist **${nombrePlaylist}** no existe` };
        } else {
            return { color: "Red", mensaje: `La playlist **${nombrePlaylist}** ya existe` };
        }
    } catch (error) {
        console.error(error);
    }
}

// Añade la canción a la playlist
async function playPlaylist(serverId, nombrePlaylist, interaction) {
    const player = useMainPlayer();

    try {
        await mongo.connect();
        const resultado = await coleccion.find({ serverId }).toArray();

        let urls = [];

        resultado.forEach((playlist) => {
            if (playlist[nombrePlaylist]) {
                const trackList = playlist[nombrePlaylist];

                Object.keys(trackList).forEach((trackName) => {
                    const url = trackList[trackName];
                    urls.push(url);
                });
            }
        });

        for (let url of Object.values(urls)) {
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

module.exports = { checkExistPlaylist, crearPlaylist, eliminarPlaylist, playPlaylist, playCheckPlaylist, mostrarPlaylists, addCancionPlaylist, eliminarCancionPlaylist };
