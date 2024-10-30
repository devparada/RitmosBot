const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require('discord-player');

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
            return interaction.reply({ embeds: [embed] });
        } else {
            const player = useMainPlayer();
            await interaction.deferReply();
            try {
                // Crea una cola si no existe y la conecta al canal de voz
                // queue y song sí que se utilizan en el index.js
                const queue = player.nodes.create(interaction.guild, {
                    metadata: {
                        channel: interaction.channel,
                    },
                });

                // Reproduce la canción
                const song = await player.play(voiceChannel, query, {
                    channel: interaction.channel,
                });

                // Manda el mensaje cuándo aparece lo de está pensando
                embed.setColor("Green").setDescription(`💿 Añadido a la cola: ${song.track.title}`);
                await interaction.followUp({ embeds: [embed] });

            } catch (error) {
                embed.setColor("Red").setDescription("Hubo un error al intentar reproducir la canción");
                await interaction.followUp({ embeds: [embed] });
            }
        }
    }
}
