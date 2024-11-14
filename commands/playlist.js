const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require('discord-player');
const { crearPlaylist, mostrarPlaylists, addCancionPlaylist } = require("../utils/playlistController.js");

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
        )
        .addSubcommand(subcommands =>
            subcommands
                .setName('add')
                .setDescription('Añade la url a la playlist')
                .addStringOption(option =>
                    option.setName("playlist")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("url")
                        .setDescription("Url de la cancion")
                        .setRequired(true)
                )
        ),

    run: async ({ interaction }) => {
        const { options, guildId } = interaction;
        const embed = new EmbedBuilder();
        const player = useMainPlayer();

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
            case "add":
                try {
                    const playlistName = options.getString("playlist");
                    const url = options.getString("url");
                    const result = await player.search(url, {
                        requestedBy: interaction.user
                    });
                    const track = result.tracks[0];
                    var tituloCancion;

                    if (track && track.title) {
                        tituloCancion = track.title;
                    } else {
                        tituloCancion = "Título no encontrado";
                    }

                    embed.setColor("Blue")
                        .setDescription(addCancionPlaylist(guildId, url, playlistName, tituloCancion));
                    return await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
        }
    }
}
