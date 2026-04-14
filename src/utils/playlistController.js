const { coleccionPlaylists } = require("@/config/db");
const { Colors } = require("discord.js");

const DB_ERROR_MSG = {
    color: Colors.Red,
    mensaje: "La base de datos no está disponible. Esta función está desactivada.",
};

/**
 * Normaliza el parámetro para quitar puntos y signos de dolares
 */
function limpiarKey(key) {
    // Reemplaza puntos y signos de dólar por caracteres seguros
    if (typeof key !== "string") return key;
    return key.replaceAll(".", "·").replaceAll("$", "₀");
}

/**
 * Quita el parametro list de las URLs de Youtube pasadas como parámetro
 */
function quitarListParam(url) {
    try {
        const u = new URL(url);
        u.searchParams.delete("list");
        return u.toString();
    } catch {
        return url;
    }
}

// Crea la playlist con un nombre y un serverId
async function crearPlaylist(serverId, nombre) {
    if (!coleccionPlaylists) return DB_ERROR_MSG;

    nombre = limpiarKey(nombre);
    try {
        const playlistExiste = await checkExistPlaylist(serverId, nombre);

        // Si la playlist existe
        if (playlistExiste.color === Colors.Red) return playlistExiste;

        // Crea la playlist en la base de datos
        await coleccionPlaylists.updateOne({ serverId: serverId }, { $set: { [`${nombre}`]: {} } }, { upsert: true });

        return { color: Colors.Green, mensaje: `La playlist **${nombre}** fue creada correctamente` };
    } catch (error) {
        console.error("Error al crear la playlist:", error);
        return { color: Colors.Red, mensaje: `Error al crear la playlist ${nombre}` };
    }
}

// Elimina la playlist con un nombre y un serverId
async function eliminarPlaylist(serverId, nombrePlaylist) {
    if (!coleccionPlaylists) return DB_ERROR_MSG;

    nombrePlaylist = limpiarKey(nombrePlaylist);
    try {
        const resultado = await coleccionPlaylists.updateOne(
            { serverId: serverId },
            { $unset: { [`${nombrePlaylist}`]: "" } },
        );

        if (resultado.modifiedCount > 0) {
            return { color: Colors.Green, mensaje: `La playlist **${nombrePlaylist}** fue eliminada correctamente` };
        } else {
            return { color: Colors.Red, mensaje: `La playlist **${nombrePlaylist}** no existe` };
        }
    } catch (error) {
        console.error("Error al eliminar la playlist:", error);
        return { color: Colors.Red, mensaje: `Error al eliminar la playlist ${nombrePlaylist}` };
    }
}

// Muestra las playlists del servidor
async function mostrarPlaylists(serverId) {
    if (!coleccionPlaylists) return DB_ERROR_MSG;

    try {
        const resultado = await coleccionPlaylists.find({ serverId }).toArray();
        if (!resultado || resultado.length === 0)
            return { color: Colors.Red, mensaje: "No hay playlists creadas en este servidor" };

        let playlistTexto = "";
        const clavesIgnoradas = new Set(["serverId", "_id"]);

        for (const playlist of resultado) {
            for (const [nombrePlaylist, trackList] of Object.entries(playlist)) {
                // Lee cada playlist
                if (!clavesIgnoradas.has(nombrePlaylist)) {
                    let canciones = "No hay canciones en esta playlist";

                    if (trackList !== null && Object.keys(trackList).length > 0) {
                        // Formatea la lista de canciones
                        canciones = Object.keys(trackList)
                            .map((track) => track) // Solo mostramos los nombres para no saturar el mensaje
                            .join("\n - ");
                    }
                    playlistTexto += `**Playlist: ${nombrePlaylist}**\n - ${canciones}\n\n`;
                }
            }
        }

        return { color: Colors.Blue, mensaje: playlistTexto || "No hay playlists creadas en este servidor" };
    } catch (error) {
        console.error("Error al mostrar la playlist:", error);
        return { color: Colors.Red, mensaje: "Error al mostrar la playlist" };
    }
}

// Añade la canción a la playlist
async function addCancionPlaylist(serverId, url, nombrePlaylist, tituloCancion) {
    if (!coleccionPlaylists) return DB_ERROR_MSG;

    url = quitarListParam(url);
    nombrePlaylist = limpiarKey(nombrePlaylist);
    tituloCancion = limpiarKey(tituloCancion);
    try {
        // Corregido: Se añade await para comprobar correctamente
        const check = await coleccionPlaylists.findOne({ serverId, [nombrePlaylist]: { $exists: true } });
        if (!check) return { color: Colors.Red, mensaje: `La playlist **${nombrePlaylist}** no existe` };

        // Comprueba si existe la playlist y añade la canción
        const result = await coleccionPlaylists.updateOne(
            { serverId, [nombrePlaylist]: { $exists: true } },
            { $set: { [`${nombrePlaylist}.${tituloCancion}`]: url } },
        );

        if (result.modifiedCount > 0) {
            return {
                color: Colors.Green,
                mensaje: `La canción **${tituloCancion}** se ha añadido a la playlist **${nombrePlaylist}**`,
            };
        } else {
            return { color: Colors.Red, mensaje: `La playlist **${nombrePlaylist}** no existe o ya tiene la canción` };
        }
    } catch (error) {
        console.error("Error añadiendo la canción:", error);
        return { color: Colors.Red, mensaje: `Error añadiendo la canción a la playlist **${nombrePlaylist}**` };
    }
}

