import { type ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { ExtendedClient } from "@/types/discord";
import { usuarioEnVoiceChannel } from "@/utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder().setName("stop").setDescription("Para la canción actual"),

    run: async ({ client, interaction }: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const embed = new EmbedBuilder();
        const guildId = interaction.guildId;

        if (!guildId) return;

        if (!(await usuarioEnVoiceChannel(interaction))) {
            return false;
        }

        const player = client.lavalink.getPlayer(guildId);

        if (!player) {
            embed.setColor(Colors.Red).setDescription("No hay ninguna canción reproduciéndose en este momento");
            return await interaction.editReply({ embeds: [embed] });
        }

        try {
            player.setLoop("none");
            player.queue.clear();
            player.destroy();

            embed.setColor(Colors.Green).setDescription("✅ Canción parada con éxito");
        } catch (error) {
            console.log(error);
            embed.setColor(Colors.Red).setDescription("Error al intentar parar la canción");
        }

        return await interaction.editReply({ embeds: [embed] });
    },
};
