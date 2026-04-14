import {
    type AutocompleteInteraction,
    type ChatInputCommandInteraction,
    type ColorResolvable,
    Colors,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";
import { getPlaylists } from "@/config/db";
import type { CustomClient } from "@/types/lavalink";
import type { ServerPlaylistsDoc } from "@/types/types";
import {
    addCancionPlaylist,
    crearPlaylist,
    eliminarCancionPlaylist,
    eliminarPlaylist,
    mostrarPlaylists,
    playCheckPlaylist,
    playPlaylist,
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
                    option.setName("url").setDescription("Url o nombre de la canción").setRequired(true),
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
                        .setDescription("Nombre de la canción")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        ),

    async autocomplete(interaction: AutocompleteInteraction) {
        const playlistsDb = getPlaylists();
        if (!playlistsDb) return;
        const guildId = interaction.guildId;
        if (!guildId) return;

        try {
            const docs = await playlistsDb.find<ServerPlaylistsDoc>({ serverId: guildId }).toArray();
            const playlists = docs[0] ?? { serverId: guildId };

            const obtenerPlaylistNombres = (): string[] => {
                const set = new Set<string>();
                for (const doc of docs) {
                    for (const key of Object.keys(doc)) {
                        if (key !== "serverId" && key !== "_id") set.add(key);
                    }
                }
                return Array.from(set);
            };

            const crearOpciones = (items: string[]) => items.slice(0, 25).map((s) => ({ name: s, value: s }));
            const sub = interaction.options.getSubcommand();
            const focusedOption = interaction.options.getFocused(true);
            const focusedValue = focusedOption.value.toLowerCase();
            const startsWith = (arr: string[]) => arr.filter((n) => n.toLowerCase().startsWith(focusedValue));

            switch (sub) {
                case "add":
                case "remove":
                case "play": {
                    let playlistsFiltradas = obtenerPlaylistNombres();
                    if (sub === "play") {
                        playlistsFiltradas = playlistsFiltradas.filter(
                            (name) => Object.keys(playlists[name] ?? {}).length > 0,
                        );
                    }
                    return await interaction.respond(crearOpciones(startsWith(playlistsFiltradas)));
                }
                case "delete": {
                    if (focusedOption.name === "playlist") {
                        const playlistConCanciones = obtenerPlaylistNombres().filter(
                            (k) => Object.keys(playlists[k] ?? {}).length > 0,
                        );
                        return await interaction.respond(crearOpciones(startsWith(playlistConCanciones)));
                    }
                    if (focusedOption.name === "name") {
                        const playlistSeleccionada = interaction.options.getString("playlist") ?? "";
                        const canciones = playlists[playlistSeleccionada] ?? {};
                        return await interaction.respond(crearOpciones(startsWith(Object.keys(canciones))));
                    }
                    break;
                }
            }
        } catch (error) {
            console.error(error);
        }
    },

    run: async ({ client, interaction }: { client: CustomClient; interaction: ChatInputCommandInteraction }) => {
        const { options, guildId } = interaction;
        if (!guildId) return;

        async function responderEmbed(
            interaction: ChatInputCommandInteraction,
            result: { color: ColorResolvable; mensaje: string; titulo?: string } | undefined,
        ) {
            if (!result) return;
            const embed = new EmbedBuilder().setColor(result.color).setDescription(result.mensaje);
            if (result.titulo) embed.setTitle(result.titulo);

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed] });
            }
        }

        const subcommand = options.getSubcommand();

        switch (subcommand) {
            case "create": {
                const name = options.getString("name") ?? "Nueva Playlist";
                const arrayCrear = await crearPlaylist(guildId, name);
                await responderEmbed(interaction, arrayCrear);
                break;
            }

            case "list": {
                const arrayLista = await mostrarPlaylists(guildId);
                await responderEmbed(interaction, { ...arrayLista, titulo: "🎶 Lista de Playlists 🎶" });
                break;
            }

            case "add": {
                const playlistName = options.getString("playlist") ?? "";
                const query = options.getString("url") ?? "";
                await interaction.deferReply();

                const node = client.lavalink.nodeManager.leastUsedNodes("playingPlayers")[0];
                if (!node?.connected) {
                    return await responderEmbed(interaction, { color: Colors.Red, mensaje: "Servidor no disponible." });
                }

                const res = await node.search(query.startsWith("http") ? query : `ytsearch:${query}`, interaction.user);
                if (!res.tracks.length) {
                    return await responderEmbed(interaction, { color: Colors.Red, mensaje: "Sin resultados." });
                }

                const track = res.tracks[0];
                const arrayAdd = await addCancionPlaylist(guildId, track.info.uri, playlistName, track.info.title);
                await responderEmbed(interaction, arrayAdd);
                break;
            }

            case "play": {
                if (!(await usuarioEnVoiceChannel(interaction))) return;
                const playlistToPlay = options.getString("name") ?? "";
                const arrayPlayCheck = await playCheckPlaylist(guildId, playlistToPlay);

                if (arrayPlayCheck && Number(arrayPlayCheck.color) === Colors.Green) {
                    await responderEmbed(interaction, arrayPlayCheck);
                    await playPlaylist(guildId, playlistToPlay, interaction);
                } else {
                    await responderEmbed(interaction, arrayPlayCheck);
                }
                break;
            }

            case "remove": {
                const removeName = options.getString("name") ?? "";
                const arrayRemove = await eliminarPlaylist(guildId, removeName);
                await responderEmbed(interaction, arrayRemove);
                break;
            }

            case "delete": {
                const delPlaylist = options.getString("playlist") ?? "";
                const delSong = options.getString("name") ?? "";
                const arrayDelete = await eliminarCancionPlaylist(guildId, delPlaylist, delSong);
                await responderEmbed(interaction, arrayDelete);
                break;
            }
        }
    },
};
