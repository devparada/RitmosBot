import { type ChatInputCommandInteraction, Colors, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";
import { type GuildQueue, type Track, useMainPlayer } from "discord-player";

/**
 * Verifica si el usuario está en un canal de voz y envia el embed si no lo está
 * @return Devuelve `false` si no está en un canal de voz
 */
export async function usuarioEnVoiceChannel(interaction: ChatInputCommandInteraction): Promise<boolean> {
    const member = interaction.member;
    const embed = new EmbedBuilder();

    if (member instanceof GuildMember) {
        if (!member.voice.channel) {
            await interaction.reply({
                embeds: [
                    embed
                        .setColor(Colors.Red)
                        .setDescription("¡Debes estar en un canal de voz para reproducir música!"),
                ],
                flags: MessageFlags.Ephemeral,
            });

            return false;
        }
    }
    return true;
}

export async function getValidatedQueue(
    interaction: ChatInputCommandInteraction,
    emptyMessage: string,
): Promise<GuildQueue<Track> | null> {
    if (!(await usuarioEnVoiceChannel(interaction))) {
        return null;
    }

    const guild = interaction.guild;
    if (!guild) return null;

    const player = useMainPlayer();
    const queue = player.nodes.get<Track>(guild.id);

    if (!queue) {
        const embed = new EmbedBuilder().setColor(Colors.Red).setDescription(emptyMessage);
        await interaction.reply({ embeds: [embed] });
        return null;
    }

    return queue;
}
