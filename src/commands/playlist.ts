import { useMainPlayer } from "discord-player";
import {
    ApplicationCommandOptionChoiceData,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    ColorResolvable,
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
} from "../utils/playlistController.js";
import { usuarioEnVoiceChannel } from "src/utils/utils.js";

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

    async autocomplete({ interaction }: { interaction: ChatInputCommandInteraction | AutocompleteInteraction }) {
        await mongo.connect();
        try {
            const { options } = interaction;
            const guildId = interaction.guildId;
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
                switch (options.getSubcommand()) {
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
                            switch (interaction.options.getFocused(true).name) {
                                case "playlist":
                                    {
                                        let filteredPlaylist = [];
                                        let playlistList = obtenerPlaylistNombres().filter((name) => {
                                            const songs = playlists[0]?.[name];
                                            return Object.keys(songs).length > 0;
                                        });

                                        var playlistsFiltrada;
                                        // Filtramos las playlists que empiezan con el texto que el usuario está escribiendo
                                        if (focusedValue.length > 0) {
                                            filteredPlaylist = playlistList.filter((playlistName) =>
                                                String(playlistName)
                                                    .toLowerCase()
                                                    .startsWith(focusedValue.toLowerCase()),
                                            );
                                            playlistsFiltrada = filteredPlaylist;
                                        } else {
                                            playlistsFiltrada = playlistList;
                                        }

                                        const playlistsRespuesta1: ApplicationCommandOptionChoiceData<string>[] =
                                            playlistsFiltrada.map((playlist) => ({
                                                name: playlist,
                                                value: playlist,
                                            }));
                                        if (playlistsRespuesta1.length === 0) {
                                            if (focusedValue.length > 0) {
                                                playlistsRespuesta1.push({
                                                    name:
                                                        "No hay playlists que empiecen por " +
                                                        focusedValue.toLowerCase(),
                                                    value: "__no_match__",
                                                });
                                            } else {
                                                playlistsRespuesta1.push({
                                                    name: "No existen playlists en este servidor",
                                                    value: "__empty__",
                                                });
                                            }
                                        }

                                        await interaction.respond(playlistsRespuesta1);
                                    }
                                    break;
                                case "name": {
                                    const focusedPlaylistName = options.getString("playlist");

                                    if (playlists && focusedPlaylistName) {
                                        const songs = playlists[0]?.[focusedPlaylistName];

                                        if (songs && Object.keys(songs).length > 0) {
                                            const songOptions = Object.entries(songs).map(([title, url]) => ({
                                                name: `${title}`,
                                                value: String(url),
                                            }));
                                            await interaction.respond(songOptions);
                                        } else {
                                            await interaction.respond([
                                                { name: "No hay canciones en esta categoría", value: "none" },
                                            ]);
                                        }
                                    } else {
                                        if (interaction.isAutocomplete()) {
                                            await interaction.respond([
                                                { name: "No existe la playlist selecionada", value: "none" },
                                            ]);
                                        }
                                    }
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
                        embed
                            .setColor(arrayCrear["color"].toUpperCase() as ColorResolvable)
                            .setDescription(arrayCrear["mensaje"]);
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
                        .setColor(arrayLista["color"].toUpperCase() as ColorResolvable)
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

                    var tituloCancion;
                    if (track && track.title) {
                        tituloCancion = track.title;
                    } else {
                        tituloCancion = "Título no encontrado";
                    }

                    let arrayAdd = (await addCancionPlaylist(guildId, url, playlistName, tituloCancion)) ?? {
                        color: "RED",
                        mensaje: "Error inesperado.",
                    };
                    embed
                        .setColor(arrayAdd["color"].toUpperCase() as ColorResolvable)
                        .setDescription(arrayAdd["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
            case "play":
                if (!usuarioEnVoiceChannel(interaction)) {
                    return false;
                }
                try {
                    let arrayPlayCheck = (await playCheckPlaylist(guildId, options.getString("name"))) ?? {
                        color: "RED",
                        mensaje: "Error inesperado.",
                    };
                    embed
                        .setColor(arrayPlayCheck["color"].toUpperCase() as ColorResolvable)
                        .setDescription(arrayPlayCheck["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                    if (arrayPlayCheck["color"] === "Green") {
                        playPlaylist(guildId, options.getString("name"), interaction);
                    }
                } catch (error) {
                    console.log(error);
                }
                break;
            case "remove":
                try {
                    let arrayRemove = await eliminarPlaylist(guildId, options.getString("name"));
                    embed
                        .setColor(arrayRemove["color"].toUpperCase() as ColorResolvable)
                        .setDescription(arrayRemove["mensaje"]);
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
                    )) ?? { color: "RED", mensaje: "Error inesperado." };
                    embed
                        .setColor(arrayDelete["color"].toUpperCase() as ColorResolvable)
                        .setDescription(arrayDelete["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
        }
    },
};
