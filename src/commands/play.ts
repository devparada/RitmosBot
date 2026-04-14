import {
    type ChatInputCommandInteraction,
    type ColorResolvable,
    Colors,
    EmbedBuilder,
    type GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import fetch from "isomorphic-unfetch";
import type { KazagumoSearchResult } from "kazagumo";
import type { ExtendedClient } from "@/types/discord";
import { usuarioEnVoiceChannel } from "@/utils/voiceUtils";

const spotify = require("spotify-url-info")(fetch);

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce una canción o playlist (Soporta Spotify sin API)")
        .addStringOption((opt) => opt.setName("url").setDescription("URL o nombre de la canción").setRequired(false))
        .addAttachmentOption((opt) => opt.setName("file").setDescription("Archivo de audio").setRequired(false)),

    run: async ({ client, interaction }: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const { options, member, guildId } = interaction;
        const voiceChannel = (member as GuildMember).voice.channel;
        let query = options.getAttachment("file")?.url || options.getString("url");
        const embed = new EmbedBuilder();

        if (!guildId) return interaction.editReply("Este comando solo puede usarse en un servidor.");
        if (!(await usuarioEnVoiceChannel(interaction))) return;

        if (!query) {
            return interaction.editReply({
                embeds: [embed.setColor(Colors.Red).setDescription("Debes proporcionar una URL, nombre o archivo.")],
            });
        }

        try {
            // Lógica de extracción de Spotify
            const isSpotify = /^(https?:\/\/)?(open\.spotify\.com|spotify\.link)\/(track|playlist|album)\/.+/.test(
                query,
            );
            let spotifyTracks: string[] = [];

            if (isSpotify) {
                try {
                    const spData = await spotify.getDetails(query);
                    const type = spData.type || spData.preview?.type;

                    if (type === "track") {
                        query = `${spData.preview.title} ${spData.preview.artist}`;
                    } else if (spData.tracks) {
                        // Es playlist o álbum
                        const allTracks = spData.tracks.map(
                            (t: any) => `${t.name} ${t.artist || t.artists?.[0]?.name || ""}`,
                        );
                        const first = allTracks.shift();
                        if (first) {
                            query = first;
                            spotifyTracks = allTracks;
                        }
                    }
                } catch (err) {
                    console.error("Error extrayendo de Spotify:", err);
                    // Si falla el scraping, intentamos limpiar la URL para que Lavalink busque algo
                    query = query?.split("/").pop()?.split("?")[0] || query;
                }
            }

            // Obtener o crear el player con Kazagumo
            const player = await client.lavalink.createPlayer({
                guildId: guildId,
                voiceId: voiceChannel!.id,
                textId: interaction.channelId,
                deaf: true,
            });

            // Buscar la primera canción
            const result = await client.lavalink.search(query!, { requester: interaction.user });

            if (!result.tracks.length) {
                return interaction.editReply({
                    embeds: [embed.setColor(Colors.Red).setDescription("No se encontraron resultados.")],
                });
            }

            const track = result.tracks[0];
            player.queue.add(track);

            // Si es una playlist de Spotify, cargar el resto en segundo plano
            if (spotifyTracks.length > 0) {
                (async () => {
                    for (const name of spotifyTracks) {
                        try {
                            const res: KazagumoSearchResult = await client.lavalink.search(name, {
                                requester: interaction.user,
                            });
                            if (res.tracks.length > 0) player.queue.add(res.tracks[0]);
                        } catch (e) {
                            console.error(`Error en segundo plano para: ${name}`, e);
                        }
                    }
                })();
            }

            if (!player.playing && !player.paused) player.play();

            const isQueue = player.queue.length > 1 || player.playing;
            const responseEmbed = new EmbedBuilder()
                .setColor((isQueue ? Colors.Blue : Colors.Green) as ColorResolvable)
                .setTitle(track.title.substring(0, 256))
                .setThumbnail(track.thumbnail || null)
                .setDescription(`**Autor:** ${track.author}`)
                .setFooter({
                    text:
                        spotifyTracks.length > 0
                            ? `Añadiendo ${spotifyTracks.length} canciones más de la playlist...`
                            : isQueue
                              ? `Posición en cola: #${player.queue.length}`
                              : "Reproduciendo ahora",
                })
                .setTimestamp();

            return interaction.editReply({ embeds: [responseEmbed] });
        } catch (error) {
            console.error("Error en comando Play:", error);
            if (!interaction.replied) {
                await interaction.editReply("Ocurrió un error al procesar la reproducción.");
            }
        }
    },
};
