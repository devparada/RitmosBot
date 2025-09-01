import { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { useMainPlayer } from "discord-player";
import { usuarioEnVoiceChannel } from "../utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder().setName("skip").setDescription("Salta la canción actual"),

    run: async ({ interaction }: { interaction: ChatInputCommandInteraction }) => {
        const embed = new EmbedBuilder();

        if (!usuarioEnVoiceChannel(interaction)) {
            return false;
        } else {
            const player = useMainPlayer();
            const queue = player.nodes.get(interaction.guild!.id);

            if (!queue) {
                embed.setColor("Red").setDescription("No hay ninguna canción reproduciéndose en este momento");
                return await interaction.reply({ embeds: [embed] });
            } else if (queue.tracks.data.length === 0) {
                queue.node.stop();
                embed.setColor("Blue").setDescription("Se ha saltado la canción que se estaba reproduciendo");
                return await interaction.reply({ embeds: [embed] });
            } else {
                try {
                    queue.node.skip();
                } catch (error) {
                    console.log(error);
                    embed.setColor("Red").setDescription("Error al intentar skipear la canción");
                    return await interaction.reply({ embeds: [embed] });
                }

                embed.setColor("Green").setDescription("✅ Canción skipeada con éxito");
                return await interaction.reply({ embeds: [embed] });
            }
        }
    },
};
