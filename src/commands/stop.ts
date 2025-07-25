import { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { useMainPlayer } from "discord-player";
import { usuarioEnVoiceChannel } from "src/utils/utils";

module.exports = {
    data: new SlashCommandBuilder().setName("stop").setDescription("Para la canción actual"),

    run: async ({ interaction }: { interaction: ChatInputCommandInteraction }) => {
        const embed = new EmbedBuilder();

        if (!usuarioEnVoiceChannel(interaction)) {
            return false;
        }

        const player = useMainPlayer();
        if (interaction.guild != null) {
            const queue = player.nodes.get(interaction.guild.id);

            if (!queue) {
                embed.setColor("Red").setDescription("No hay ninguna canción reproduciéndose en este momento");
                return await interaction.reply({ embeds: [embed] });
            } else {
                try {
                    if (queue.repeatMode > 0) {
                        queue.setRepeatMode(0);
                    }
                    queue.node.stop(false);
                } catch (error) {
                    console.log(error);
                    embed.setColor("Red").setDescription("Error al intentar parar la canción");
                    return await interaction.reply({ embeds: [embed] });
                }

                embed.setColor("Green").setDescription("✅ Canción parada con éxito");
                await interaction.reply({ embeds: [embed] });
            }
        }
    },
};
