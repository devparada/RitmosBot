import { type ChatInputCommandInteraction, Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { ExtendedClient } from "@/types/discord";
import { usuarioEnVoiceChannel } from "@/utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder().setName("leave").setDescription("Desconecta el bot del chat de voz"),

    run: async ({ client, interaction }: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        const embed = new EmbedBuilder();

        // Verifica si el usuario está en un canal de voz
        if (!usuarioEnVoiceChannel) {
            return false;
        }

        if (interaction.guildId) {
            const player = client.lavalink.getPlayer(interaction.guildId);

            if (!player) {
                embed.setColor(Colors.Red).setDescription("❌ No estoy conectado a ningún canal de voz.");
            } else {
                await player.destroy();

                embed.setColor(Colors.Green).setDescription("✅ Me he desconectado del canal de voz.");
            }
        }

        return interaction.editReply({ embeds: [embed] });
    },
};
