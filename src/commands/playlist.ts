import { useMainPlayer } from "discord-player";
import {
    ApplicationCommandOptionChoiceData,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    ColorResolvable,
    Colors,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";
import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
    throw new Error("La variable de entorno MONGODB_URI no está definida");
}

const mongo = new MongoClient(MONGO_URI);
const db = mongo.db("ritmosbot");
const coleccion = db.collection("playlists");

import {
    crearPlaylist,
    eliminarPlaylist,
    playPlaylist,
    playCheckPlaylist,
    mostrarPlaylists,
    addCancionPlaylist,
    eliminarCancionPlaylist,
} from "@/utils/playlistController.js";
import { usuarioEnVoiceChannel } from "@/utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playlist")
        .setDescription("Gestiona playlists con opciones para crear, editar y eliminar")
        .addSubcommand((sub) =>
            sub
                .setName("create")
                .setDescription("Crea una playlist")
                .addStringOption((option) =>
                    option.setName("name").setDescription("Nombre de la playlist").setRequired(true),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("play")
                .setDescription("Reproduce una playlist")
                .addStringOption((option) =>
                    option
                        .setName("name")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("remove")
                .setDescription("Elimina una playlist")
                .addStringOption((option) =>
                    option
                        .setName("name")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        )
        .addSubcommand((sub) => sub.setName("list").setDescription("Muestra todas las playlists"))
        .addSubcommand((sub) =>
            sub
                .setName("add")
                .setDescription("Añade una canción a una playlist")
                .addStringOption((option) =>
                    option
                        .setName("playlist")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true)
                        .setAutocomplete(true),
                )
                .addStringOption((option) =>
                    option.setName("url").setDescription("Url de la cancion").setRequired(true),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("delete")
                .setDescription("Elimina una canción de una playlist")
                .addStringOption((option) =>
                    option
                        .setName("playlist")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true)
                        .setAutocomplete(true),
                )
                .addStringOption((option) =>
                    option
                        .setName("name")
                        .setDescription("nombre de la cancion")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        ),

    async autocomplete(interaction: ChatInputCommandInteraction | AutocompleteInteraction) {
        await mongo.connect();
        try {
            const guildId = interaction.guildId;
            if (!guildId) return;

            const playlists = await coleccion.find({ serverId: guildId }).toArray();

            let focusedValue = "";
            if (interaction.isAutocomplete()) {
                focusedValue = interaction.options.getFocused();
            }

            const obtenerPlaylistNombres = () => {
                const playlistList: string[] = [];
                playlists.forEach((doc) => {
                    Object.keys(doc).forEach((playlistName) => {
                        if (playlistName !== "serverId" && playlistName !== "_id") {
                            playlistList.push(playlistName);
                        }
                    });
                });
                return playlistList;
            };

            if (interaction.isAutocomplete()) {
                switch (interaction.options.getSubcommand()) {
                    case "remove":
                    case "add":
                        {
                            let filteredPlaylist = obtenerPlaylistNombres().filter((playlistName) =>
                                String(playlistName).toLowerCase().startsWith(focusedValue.toLowerCase()),
                            );

                            let playlistsRespuesta = filteredPlaylist.map((playlist) => ({
                                name: playlist,
                                value: playlist,
                            }));

                            if (playlistsRespuesta.length === 0 && focusedValue !== "") {
                                playlistsRespuesta.push({
                                    name: "No hay playlists que empiecen por " + focusedValue.toLowerCase(),
                                    value: "none",
                                });
                            } else if (filteredPlaylist.length === 0) {
                                playlistsRespuesta.push({
                                    name: "No existen playlists en este servidor",
                                    value: "none",
                                });
                            }

                            await interaction.respond(playlistsRespuesta);
                        }
                        break;
                    case "delete":
                        {
                            const focusedOptionName = interaction.options.getFocused(true).name;
                            const playlistsData = playlists[0] ?? {};

                            // Obtener nombres de playlists
                            const playlistNombres = Object.keys(playlistsData).filter(
                                (pl) => pl !== "serverId" && pl !== "_id",
                            );

                            const filtrarPorTexto = (arr: string[], texto: string) =>
                                arr.filter((item) => item.toLowerCase().startsWith(texto.toLowerCase()));

                            switch (focusedOptionName) {
                                case "playlist":
                                    {
                                        // Filtra las playlists que tengan al menos una canción
                                        let playlistConCanciones = playlistNombres.filter(
                                            (name) => Object.keys(playlistsData[name]).length > 0,
                                        );

                                        // Si el usuario está escribiendo, filtrar las playlists que empiecen por este texto
                                        if (focusedValue)
                                            playlistConCanciones = filtrarPorTexto(playlistConCanciones, focusedValue);

                                        // Si hay playlists filtradas, se mapean a objetos {name, value}
                                        // Si no hay coincidencias, se devuelve un mensaje indicando que no hay playlists
                                        const respuesta =
                                            playlistConCanciones.length > 0
                                                ? playlistConCanciones.map((name) => ({ name, value: name }))
                                                : [
                                                      {
                                                          name: focusedValue
                                                              ? `No hay playlists que empiecen por ${focusedValue}`
                                                              : "No existen playlists",
                                                          value: "__empty__", // Valor especial para indicar que no hay opción válida
                                                      },
                                                  ];

                                        await interaction.respond(respuesta);
                                    }
                                    break;
                                case "name": {
                                    const playlistSeleccionada = interaction.options.getString("playlist") ?? "";

                                    // Obtenemos las canciones de esa playlist del objeto 'playlistsData'
                                    // Si no existe la playlist, usamos un objeto vacío para evitar errores
                                    const canciones = playlistsData[playlistSeleccionada] ?? {};

                                    const respuesta: ApplicationCommandOptionChoiceData<string>[] =
                                        Object.keys(canciones).length > 0 // Si hay canciones
                                            ? Object.entries(canciones).map(([title]) => ({
                                                  name: title,
                                                  value: title,
                                              }))
                                            : [{ name: "No hay canciones en esta playlist", value: "none" }];

                                    await interaction.respond(respuesta);
                                }
                            }
                        }
                        break;
                    case "play":
                        {
                            const obtenerPlaylists = obtenerPlaylistNombres().filter((name) => {
                                const songs = playlists[0]?.[name];
                                return Object.keys(songs).length > 0;
                            });

                            let filteredPlaylists = obtenerPlaylists.map((name) => ({
                                name,
                                value: name,
                            }));

                            if (filteredPlaylists.length === 0) {
                                filteredPlaylists.push({
                                    name: "No hay playlists que empiecen por " + focusedValue.toLowerCase(),
                                    value: "none",
                                });
                            }
                            await interaction.respond(filteredPlaylists);
                        }
                        break;
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            await mongo.close();
        }
    },

    run: async ({ interaction }: { interaction: ChatInputCommandInteraction }) => {
        const { options, guildId } = interaction;
        const embed = new EmbedBuilder();
        const player = useMainPlayer();

        switch (options.getSubcommand()) {
            case "create":
                try {
                    let arrayCrear = await crearPlaylist(guildId, options.getString("name"));
                    if (arrayCrear) {
                        embed.setColor(arrayCrear["color"] as ColorResolvable).setDescription(arrayCrear["mensaje"]);
                        await interaction.reply({ embeds: [embed] });
                    }
                } catch (error) {
                    console.log(error);
                }
                break;
            case "list":
                try {
                    let arrayLista = await mostrarPlaylists(guildId);
                    embed
                        .setColor(arrayLista["color"] as ColorResolvable)
                        .setTitle("🎶 Lista de Playlists 🎶")
                        .setDescription(arrayLista["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log("Error al mostrar las playlists:" + error);
                }
                break;
            case "add":
                try {
                    const playlistName = options.getString("playlist");
                    const url = options.getString("url");

                    if (!playlistName || !url) {
                        await interaction.reply("❌| Faltan el nombre de la playlist o la url");
                        return;
                    }

                    const result = await player.search(url, {
                        requestedBy: interaction.user,
                    });
                    const track = result.tracks[0];

                    let tituloCancion = track?.title ?? "Título no encontrado";

                    let arrayAdd = (await addCancionPlaylist(guildId, url, playlistName, tituloCancion)) ?? {
                        color: Colors.Red,
                        mensaje: "Error inesperado.",
                    };
                    embed.setColor(arrayAdd["color"] as ColorResolvable).setDescription(arrayAdd["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
            case "play":
                if (!(await usuarioEnVoiceChannel(interaction))) {
                    return false;
                }
                try {
                    let arrayPlayCheck = (await playCheckPlaylist(guildId, options.getString("name"))) ?? {
                        color: Colors.Red,
                        mensaje: "Error inesperado.",
                    };
                    embed
                        .setColor(arrayPlayCheck["color"] as ColorResolvable)
                        .setDescription(arrayPlayCheck["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                    if (Number(arrayPlayCheck["color"]) === Colors.Green) {
                        playPlaylist(guildId, options.getString("name"), interaction);
                    }
                } catch (error) {
                    console.log(error);
                }
                break;
            case "remove":
                try {
                    let arrayRemove = await eliminarPlaylist(guildId, options.getString("name"));
                    embed.setColor(arrayRemove["color"] as ColorResolvable).setDescription(arrayRemove["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
            case "delete":
                try {
                    let arrayDelete = (await eliminarCancionPlaylist(
                        guildId,
                        options.getString("playlist"),
                        options.getString("name"),
                    )) ?? { color: Colors.Red, mensaje: "Error inesperado." };
                    embed.setColor(arrayDelete["color"] as ColorResolvable).setDescription(arrayDelete["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
        }
    },
};
