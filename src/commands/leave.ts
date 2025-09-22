import { type ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { useMainPlayer } from "discord-player";
import { usuarioEnVoiceChannel } from "@/utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder().setName("leave").setDescription("Desconecta el bot del chat de voz"),

    run: async ({ interaction }: { interaction: ChatInputCommandInteraction }) => {
        const embed = new EmbedBuilder();

        // Verifica si el usuario está en un canal de voz
        if (!usuarioEnVoiceChannel) {
            return false;
        } else {
            const player = useMainPlayer();
            if (interaction.guild != null) {
                const queue = player.nodes.get(interaction.guild.id);

                if (!queue?.connection) {
                    embed.setColor(Colors.Red).setDescription("❌ No estoy conectado a ningún canal de voz");
                } else {
                    queue.delete();
                    embed.setColor(Colors.Green).setDescription("✅ Me he desconectado del canal de voz");
                }
            }
        }
        return interaction.reply({ embeds: [embed] });
    },
};
