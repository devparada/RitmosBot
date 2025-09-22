import { type ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getValidatedQueue, usuarioEnVoiceChannel } from "@/utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder().setName("skip").setDescription("Salta la canción actual"),

    run: async ({ interaction }: { interaction: ChatInputCommandInteraction }) => {
        if (!(await usuarioEnVoiceChannel(interaction))) {
            return false;
        } else {
            const queue = await getValidatedQueue(
                interaction,
                "No hay ninguna canción reproduciéndose en este momento",
            );
            if (!queue) return;

            const embed = new EmbedBuilder();

            // Si no hay más canciones en la cola
            if (queue.tracks.size === 0) {
                queue.node.stop();
                embed.setColor(Colors.Blue).setDescription("Se ha saltado la canción que se estaba reproduciendo");
                return await interaction.reply({ embeds: [embed] });
            }

            try {
                queue.node.skip();
                embed.setColor(Colors.Green).setDescription("✅ Canción skipeada con éxito");
            } catch (error) {
                console.log(error);
                embed.setColor(Colors.Red).setDescription("Error al intentar skipear la canción");
            }

            return await interaction.reply({ embeds: [embed] });
        }
    },
};
