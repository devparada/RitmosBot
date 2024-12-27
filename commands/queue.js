const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Muestra la cola de canciones actual"),

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
            await interaction.deferReply();

            if (!queue || !queue.currentTrack) {
                embed.setColor("Red").setDescription("No hay ninguna canción en la cola o reproduciendose");
                return await interaction.followUp({ embeds: [embed] });
            } else {
                try {
                    const cancionesLimite = 20;
                    const tracksArray = queue.tracks.data;
                    var totalCanciones = queue.tracks.size;
                    var description = "";

                    if (totalCanciones >= 1) {
                        description = tracksArray.slice(0, cancionesLimite).map((song, id) =>
                            `🎶 **${id + 1}.** ${song.title} - \`${song.duration}\``).join("\n");
                        totalCanciones = totalCanciones + 1;
                    } else {
                        description = "No hay canciones en la cola";
                    }

                    const currentTrack = queue.currentTrack;

                    return await interaction.followUp({
                        embeds: [embed
                            .setColor("Blue")
                            .setDescription(`💿 **Está reproduciéndose 💿**\n${currentTrack.title} - ${currentTrack.duration}\n\n **Cola** \n` + description)
                            .setThumbnail(currentTrack.thumbnail)
                            .setFooter({ text: `Total de canciones: ${totalCanciones}` }),
                        ],
                    });
                } catch (error) {
                    console.log("Error al mostrar la cola de canciones:", error);
                    embed.setColor("Red").setDescription("Error al intentar mostrar la cola de canciones");
                    await interaction.followUp({ embeds: [embed] });
                }
            }
        }
    },
};
