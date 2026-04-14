import { type ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { ExtendedClient } from "@/types/discord";
import { usuarioEnVoiceChannel } from "@/utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder().setName("shuffle").setDescription("Mezcla las canciones de la cola actual"),

    run: async ({ client, interaction }: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const embed = new EmbedBuilder();

        if (!(await usuarioEnVoiceChannel(interaction))) {
            return false;
        }

        if (interaction.guildId) {
            const player = client.lavalink.getPlayer(interaction.guildId);

            if (!player || player.queue.length <= 1) {
                embed.setColor(Colors.Red).setDescription("❌ No hay más canciones en la cola");
                return interaction.editReply({ embeds: [embed] });
            }

            try {
                player.queue.shuffle();

                embed.setColor(Colors.Blue).setDescription("¡La cola ha sido mezclada!");
            } catch (error) {
                console.error("Error al mezclar la cola:", error);
                embed.setColor(Colors.Red).setDescription("❌ Hubo un error al mezclar la cola");
                return interaction.editReply({ embeds: [embed] });
            }

            return await interaction.editReply({ embeds: [embed] });
        }
    },
};
