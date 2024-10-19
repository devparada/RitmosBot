const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Para la canción actual"),

    run: async ({ interaction }) => {
        const { member, client } = interaction;

        const voiceChannel = member.voice.channel;
        const embed = new EmbedBuilder();

        const queue = client.distube.getQueue(voiceChannel);
        await queue.stop(voiceChannel);

        embed.setColor("Green").setDescription("Canción parada con éxito");
        await interaction.followUp({ embeds: [embed] });
    }
}
