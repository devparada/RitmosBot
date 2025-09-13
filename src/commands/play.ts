import {
    EmbedBuilder,
    SlashCommandBuilder,
    MessageFlags,
    ChatInputCommandInteraction,
    GuildMember,
    Colors,
    Attachment,
} from "discord.js";
import { useMainPlayer } from "discord-player";
import { usuarioEnVoiceChannel } from "@/utils/voiceUtils";

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

        if (!(member instanceof GuildMember)) return false;

        const voiceChannel = member.voice.channel;
        const embed = new EmbedBuilder();

        // Validaciones iniciales
        if (!voiceChannel) {
            return interaction.reply({
                embeds: [
                    embed
                        .setColor(Colors.Red)
                        .setDescription("¡Debes estar en un canal de voz para reproducir música!"),
                ],
                flags: MessageFlags.Ephemeral,
            });
        }

        if (!(await usuarioEnVoiceChannel(interaction))) return false;

        const validarArgumentos = validatePlayOptions(query, file, embed);
        if (validarArgumentos) {
            return interaction.reply({ embeds: [validarArgumentos], flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        try {
            const searchQuery = file ? file.url : query!;
            const player = useMainPlayer();

            const queue =
                player.nodes.get(interaction.guild!.id) ??
                player.nodes.create(interaction.guild!, {
                    metadata: interaction,
                    // Ensordece al bot
                    selfDeaf: true,
                    leaveOnEmpty: false,
                    leaveOnEnd: false,
                    leaveOnStop: false,
                });

            if (!queue.connection) {
                try {
                    await queue.connect(voiceChannel);
                } catch (err) {
                    console.error("No se pudo conectar al canal de voz:", err);
                    embed.setColor(Colors.Red).setDescription("No se pudo unir al canal de voz");
                    return interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
                }
            }

            // Buscar track o playlist
            const searchResult = await player.search(searchQuery, { requestedBy: interaction.user });
            if (!searchResult.tracks.length) {
                embed.setColor(Colors.Red).setDescription("No se ha podido encontrar la canción");
                return interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            // Añadir track a la cola
            if (searchResult.playlist) {
                queue.addTrack(searchResult.tracks);
                embed
                    .setColor(Colors.Green)
                    .setDescription(`💿 Añadida la playlist con ${searchResult.tracks.length} canciones 💿`);
            } else {
                queue.addTrack(searchResult.tracks[0]);
                embed.setColor(Colors.Green).setDescription(`💿 Añadido a la cola: ${searchResult.tracks[0].title} 💿`);
            }

            await interaction.followUp({ embeds: [embed] });

            // Sólo reproduce si no está sonando ni pausado y hay canciones en cola
            if (!queue.node.isPlaying() && !queue.node.isPaused() && queue.tracks.size > 0) {
                await queue.node.play();
            }
        } catch (error) {
            console.error(error);
            embed.setColor(Colors.Red).setDescription("Hubo un error al intentar reproducir la canción");
            await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        function validatePlayOptions(
            query: string | null,
            file: Attachment | null,
            embed: EmbedBuilder,
        ): EmbedBuilder | null {
            if (query && file) {
                return embed
                    .setColor(Colors.Red)
                    .setDescription("Sólo puedes usar **una** opción: `url` o `file`, no ambas");
            }
            if (!query && !file) {
                return embed
                    .setColor(Colors.Red)
                    .setDescription("Debes especificar una URL o subir un archivo para reproducir música");
            }
            return null;
        }
    },
};
