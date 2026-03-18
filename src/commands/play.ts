import {
    type ChatInputCommandInteraction,
    type ColorResolvable,
    Colors,
    EmbedBuilder,
    type GuildMember,
    SlashCommandBuilder,
} from "discord.js";
import type { Track } from "lavalink-client";
import type { ExtendedClient } from "@/types/discord";
import type { ExtendedTrackInfo } from "@/types/types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce una canción o playlist")
        .addStringOption((opt) => opt.setName("url").setDescription("URL o nombre"))
        .addAttachmentOption((opt) => opt.setName("file").setDescription("Archivo de audio")),

    run: async ({ client, interaction }: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const { options, member, guildId } = interaction;
        const voiceChannel = (member as GuildMember)?.voice.channel;
        const query = options.getAttachment("file")?.url || options.getString("url");
        const embed = new EmbedBuilder();

        // Validaciones
        if (!guildId) {
            return interaction.editReply("Este comando solo puede usarse en un servidor.");
        }

        if (!voiceChannel)
            return interaction.editReply({
                embeds: [
                    embed
                        .setColor(Colors.Red)
                        .setDescription("¡Debes estar en un canal de voz para reproducir música!"),
                ],
            });

        if (!query)
            return interaction.editReply({
                embeds: [embed.setColor(Colors.Red).setDescription("Debes proporcionar una URL o un archivo.")],
            });

        try {
            const node = client.lavalink.nodeManager.leastUsedNodes("playingPlayers")[0];
            if (!node || !node.connected) {
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

            const res = await node.search(query.startsWith("http") ? query : `ytsearch:${query}`, interaction.user);
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

            const responseEmbed = createPlayEmbed(track, isAddingToQueue, player.queue.tracks.length);
            await interaction.editReply({ embeds: [responseEmbed] });
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
