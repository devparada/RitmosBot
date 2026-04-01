import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import type { ExtendedClient } from "@/types/discord";
import { usuarioEnVoiceChannel } from "@/utils/voiceUtils";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("Controla el modo de repetición")
        .addStringOption((option) =>
            option
                .setName("modo")
                .setDescription("Elige el modo de repetición")
                .setRequired(true)
                .addChoices(
                    { name: "activado (Cola)", value: "queue" },
                    { name: "canción actual", value: "track" },
                    { name: "desactivado", value: "off" },
                ),
        ),

    run: async ({ client, interaction }: { client: ExtendedClient; interaction: ChatInputCommandInteraction }) => {
        if (!(await usuarioEnVoiceChannel(interaction))) {
            return false;
        }

        if (interaction.guildId) {
            const player = client.lavalink.getPlayer(interaction.guildId);

            if (!player?.connected || !player.playing) {
                return await interaction.reply({
                    content: "❌ No hay ninguna canción reproduciéndose actualmente",
                    ephemeral: true,
                });
            }

            const opcion = interaction.options.getString("modo") as "off" | "track" | "queue";
            let response: string = "";

            await player.setRepeatMode(opcion);

            switch (opcion) {
                case "queue":
                    response = "🔁 Repetición de la cola activada";
                    break;

                case "track":
                    response = "🔁 Repetición de la cola activada";
                    break;

                case "off":
                    response = "⏹️ Repetición desactivada";
                    break;
            }

            return await interaction.editReply({ content: response });
        }
    },
};
