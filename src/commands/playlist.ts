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
        if (!interaction.isAutocomplete()) return;

        const guildId = interaction.guildId;
        if (!guildId) return;

        await mongo.connect();
        try {
            const docs = await coleccion.find({ serverId: guildId }).toArray();
            const playlists: Record<string, unknown> = docs[0] ?? {};

            const obtenerPlaylistNombres = (): string[] => {
                const set = new Set<string>();
                for (const doc of docs) {
                    for (const key of Object.keys(doc)) {
                        if (key !== "serverId" && key !== "_id") {
                            set.add(key);
                        }
                    }
                }
                return Array.from(set);
            };

            const crearOpciones = (items: string[]) => items.slice(0, 25).map((s) => ({ name: s, value: s })); // Discord limita a 25 opciones

            const sub = interaction.options.getSubcommand();
            const focusedRaw = interaction.options.getFocused();
            const focusedValue = focusedRaw ? String(focusedRaw) : "";
            const focusedLower = focusedValue.toLowerCase();
            const startsWith = (arr: string[]) => arr.filter((n) => n.toLowerCase().startsWith(focusedLower));

            switch (sub) {
                case "add":
                case "remove": {
                    // Todas las playlists del servidor
                    let playlistsFiltradas = obtenerPlaylistNombres();

                    if (focusedValue.length > 0) {
                        playlistsFiltradas = startsWith(playlistsFiltradas);
                    }

                    const respuesta =
                        playlistsFiltradas.length > 0
                            ? crearOpciones(playlistsFiltradas)
                            : [
                                  {
                                      name: focusedValue
                                          ? `No hay playlists que empiecen por "${focusedValue}"`
                                          : "No existen playlists en este servidor",
                                      value: "none",
                                  },
                              ];
                    await interaction.respond(respuesta);
                    break;
                }
                case "delete":
                    {
                        const focusedOption = interaction.options.getFocused(true).name;

                        switch (focusedOption) {
                            case "playlist":
                                {
                                    // Filtra las playlists que tengan al menos una canción
                                    let playlistConCanciones = Object.keys(playlists).filter(
                                        (k) =>
                                            k !== "serverId" &&
                                            k !== "_id" &&
                                            Object.keys(playlists[k] ?? {}).length > 0,
                                    );

                                    // Si el usuario está escribiendo, filtrar las playlists que empiecen por este texto
                                    if (focusedValue) playlistConCanciones = startsWith(playlistConCanciones);

                                    // Si hay playlists filtradas, se mapean a objetos {name, value}
                                    // Si no hay coincidencias, se devuelve un mensaje indicando que no hay playlists
                                    const respuesta =
                                        playlistConCanciones.length > 0
                                            ? crearOpciones(playlistConCanciones)
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
                                const canciones = playlists[playlistSeleccionada] ?? {};
                                const nombresCanciones = Object.keys(canciones);

                                const respuesta: ApplicationCommandOptionChoiceData<string>[] =
                                    nombresCanciones.length > 0 // Si hay canciones
                                        ? crearOpciones(nombresCanciones)
                                        : [{ name: "No hay canciones en esta playlist", value: "none" }];

                                await interaction.respond(respuesta);
                            }
                        }
                    }
                    break;
                case "play":
                    {
                        let obtenerPlaylists = obtenerPlaylistNombres().filter((name) => {
                            const songs = playlists[name] ?? {};
                            return songs && typeof songs === "object" && Object.keys(songs).length > 0;
                        });

                        if (focusedValue) obtenerPlaylists = startsWith(obtenerPlaylists);

                        const respuesta =
                            obtenerPlaylists.length > 0
                                ? crearOpciones(obtenerPlaylists)
                                : [
                                      {
                                          name: focusedValue
                                              ? `No hay playlists que empiecen por + "${focusedValue.toLowerCase()}"`
                                              : "No hay playlists disponibles para reproducir",
                                          value: "none",
                                      },
                                  ];
                        await interaction.respond(respuesta);
                    }
                    break;
            }
        } catch (error) {
            console.error("Error en el autocompletado playlist: " + error);
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
