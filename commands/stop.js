const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Para la canción actual"),

    run: async ({ interaction }) => {
        const { member, client } = interaction;

        const voiceChannel = member.voice.channel;
        const embed = new EmbedBuilder();

        if (!voiceChannel) {
            embed.setColor("Red").setDescription("¡Debes estar en el canal de voz para usar este comando!");
            return interaction.followUp({ embeds: [embed] });
        } else {
            const queue = client.distube.getQueue(voiceChannel);
            if (!queue || !queue.songs.length) {
                embed.setColor("Red").setDescription("No hay ninguna canción reproduciéndose en este momento");
                return await interaction.followUp({ embeds: [embed] });
            } else {
                try {
                    await queue.stop(voiceChannel);
                } catch (error) {
                    embed.setColor("Red").setDescription("Hubo un error al intentar parar la canción");
                    await interaction.followUp({ embeds: [embed] });
                }

                embed.setColor("Green").setDescription("✅ Canción parada con éxito");
                await interaction.followUp({ embeds: [embed] });
            }
        }
    }
}
