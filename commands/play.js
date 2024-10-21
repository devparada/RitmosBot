const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce una canción o playlist de Youtube")
        .addStringOption(option => option.setName("url").setDescription("the song url").setRequired(true)),

    run: async ({ interaction }) => {
        const { options, member } = interaction;

        const query = options.getString("url");
        const voiceChannel = member.voice.channel;
        const embed = new EmbedBuilder();

        // Verifica si el usuario está en un canal de voz
        if (!voiceChannel) {
            embed.setColor("Red").setDescription("¡Debes estar en un canal de voz para reproducir música!");
            return interaction.followUp({ embeds: [embed] });
        } else {
            try {
                await interaction.client.distube.play(voiceChannel, query, {
                    member: interaction.member, // Miembro que ejecuta el comando
                    textChannel: interaction.channel, // Canal de texto donde se envían mensajes
                });
            } catch (error) {
                // Depuración
                console.error(error);
                embed.setColor("Red").setDescription("Hubo un error al intentar reproducir la canción");
                await interaction.followUp({ embeds: [embed] });
            }
        }
    }
}
