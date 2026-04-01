import { type ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { ExtendedClient } from "@/types/discord";
import { usuarioEnVoiceChannel } from "@/utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder().setName("skip").setDescription("Salta la canción actual"),

    run: async ({ client, interaction }: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const embed = new EmbedBuilder();

        if (!(await usuarioEnVoiceChannel(interaction))) {
            return false;
        }

        if (interaction.guildId) {
            const player = client.lavalink.getPlayer(interaction.guildId);

            if (!player?.connected) {
                embed.setColor(Colors.Red).setDescription("❌ No hay ninguna canción reproduciéndose en este momento");
                return await interaction.reply({ embeds: [embed] });
            }

            try {
                await player.skip();
                embed.setColor(Colors.Green).setDescription("✅ Canción skipeada con éxito");
            } catch (error) {
                console.log(error);
                embed.setColor(Colors.Red).setDescription("❌ Hubo un error al intentar saltar la canción.");
            }

            return await interaction.editReply({ embeds: [embed] });
        }
    },
};
