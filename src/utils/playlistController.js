const { useMainPlayer } = require("discord-player");
const { MongoClient } = require("mongodb");
const { Colors } = require("discord.js");

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGO_INITDB_DATABASE;
const mongo = new MongoClient(MONGO_URI);
const db = mongo.db(MONGO_DB);
const coleccion = db.collection("playlists");

// Función para normalizar claves de MongoDB
function limpiarKey(key) {
    // Reemplaza puntos y signos de dólar por caracteres seguros
    return key.replace(/\./g, "·").replace(/\$/g, "₀");
}

// Crea la playlist con un nombre y un serverId
async function crearPlaylist(serverId, nombre) {
    await mongo.connect();
    try {
        const playlistExiste = await checkExistPlaylist(serverId, nombre);

        // Si la playlist existe
        if (playlistExiste.color === Colors.Red) return playlistExiste;

        // Crea la playlist en la base de datos
        await coleccion.updateOne({ serverId: serverId }, { $set: { [`${nombre}`]: {} } }, { upsert: true });

        return { color: Colors.Green, mensaje: `La playlist **${nombre}** fue creada correctamente` };
    } catch (error) {
        console.error("Error al crear la playlist:", error);
        return { color: Colors.Red, mensaje: `Error al crear la playlist ${nombre}` };
    } finally {
        await mongo.close();
    }
}

// Elimina la playlist con un nombre y un serverId
async function eliminarPlaylist(serverId, nombrePlaylist) {
    await mongo.connect();
    try {
        const resultado = await coleccion.updateOne({ serverId: serverId }, { $unset: { [`${nombrePlaylist}`]: "" } });

        if (resultado.modifiedCount > 0) {
            return { color: Colors.Green, mensaje: `La playlist **${nombrePlaylist}** fue eliminada correctamente` };
        } else {
            return { color: Colors.Red, mensaje: `La playlist **${nombrePlaylist}** no existe` };
        }
    } catch (error) {
        console.error("Error al eliminar la playlist:", error);
        return { color: Colors.Red, mensaje: `Error al eliminar la playlist ${nombrePlaylist}` };
    } finally {
        await mongo.close();
    }
}

// Muestra las playlists del servidor
async function mostrarPlaylists(serverId) {
    await mongo.connect();
    try {
        const resultado = await coleccion.find({ serverId }).toArray();
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
    } finally {
        await mongo.close();
    }
}

// Añade la canción a la playlist
async function addCancionPlaylist(serverId, url, nombrePlaylist, tituloCancion) {
    url = limpiarKey(url);
    nombrePlaylist = limpiarKey(nombrePlaylist);
    tituloCancion = limpiarKey(tituloCancion);
    await mongo.connect();
    try {
        let playlistExiste = checkExistPlaylist(serverId, nombrePlaylist);
        if (playlistExiste["color"] === Colors.Red) return playlistExiste;

        // Comprueba si existe la playlist y añade la canción
        const result = await coleccion.updateOne(
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
    } finally {
        await mongo.close();
    }
}

// Elimina la canción de la playlist
async function eliminarCancionPlaylist(serverId, nombrePlaylist, tituloCancion) {
    await mongo.connect();
    try {
        let playlistExiste = checkExistPlaylist(serverId, nombrePlaylist);
        if (playlistExiste["color"] === Colors.Red) return playlistExiste;

        // Comprueba si existe la playlist y elimina la canción
        const result = await coleccion.updateOne(
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
    } finally {
        await mongo.close();
    }
}

async function playCheckPlaylist(serverId, nombrePlaylist) {
    await mongo.connect();
    try {
        const playlistExiste = await checkExistPlaylist(serverId, nombrePlaylist);
        if (playlistExiste.color !== Colors.Red) return playlistExiste;

        return { color: Colors.Green, mensaje: `La playlist **${nombrePlaylist}** se añadio a la cola correctamente` };
    } catch (error) {
        console.error(error);
    } finally {
        await mongo.close();
    }
}

async function checkExistPlaylist(serverId, nombrePlaylist) {
    try {
        const resultado = await coleccion.findOne({ serverId, [nombrePlaylist]: { $exists: true } });

        if (!resultado) return { color: Colors.Green, mensaje: `La playlist **${nombrePlaylist}** no existe` };
        // Si existe la playlist
        return { color: Colors.Red, mensaje: `La playlist **${nombrePlaylist}** ya existe` };
    } catch (error) {
        console.error("Error al comprobar las playlists del servidor: ", error);
    }
}

// Añade la canción a la playlist
async function playPlaylist(serverId, nombrePlaylist, interaction) {
    await mongo.connect();
    const player = useMainPlayer();

    try {
        const resultado = await coleccion.find({ serverId }).toArray();

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
