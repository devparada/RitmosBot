import { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction, Colors } from "discord.js";
import { useMainPlayer } from "discord-player";
import { usuarioEnVoiceChannel } from "../utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder().setName("shuffle").setDescription("Mezcla las canciones de la cola actual"),

    run: async ({ interaction }: { interaction: ChatInputCommandInteraction }) => {
        const embed = new EmbedBuilder();

        if (!(await usuarioEnVoiceChannel(interaction))) {
            return false;
        } else {
            const player = useMainPlayer();
            const queue = player.nodes.get(interaction.guild!.id);

            if (!queue) {
                embed.setColor(Colors.Red).setDescription("No hay ninguna canción en la cola");
                return await interaction.reply({ embeds: [embed] });
            } else if (!queue.tracks.size) {
                embed.setColor(Colors.Red).setDescription("No hay más canciones en la cola");
                return await interaction.reply({ embeds: [embed] });
            } else {
                queue.tracks.shuffle();
                embed.setColor(Colors.Blue).setDescription("¡La cola ha sido mezclada!");
                return await interaction.reply({ embeds: [embed] });
            }
        }
    },
};
