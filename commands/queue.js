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

            if (!queue || !queue.tracks.size) {
                embed.setColor("Red").setDescription("No hay ninguna canción en la lista");
                return await interaction.reply({ embeds: [embed] });
            } else {
                    embed.setColor("Blue")
                    .setTitle("💿 **Lista de Canciones en la Cola** 💿")
                    .setDescription(`${queue.tracks.map((song, id) =>
                        `🎶 **${id + 1}.** ${song.title} - \`${song.duration}\``).join("\n")}`)
                    .setFooter({ text: `Total de canciones: ${queue.tracks.size}`});
                    return await interaction.reply({ embeds: [embed] });
                }
            }
        }
    }
