const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { crearPlaylist } = require("../utils/playlistController.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playlist")
        .setDescription("Crea, edita, y elimina las playlist")
        .addSubcommand(subcommands =>
            subcommands
                .setName('create')
                .setDescription('Crea una playlist')
        ),

    run: async ({ interaction }) => {
        const { guildId } = interaction;

        try {
            return await interaction.reply(crearPlaylist(guildId, "Test"));
        } catch (error) {
            console.log(error);
        }
    }
}
