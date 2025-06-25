import { EmbedBuilder, SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { useMainPlayer } from "discord-player";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce una canción o playlist")
        .addStringOption((option) =>
            option.setName("url").setDescription("Introduce una URL o texto").setRequired(false),
        )
        .addAttachmentOption((option) =>
            option.setName("file").setDescription("Sube un archivo de audio o video").setRequired(false),
        ),

    run: async ({ interaction }: { interaction: ChatInputCommandInteraction }) => {
        const { options, member } = interaction;
        const query = options.getString("url");
        const file = options.getAttachment("file");

        if (member instanceof GuildMember) {
            const voiceChannel = member.voice.channel;
            const embed = new EmbedBuilder();

            // Verifica si el usuario está en un canal de voz
            if (!voiceChannel) {
                embed.setColor("Red").setDescription("¡Debes estar en un canal de voz para reproducir música!");
                return interaction.reply({ embeds: [embed] });
                // Verifica si el usuario pone /play con la URL y un archivo adjunto
            } else if (query && file) {
                embed.setColor("Red").setDescription("Sólo puedes usar **una** opción: `url` o `file` no ambas");
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                // Verifica si el usuario sólo pone /play sin la URL o un archivo adjunto
            } else if (!query && !file) {
                embed
                    .setColor("Red")
                    .setDescription("Debes especificar una URL o subir un archivo para reproducir música");
                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            const player = useMainPlayer();
            await interaction.deferReply();
            const queue =
                player.nodes.get(interaction.guild!.id) ||
                player.nodes.create(interaction.guild!, {
                    metadata: {
                        channel: interaction.channel,
                    },
                    // Ensordece al bot
                    selfDeaf: true,
                    leaveOnEmpty: false,
                    leaveOnEnd: false,
                    leaveOnStop: false,
                });

            try {
                // Si es un archivo adjunto usa la URL, sino usa la URL de query
                const searchQuery = file ? file.url : query;
                const result = await player.search(searchQuery!, {
                    requestedBy: interaction.user,
                });

                if (!result || !result.tracks.length) {
                    embed.setColor("Red").setDescription("No se ha podido encontrar la canción");
                    return interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }

                if (!queue.connection) await queue.connect(voiceChannel);

                if (result.playlist) {
                    // Si es una playlist, añade todas las canciones
                    queue.addTrack(result.tracks);
                    embed
                        .setColor("Green")
                        .setDescription(`💿 Añadida la playlist con ${result.tracks.length} canciones 💿`);
                } else {
                    // Si es una sola canción, añade solo esa
                    queue.addTrack(result.tracks[0]);
                    embed.setColor("Green").setDescription(`💿 Añadido a la cola: ${result.tracks[0].title} 💿`);
                }

                await interaction.followUp({ embeds: [embed] });

                // Sólo reproduce si no está sonando ni pausado y hay canciones en cola
                if (!queue.node.isPlaying() && !queue.node.isPaused() && queue.tracks.size > 0) {
                    await queue.node.play();
                }
            } catch (error) {
                console.error(error);
                embed.setColor("Red").setDescription("Hubo un error al intentar reproducir la canción");
                await interaction.followUp({ embeds: [embed] });
            }
        }
    },
};
