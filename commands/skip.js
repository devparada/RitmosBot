const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Salta la canción actual"),

    run: async ({ interaction }) => {
        const { member, client } = interaction;

        const voiceChannel = member.voice.channel;
        const embed = new EmbedBuilder();

        if (!voiceChannel) {
            embed.setColor("Red").setDescription("¡Debes estar en el canal de voz para usar este comando!");
            return interaction.followUp({ embeds: [embed] });
        } else {
            const queue = client.distube.getQueue(voiceChannel);
            console.log(queue);
            if (!queue || !queue.songs.length) {
                embed.setColor("Red").setDescription("No hay ninguna canción reproduciéndose en este momento");
                return await interaction.followUp({ embeds: [embed] });
            } else if (queue.songs.length == 1) {
                await queue.stop(voiceChannel);
                embed.setColor("Red").setDescription("Sea saltado la unica canción puesta");
                return await interaction.followUp({ embeds: [embed] });
            } else {
                try {
                    await queue.skip(voiceChannel);
                } catch (error) {
                    embed.setColor("Red").setDescription("Hubo un error al intentar skipear la canción");
                    await interaction.followUp({ embeds: [embed] });
                }

                embed.setColor("Green").setDescription("✅ Canción skipeada con éxito");
                return await interaction.followUp({ embeds: [embed] });
            }
        }
    }
}
