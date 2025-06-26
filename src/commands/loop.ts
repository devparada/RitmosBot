import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { useMainPlayer } from "discord-player";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("Controla el modo de repetición")
        .addStringOption((option) =>
            option
                .setName("modo")
                .setDescription("Elige el modo de repetición")
                .setRequired(true)
                .addChoices({ name: "activado", value: "on" }, { name: "desactivado", value: "off" }),
        ),

    run: async ({ interaction }: { interaction: ChatInputCommandInteraction }) => {
        const player = useMainPlayer();
        if (interaction.guild != null) {
            const queue = player.nodes.get(interaction.guild.id);

            if (!queue || !queue.isPlaying()) {
                return await interaction.reply({
                    content: "No hay ninguna canción reproduciéndose actualmente",
                    ephemeral: true,
                });
            }

            const opcion = interaction.options.getString("modo");
            let response;

            switch (opcion) {
                case "on":
                    queue.setRepeatMode(2);
                    response = "🔁 Repetición de la cola activada";
                    break;

                case "off":
                    queue.setRepeatMode(0);
                    response = "⏹️ Repetición desactivada";
                    break;
            }

            return await interaction.reply({ content: response });
        }
    },
};
