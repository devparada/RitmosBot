const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Salta la canción actual"),

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

            if (!queue) {
                embed.setColor("Red").setDescription("No hay ninguna canción reproduciéndose en este momento");
                return await interaction.reply({ embeds: [embed] });
            } else if (queue.tracks.data.length === 0) {
                queue.node.stop();
                embed.setColor("Yellow").setDescription("Se ha saltado la única canción puesta");
                return await interaction.reply({ embeds: [embed] });
            } else {
                try {
                    queue.node.skip();
                } catch (error) {
                    console.log(error);
                    embed.setColor("Red").setDescription("Error al intentar skipear la canción");
                    return await interaction.reply({ embeds: [embed] });
                }

                embed.setColor("Green").setDescription("✅ Canción skipeada con éxito");
                return await interaction.reply({ embeds: [embed] });
            }
        }
    },
};
