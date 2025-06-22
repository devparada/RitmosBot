const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder().setName("stop").setDescription("Para la canción actual"),

    run: async ({ interaction }) => {
        const { member } = interaction;
        const voiceChannel = member.voice.channel;
        const embed = new EmbedBuilder();

        if (!voiceChannel) {
            embed.setColor("Red").setDescription("¡Debes estar en el canal de voz para usar este comando!");
            return interaction.reply({ embeds: [embed] });
        } else {
            const player = useMainPlayer();
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
