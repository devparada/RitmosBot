import { type ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getValidatedQueue, usuarioEnVoiceChannel } from "@/utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder().setName("shuffle").setDescription("Mezcla las canciones de la cola actual"),

    run: async ({ interaction }: { interaction: ChatInputCommandInteraction }) => {
        const embed = new EmbedBuilder();

        if (!(await usuarioEnVoiceChannel(interaction))) {
            return false;
        } else {
            const queue = await getValidatedQueue(interaction, "No hay ninguna canción en la cola");
            if (!queue) return;

            if (!queue.tracks.size) {
                embed.setColor(Colors.Red).setDescription("No hay más canciones en la cola");
                return await interaction.reply({ embeds: [embed] });
            }

            queue.tracks.shuffle();
            embed.setColor(Colors.Blue).setDescription("¡La cola ha sido mezclada!");
            return await interaction.reply({ embeds: [embed] });
        }
    },
};
