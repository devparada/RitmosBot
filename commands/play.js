const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce una canción o playlist de Youtube")
        .addStringOption(option => option.setName("url").setDescription("the song url").setRequired(true)),

    run: async ({ interaction }) => {
        const player = useMainPlayer();
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
                // Crea una cola si no existe y la conecta al canal de voz
                // queue y song sí que se utilizan en el index.js
                const queue = player.nodes.create(interaction.guild, {
                    metadata: {
                        channel: interaction.channel,
                    },
                });

                const song = await player.play(voiceChannel, query, {
                    channel: interaction.channel,
                });
            } catch (error) {
                embed.setColor("Red").setDescription("Hubo un error al intentar reproducir la canción");
                await interaction.followUp({ embeds: [embed] });
            }
        }
    }
}