// Elimina la canción de la playlist
async function eliminarCancionPlaylist(serverId, nombrePlaylist, tituloCancion) {
    if (!coleccionPlaylists) return DB_ERROR_MSG;

    nombrePlaylist = limpiarKey(nombrePlaylist);
    tituloCancion = limpiarKey(tituloCancion);
    try {
        // Comprueba si existe la playlist y elimina la canción
        const result = await coleccionPlaylists.updateOne(
            { serverId, [nombrePlaylist]: { $exists: true } },
            { $unset: { [`${nombrePlaylist}.${tituloCancion}`]: "" } },
        );

        if (result.modifiedCount > 0) {
            return {
                color: Colors.Green,
                mensaje: `La canción **${tituloCancion}** se ha eliminado de la playlist **${nombrePlaylist}**`,
            };
        } else {
            return { color: Colors.Red, mensaje: `La playlist **${nombrePlaylist}** no existe o no tiene la canción` };
        }
    } catch (error) {
        console.error("Error eliminando la canción:", error);
        return { color: Colors.Red, mensaje: `Error eliminando la canción a la playlist **${nombrePlaylist}**` };
    }
}

async function playCheckPlaylist(serverId, nombrePlaylist) {
    if (!coleccionPlaylists) return DB_ERROR_MSG;

    nombrePlaylist = limpiarKey(nombrePlaylist);
    try {
        const doc = await coleccionPlaylists.findOne({ serverId, [nombrePlaylist]: { $exists: true } });

        // Si no existe o no tiene canciones
        if (!doc?.[nombrePlaylist] || Object.keys(doc[nombrePlaylist]).length === 0) {
            return { color: Colors.Red, mensaje: `La playlist **${nombrePlaylist}** no existe o está vacía` };
        }

        return { color: Colors.Green, mensaje: `La playlist **${nombrePlaylist}** se añadió a la cola correctamente` };
    } catch (error) {
        console.error(error);
        return { color: Colors.Red, mensaje: "Error al validar la playlist" };
    }
}

async function checkExistPlaylist(serverId, nombrePlaylist) {
    if (!coleccionPlaylists) return DB_ERROR_MSG;

    nombrePlaylist = limpiarKey(nombrePlaylist);
    try {
        const resultado = await coleccionPlaylists.findOne({ serverId, [nombrePlaylist]: { $exists: true } });

        if (!resultado) return { color: Colors.Green, mensaje: `La playlist **${nombrePlaylist}** no existe` };
        // Si existe la playlist
        return { color: Colors.Red, mensaje: `La playlist **${nombrePlaylist}** ya existe` };
    } catch (error) {
        console.error("Error al comprobar las playlists del servidor: ", error);
    }
}

// Añade la canción a la playlist
async function playPlaylist(serverId, nombrePlaylist, interaction) {
    if (!coleccionPlaylists) return DB_ERROR_MSG;

    const { client } = interaction;
    nombrePlaylist = limpiarKey(nombrePlaylist);

    try {
        const doc = await coleccionPlaylists.findOne({ serverId });
        if (!doc?.[nombrePlaylist]) return;

        const urls = Object.values(doc[nombrePlaylist]);

        // Obtener o crear el player de Lavalink
        let player = client.lavalink.getPlayer(interaction.guildId);
        if (!player) {
            player = await client.lavalink.createPlayer({
                guildId: interaction.guildId,
                voiceChannelId: interaction.member.voice.channel.id,
                textChannelId: interaction.channelId,
                selfDeaf: true,
            });
        }

        if (!player.connected) await player.connect();

        const node = client.lavalink.nodeManager.leastUsedNodes("playingPlayers")[0];

        // Iterar sobre las URLs guardadas en la DB
        for (const url of urls) {
            const res = await node.search(url, interaction.user);
            if (res.tracks.length > 0) {
                await player.queue.add(res.tracks[0]);
            }
        }

        // Si no está reproduciendo nada, empezar
        if (!player.playing && !player.paused) await player.play();
    } catch (error) {
        console.error("Error al reproducir la playlist:", error);
    }
}

module.exports = {
    checkExistPlaylist,
    crearPlaylist,
    eliminarPlaylist,
    playPlaylist,
    playCheckPlaylist,
    mostrarPlaylists,
    addCancionPlaylist,
    eliminarCancionPlaylist,
};
