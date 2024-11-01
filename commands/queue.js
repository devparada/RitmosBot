const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Muestra la lista de canciones puesta"),

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

            if (!queue || !queue.tracks.size) {
                embed.setColor("Red").setDescription("No hay ninguna canción en la lista");
                return await interaction.reply({ embeds: [embed] });
            } else {
                try {
                    const cancionesLimite = 20;
                    const tracksArray = queue.tracks.data;
                    let canciones = [];

                    for (let i = 0; i < tracksArray.length; i += cancionesLimite) {
                        const cola = tracksArray.slice(i, i + cancionesLimite).map((song, id) =>
                            `🎶 **${i + id + 1}.** ${song.title} - \`${song.duration}\``).join("\n");
                        canciones.push(cola);
                    }

                    for (const cola of canciones) {
                        return await interaction.followUp({
                            embeds: [embed
                                .setColor("Blue")
                                .setTitle("💿 **Lista de Canciones en la Cola** 💿")
                                .setDescription(cola)
                                .setFooter({ text: `Total de canciones: ${queue.tracks.size}` })
                            ]
                        });
                    }
                } catch (error) {
                    console.log("Error al mostrar la cola de canciones:", error);
                    embed.setColor("Red").setDescription("Hubo un error al intentar mostrar la cola de canciones");
                    await interaction.followUp({ embeds: [embed] });
                }
            }
        }
    }
}
