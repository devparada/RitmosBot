const { EmbedBuilder, SlashCommandBuilder, VoiceChannel } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play single song from Youtube")
        .addStringOption(option => option.setName("url").setDescription("the song url").setRequired(true)),

    run: async ({ interaction }) => {

        const { options, member } = interaction;

        const query = options.getString("url");
        const voiceChannel = member.voice.channel;
        const embed = new EmbedBuilder();

        if (!VoiceChannel) {
            embed.setColor("Red").setDescription("You must be connect to voice channel.");
            return interaction.followUp({ embeds: [embed] });
        } else {
            try {
                // Verifica si el usuario está en un canal de voz
                if (!voiceChannel) {
                    embed.setColor("Red").setDescription("¡Debes estar en un canal de voz para reproducir música!");
                    return interaction.followUp({ embeds: [embed] });
                }

                try {
                    await interaction.client.distube.play(voiceChannel, query, {
                        member: interaction.member, // Miembro que ejecuta el comando
                        textChannel: interaction.channel, // Canal de texto donde se envían mensajes
                    });

                    await interaction.followUp(`🎶 ¡Reproduciendo en ${voiceChannel.name}!`);
                } catch (error) {
                    console.error(error);
                    await interaction.followUp("Hubo un error al intentar reproducir la canción.");
                }
            }
            catch (error) {
                console.log(error);
                embed.setColor("Red").setDescription("Something wrong");

                return interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        }
    }
}