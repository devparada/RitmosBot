const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { crearPlaylist, mostrarPlaylists } = require("../utils/playlistController.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playlist")
        .setDescription("Crea, edita, y elimina las playlist")
        .addSubcommand(subcommands =>
            subcommands
                .setName('create')
                .setDescription('Crea una playlist')
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommands =>
            subcommands
                .setName('list')
                .setDescription('Muestra las playlists')
        ),

    run: async ({ interaction }) => {
        const { options, guildId } = interaction;
        const embed = new EmbedBuilder();

        switch (options.getSubcommand()) {
            case "create":
                try {
                    return await interaction.reply(crearPlaylist(guildId, options.getString("name")));
                } catch (error) {
                    console.log(error);
                }
                break;
            case "list":
                try {
                    embed.setColor("Blue")
                        .setTitle("🎶 Lista de Playlists 🎶")
                        .setDescription(mostrarPlaylists(guildId))
                    return await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
        }
    }
}
