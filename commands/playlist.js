const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");
const { crearPlaylist, eliminarPlaylist, playPlaylist, playCheckPlaylist, mostrarPlaylists, addCancionPlaylist, eliminarCancionPlaylist } = require("../utils/playlistController.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("playlist")
        .setDescription("Gestiona playlists con opciones para crear, editar y eliminar")
        .addSubcommand(sub =>
            sub.setName("create")
                .setDescription("Crea una playlist")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true),
                ),
        )
        .addSubcommand(sub =>
            sub.setName("play")
                .setDescription("Reproduce una playlist")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true),
                ),
        )
        .addSubcommand(sub =>
            sub.setName("remove")
                .setDescription("Elimina una playlist")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true),
                ),
        )
        .addSubcommand(sub =>
            sub.setName("list")
                .setDescription("Muestra todas las playlists"),
        )
        .addSubcommand(sub =>
            sub.setName("add")
                .setDescription("Añade una canción a una playlist")
                .addStringOption(option =>
                    option.setName("playlist")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true),
                )
                .addStringOption(option =>
                    option.setName("url")
                        .setDescription("Url de la cancion")
                        .setRequired(true),
                ),
        )
        .addSubcommand(sub =>
            sub.setName("delete")
                .setDescription("Elimina una canción de una playlist")
                .addStringOption(option =>
                    option.setName("playlist")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true),
                )
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("nombre de la cancion")
                        .setRequired(true),
                ),
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
                        .setDescription(arrayCrear["mensaje"]);
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
                        .setDescription(arrayLista["mensaje"]);
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
                        requestedBy: interaction.user,
                    });
                    const track = result.tracks[0];

                    var tituloCancion;
                    if (track && track.title) {
                        tituloCancion = track.title;
                    } else {
                        tituloCancion = "Título no encontrado";
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
                    let arrayRemove = eliminarPlaylist(guildId, options.getString("name"));
                    embed.setColor(arrayRemove["color"])
                        .setDescription(arrayRemove["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
            case "delete":
                try {
                    let arrayDelete = eliminarCancionPlaylist(guildId, options.getString("playlist"), options.getString("name"));
                    embed.setColor(arrayDelete["color"])
                        .setDescription(arrayDelete["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
        }
    },
};
