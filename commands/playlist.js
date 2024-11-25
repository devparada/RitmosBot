const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require('discord-player');
const { crearPlaylist, eliminarPlaylist, playPlaylist, playCheckPlaylist, mostrarPlaylists, addCancionPlaylist } = require("../utils/playlistController.js");

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
                .setName('play')
                .setDescription('Reproduce una playlist')
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommands =>
            subcommands
                .setName('remove')
                .setDescription('Borra una playlist')
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
                .setDescription('Añade una canción a la playlist')
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
                    let arrayCrear = crearPlaylist(guildId, options.getString("name"));
                    embed.setColor(arrayCrear["color"])
                        .setDescription(arrayCrear["mensaje"])
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
            case "list":
                try {
                    let arrayLista = mostrarPlaylists(guildId);
                    embed.setColor(arrayLista["color"])
                        .setTitle("🎶 Lista de Playlists 🎶")
                        .setDescription(arrayLista["mensaje"])
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log("Error al mostrar las playlists:" + error);
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

                    if (track && track.title) {
                        var tituloCancion = track.title;
                    } else {
                        var tituloCancion = "Título no encontrado";
                    }

                    let arrayAdd = addCancionPlaylist(guildId, url, playlistName, tituloCancion);
                    embed.setColor(arrayAdd["color"])
                        .setDescription(arrayAdd["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
            case "play":
                try {
                    let arrayPlayCheck = playCheckPlaylist(guildId, options.getString("name"));
                    embed.setColor(arrayPlayCheck["color"])
                        .setDescription(arrayPlayCheck["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                    if (arrayPlayCheck["color"] === "Green") {
                        playPlaylist(guildId, options.getString("name"), interaction);
                    }
                } catch (error) {
                    console.log(error);
                }
                break;
            case "remove":
                try {
                    let arrayDelete = eliminarPlaylist(guildId, options.getString("name"));
                    embed.setColor(arrayDelete["color"])
                        .setDescription(arrayDelete["mensaje"])
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
        }
    }
}
