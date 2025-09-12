const { coleccionPlaylists } = require("@/config/db");
const { useMainPlayer } = require("discord-player");
const { Colors } = require("discord.js");

// Función para normalizar claves de MongoDB
function limpiarKey(key) {
    // Reemplaza puntos y signos de dólar por caracteres seguros
    return key.replace(/\./g, "·").replace(/\$/g, "₀");
}

// Crea la playlist con un nombre y un serverId
async function crearPlaylist(serverId, nombre) {
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
    try {
        const resultado = await coleccionPlaylists.find({ serverId }).toArray();
        if (!resultado || resultado.length === 0)
            return { color: Colors.Red, mensaje: "No hay playlists creadas en este servidor" };

        let playlistTexto = "";

        resultado.forEach((playlist) => {
            Object.entries(playlist)
                .filter(([key]) => key !== "serverId" && key !== "_id")
                // Lee cada playlist
                .forEach(([nombrePlaylist, trackList]) => {
                    let canciones = "No hay canciones en esta playlist";
                    if (trackList !== null && Object.keys(trackList).length > 0) {
                        // Formatea la lista de canciones
                        canciones = Object.keys(trackList)
                            .map((track) => `${track}: ${trackList[track]}`)
                            .join("\n - ");
                    }
                    playlistTexto += `**Playlist: ${nombrePlaylist}**\n - ${canciones}\n\n`;
                });
        });

        return { color: Colors.Blue, mensaje: playlistTexto };
    } catch (error) {
        console.error("Error al mostrar la playlist:", error);
        return { color: Colors.Red, mensaje: "Error al mostrar la playlist" };
    }
}

// Añade la canción a la playlist
async function addCancionPlaylist(serverId, url, nombrePlaylist, tituloCancion) {
    url = limpiarKey(url);
    nombrePlaylist = limpiarKey(nombrePlaylist);
    tituloCancion = limpiarKey(tituloCancion);
    try {
        let playlistExiste = checkExistPlaylist(serverId, nombrePlaylist);
        if (playlistExiste["color"] === Colors.Red) return playlistExiste;

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
    nombrePlaylist = limpiarKey(nombrePlaylist);
    tituloCancion = limpiarKey(tituloCancion);
    try {
        let playlistExiste = checkExistPlaylist(serverId, nombrePlaylist);
        if (playlistExiste["color"] === Colors.Red) return playlistExiste;

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
    nombrePlaylist = limpiarKey(nombrePlaylist);
    try {
        const playlistExiste = await checkExistPlaylist(serverId, nombrePlaylist);
        if (playlistExiste.color !== Colors.Red) return playlistExiste;

        return { color: Colors.Green, mensaje: `La playlist **${nombrePlaylist}** se añadio a la cola correctamente` };
    } catch (error) {
        console.error(error);
    }
}

async function checkExistPlaylist(serverId, nombrePlaylist) {
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
    const player = useMainPlayer();
    nombrePlaylist = limpiarKey(nombrePlaylist);

    try {
        const resultado = await coleccionPlaylists.find({ serverId }).toArray();

        for (const playlist of resultado) {
            if (playlist[nombrePlaylist] && typeof playlist[nombrePlaylist] === "object") {
                const urls = Object.values(playlist[nombrePlaylist]);
                for (const url of urls) {
                    await player.play(interaction.member.voice.channel, url, {
                        nodeOptions: { metadata: interaction },
                    });
                }
            }
        }
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
