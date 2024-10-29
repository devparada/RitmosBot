const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Para la canción actual"),

    run: async ({ interaction }) => {
        const player = useMainPlayer();
        const { member } = interaction;
        const voiceChannel = member.voice.channel;
        const embed = new EmbedBuilder();

        if (!voiceChannel) {
            embed.setColor("Red").setDescription("¡Debes estar en el canal de voz para usar este comando!");
            return interaction.followUp({ embeds: [embed] });
        } else {
            const queue = player.nodes.get(interaction.guild.id)

            if (!queue) {
                embed.setColor("Red").setDescription("No hay ninguna canción reproduciéndose en este momento");
                return await interaction.followUp({ embeds: [embed] });
            } else {
                try {
                    queue.node.stop(false);
                } catch (error) {
                    console.log(error);
                    embed.setColor("Red").setDescription("Hubo un error al intentar parar la canción");
                    return await interaction.followUp({ embeds: [embed] });
                }

                embed.setColor("Green").setDescription("✅ Canción parada con éxito");
                await interaction.followUp({ embeds: [embed] });
            }
        }
    }
}
