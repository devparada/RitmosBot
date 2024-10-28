const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Muestra la lista de canciones puesta"),

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
                embed.setColor("Red").setDescription("No hay ninguna canción en la lista");
                return await interaction.followUp({ embeds: [embed] });
            } else {
                    embed.setColor("Blue")
                    .setTitle("🎶 **Lista de Canciones en la Cola**")
                    .setDescription(`${queue.songs.map((song, id) =>
                        `🎶 **${id + 1}.** ${song.name} - \`${song.formattedDuration}\``).join("\n")}`)
                    .setFooter({ text: `Total de canciones: ${queue.songs.length}`});
                    return await interaction.followUp({ embeds: [embed] });
                }
            }
        }
    }
