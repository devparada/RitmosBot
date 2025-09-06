import { ChatInputCommandInteraction, Colors, EmbedBuilder, GuildMember, MessageFlags } from "discord.js";

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
