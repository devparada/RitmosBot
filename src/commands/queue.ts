import { type ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { ExtendedClient } from "@/types/discord";
import { usuarioEnVoiceChannel } from "@/utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder().setName("queue").setDescription("Muestra la cola de canciones actual"),

    run: async ({ client, interaction }: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const embed = new EmbedBuilder();

        if (!(await usuarioEnVoiceChannel(interaction))) {
            return false;
        }

        if (interaction.guildId) {
            const player = client.lavalink.getPlayer(interaction.guildId);

            if (!player?.queue.current) {
                embed.setColor(Colors.Red).setDescription("❌ No hay ninguna canción en la cola o reproduciendose");
                return await interaction.followUp({ embeds: [embed] });
            }

            try {
                const currentTrack = player.queue.current;
                const tracks = player.queue;
                const cancionesLimite = 20;

                let description = "";

                if (tracks.length > 0) {
                    description = tracks
                        .slice(0, cancionesLimite)
                        .map(
                            (song, id) =>
                                `🎶 **${id + 1}.** ${song.title} - \`${song.length ? formatMS(song.length) : "Live"}\``,
                        )
                        .join("\n");

                    if (tracks.length > cancionesLimite) {
                        description += `\n*... y ${tracks.length - cancionesLimite} canciones más.*`;
                    }
                } else {
                    description = "No hay canciones en la cola";
                }

                embed
                    .setColor(Colors.Blue)
                    .setTitle(`Cola de reproducción`)
                    .setThumbnail(currentTrack.thumbnail || null)
                    .setDescription(
                        `💿 **Está reproduciéndose**\n[${currentTrack.title}](${currentTrack.uri}) - \`${formatMS(currentTrack.length ?? 0)}\`\n\n` +
                            `**Próximas canciones:**\n${description}`,
                    )
                    .setFooter({ text: `Total en cola: ${tracks.length + 1} | Modo repetición: ${player.loop}` });

                return await interaction.followUp({ embeds: [embed] });
            } catch (error) {
                console.log("Error al mostrar la cola de canciones:", error);
                embed.setColor(Colors.Red).setDescription("Error al intentar mostrar la cola de canciones");
                await interaction.followUp({ embeds: [embed] });
            }
        }
    },
};

// Función auxiliar para formatear milisegundos (Lavalink usa ms)
function formatMS(ms: number) {
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const h = Math.floor(ms / (1000 * 60 * 60));
    return `${h > 0 ? `${h}:` : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
