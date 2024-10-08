const { EmbedBuilder, SlashCommandBuilder, VoiceChannel } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("play songs from Youtube")
        .addSubcommand(subcommand =>
            subcommand
                .setName("song")
                .setDescription("Loads a single song from a url")
                .addStringOption(option => option.setName("url").setDescription("the song url").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("playlist")
                .setDescription("Loads a playlist of songs from a url")
                .addStringOption(option => option.setName("url").setDescription("the playlist url").setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("search")
                .setDescription("Searching for song based on provided keywords")
                .addStringOption(option => option.setName("searchterms").setDescription("the search keywords").setRequired(true)
                )
        ),

    run: async ({ interaction }) => {

        const { options, member } = interaction;

        const subcommand = options.getSubcommand();
        const query = options.getString("url");
        const voiceChannel = member.voice.channel;
        const embed = new EmbedBuilder();

        if (!VoiceChannel) {
            embed.setColor("Red").setDescription("You must be connect to voice channel.");
            return interaction.followUp({ embeds: [embed] });
        } else {
            try {
                switch (subcommand) {
                    case "song":
                        // Verifica si el usuario está en un canal de voz
                        if (!voiceChannel) {
                            return interaction.followUp("¡Debes estar en un canal de voz para reproducir música!");
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
                        break;
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