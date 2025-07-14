import { EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { useMainPlayer } from "discord-player";

module.exports = {
    data: new SlashCommandBuilder().setName("shuffle").setDescription("Mezcla las canciones de la cola actual"),

    run: async ({ interaction }: { interaction: ChatInputCommandInteraction }) => {
        const { member } = interaction;

        if (member instanceof GuildMember) {
            const voiceChannel = member.voice.channel;
            const embed = new EmbedBuilder();

            if (!voiceChannel) {
                embed.setColor("Red").setDescription("¡Debes estar en el canal de voz para usar este comando!");
                return interaction.reply({ embeds: [embed] });
            } else {
                const player = useMainPlayer();
                const queue = player.nodes.get(interaction.guild!.id);

                if (!queue) {
                    embed.setColor("Red").setDescription("No hay ninguna canción en la cola");
                    return await interaction.reply({ embeds: [embed] });
                } else if (!queue.tracks.size) {
                    embed.setColor("Red").setDescription("No hay más canciones en la cola");
                    return await interaction.reply({ embeds: [embed] });
                } else {
                    queue.tracks.shuffle();
                    embed.setColor("Blue").setDescription("¡La cola ha sido mezclada!");
                    return await interaction.reply({ embeds: [embed] });
                }
            }
        }
    },
};
