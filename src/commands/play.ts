import {
    type ChatInputCommandInteraction,
    type ColorResolvable,
    Colors,
    EmbedBuilder,
    type GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import fetch from "isomorphic-unfetch";
import type { Track } from "lavalink-client";
import type { ExtendedClient } from "@/types/discord";
import type { ExtendedTrackInfo } from "@/types/types";
import { usuarioEnVoiceChannel } from "@/utils/voiceUtils";

const spotify = require("spotify-url-info")(fetch);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce una canción o playlist")
        .addStringOption((opt) => opt.setName("url").setDescription("URL o nombre"))
        .addAttachmentOption((opt) => opt.setName("file").setDescription("Archivo de audio")),

    run: async ({ client, interaction }: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const { options, member, guildId } = interaction;
        const voiceChannel = (member as GuildMember).voice.channel;
        let query = options.getAttachment("file")?.url || options.getString("url");
        const embed = new EmbedBuilder();

        // Validaciones
        if (!guildId) {
            return interaction.editReply("Este comando solo puede usarse en un servidor.");
        }

        if (!(await usuarioEnVoiceChannel(interaction))) return false;

        if (!query)
            return interaction.editReply({
                embeds: [embed.setColor(Colors.Red).setDescription("Debes proporcionar una URL o un archivo.")],
            });

        try {
            const nodes = client.lavalink.nodeManager.leastUsedNodes("playingPlayers");
            const node = nodes[0];
            if (!node?.connected) {
                return interaction.editReply({
                    embeds: [
                        embed
                            .setColor(Colors.Red)
                            .setDescription(
                                "¡El servidor de música (Lavalink) se está reiniciando! Prueba en unos segundos.",
                            ),
                    ],
                });
            }

            // --- LÓGICA DE PARSING DE SPOTIFY ---
            let tracksToLoad: string[] = [];

            const isSpotify = /^(https?:\/\/)?(open\.spotify\.com|spotify\.link)\/(track|playlist|album)\/.+/.test(
                query,
            );

            if (isSpotify) {
                try {
                    const spData = await spotify.getDetails(query);
                    const type = spData.type || spData.preview?.type;

                    console.log("Tipo detectado:", type);

                    if (type === "track") {
                        // Convertimos el link en texto plano inmediatamente
                        query = `${spData.preview.title} ${spData.preview.artist}`;
                    } else if (type === "playlist" || type === "album") {
                        const allTracks = spData.tracks.map(
                            (t: { name: string; artist?: string }) => `${t.name} ${t.artist || ""}`,
                        );
                        const firstMatch = allTracks.shift();
                        if (firstMatch) {
                            query = firstMatch;
                            tracksToLoad = allTracks;
                        } else {
                            console.log("Aviso: spData llegó vacío o sin tipo. Limpiando query manualmente...");
                            query = query.split("/").pop()?.split("?")[0] || "spotify song";
                        }
                    }
                } catch (error) {
                    console.error("Error dentro del bloque Spotify:", error);
                    if (query) {
                        query = query.split("/").pop()?.split("?")[0] || "spotify search";
                    }
                }
            }

            if (voiceChannel) {
                const player =
                    client.lavalink.getPlayer(guildId) ||
                    client.lavalink.createPlayer({
                        guildId: guildId,
                        voiceChannelId: voiceChannel.id,
                        textChannelId: interaction.channelId,
                        selfDeaf: true,
                        volume: 100,
                    });

                if (!player.connected) await player.connect();

                const searchIdentifier = isSpotify
                    ? `ytsearch:${query}`
                    : query?.startsWith("http")
                      ? query
                      : `ytsearch:${query}`;

                const res = await node.search(searchIdentifier, interaction.user);

                if (!res.tracks.length)
                    return interaction.editReply({
                        embeds: [embed.setColor(Colors.Red).setDescription("No se encontraron resultados.")],
                    });

                const track = res.tracks[0];
                const isAddingToQueue = player.playing || player.queue.tracks.length > 0;

                if (isAddingToQueue) {
                    player.queue.add(track);
                } else {
                    await player.play({ track });
                }

                if (tracksToLoad.length > 0) {
                    console.log(`Cargando ${tracksToLoad.length} canciones adicionales de la playlist...`);

                    // Usamos un bucle para procesar el resto de canciones
                    // Nota: No usamos await aquí para no bloquear la respuesta de la interacción
                    tracksToLoad.forEach(async (trackName) => {
                        try {
                            const searchRest = await node.search(`ytsearch:${trackName}`, interaction.user);
                            if (searchRest.tracks.length > 0) {
                                player.queue.add(searchRest.tracks[0]);
                            }
                        } catch (err) {
                            console.error(`Error cargando canción de playlist: ${trackName}`, err);
                        }
                    });
                }

                const responseEmbed = createPlayEmbed(track, isAddingToQueue, player.queue.tracks.length);

                // Si era una playlist, añadimos una nota al embed
                if (tracksToLoad.length > 0) {
                    responseEmbed.setFooter({
                        text: `Se han añadido ${tracksToLoad.length} canciones más de la playlist.`,
                    });
                }

                await interaction.editReply({ embeds: [responseEmbed] });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error en Play:", error);
                await interaction.editReply({
                    embeds: [embed.setColor(Colors.Red).setDescription(`Error: ${error.message}`)],
                });
            }
        }

        function createPlayEmbed(track: Track, isQueue: boolean, queuePos: number): EmbedBuilder {
            const info = track.info as ExtendedTrackInfo;
            return new EmbedBuilder()
                .setColor((isQueue ? Colors.Blue : Colors.Green) as ColorResolvable)
                .setTitle(track.info.title.substring(0, 256))
                .setThumbnail(track.info.artworkUrl ?? info.pluginInfo?.artworkUrl ?? null)
                .setDescription(`**Autor:** ${track.info.author}`)
                .setFooter(isQueue ? { text: `Posición en cola: #${queuePos}` } : null)
                .setTimestamp();
        }
    },
};
