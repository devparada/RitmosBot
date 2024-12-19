const { useMainPlayer } = require("discord-player");
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI;

const mongo = new MongoClient(MONGO_URI);
const db = mongo.db("ritmosbot");
const coleccion = db.collection("playlists");

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
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        )
        .addSubcommand(sub =>
            sub.setName("remove")
                .setDescription("Elimina una playlist")
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("Nombre de la playlist")
                        .setRequired(true)
                        .setAutocomplete(true),
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
                        .setRequired(true)
                        .setAutocomplete(true),
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
                        .setRequired(true)
                        .setAutocomplete(true),
                )
                .addStringOption(option =>
                    option.setName("name")
                        .setDescription("nombre de la cancion")
                        .setRequired(true)
                        .setAutocomplete(true),
                ),
        ),

    async autocomplete(interaction) {
        await mongo.connect();
        try {
            const guildId = interaction.guildId;
            const playlists = await coleccion.find({ serverId: guildId }).toArray();
            const focusedValue = interaction.options.getFocused() || "";
            const { options } = interaction;

            switch (options.getSubcommand()) {
                case "remove":
                case "add": {
                    let filteredPlaylist = [];
                    let playlistList = [];

                    playlists.forEach((doc) => {
                        Object.keys(doc).forEach((playlistName) => {
                            if (playlistName !== "serverId" && playlistName !== "_id") {
                                // Añadimos las playlists al array
                                playlistList.push(playlistName);
                            }
                        });
                    });

                    // Filtramos las playlists que empiezan con el texto que el usuario está escribiendo
                    filteredPlaylist = playlistList.filter(playlistName =>
                        String(playlistName).toLowerCase().startsWith(focusedValue.toLowerCase()),
                    );

                    var playlistsRespuesta = filteredPlaylist.map(playlist => ({ name: playlist, value: playlist }));

                    if (playlistsRespuesta.length === 0 && focusedValue !== "") {
                        playlistsRespuesta.push({ name: "No hay playlists que empiecen por " + focusedValue.toLowerCase(), value: "none" });
                    } else if (filteredPlaylist.length === 0) {
                        playlistsRespuesta.push({ name: "No existen playlists en este servidor", value: "none" });
                    }

                    await interaction.respond(playlistsRespuesta);
                }
                    break;
            }
        } catch (error) {
            console.error(error);
        } finally {
            await mongo.close();
        }
        /*
        const guildId = interaction.guildId;
        const playlists = data[guildId] || {};
        const focusedValue = interaction.options.getFocused() || "";
        const { options } = interaction;

        switch (options.getSubcommand()) {
            case "delete": {
                switch (options.getFocused(true).name) {
                    case "playlist": {
                        const focusedValue = options.getFocused();
                        const filteredPlaylists = Object.keys(playlists)
                            .filter(name => {
                                const isEmpty = Object.keys(playlists[name]).length === 0; // Verifica si la playlist está vacía
                                return name.toLowerCase().startsWith(focusedValue.toLowerCase()) && !isEmpty;
                            })
                            .map(name => ({ name, value: name }));

                        if (filteredPlaylists.length === 0) {
                            filteredPlaylists.push({ name: "No hay playlists que empiecen por " + focusedValue.toLowerCase(), value: "none" });
                        }
                        await interaction.respond(filteredPlaylists);
                    }
                        break;
                    case "name": {
                        const focusedPlaylistName = options.getString("playlist");
                        const selectedPlaylist = playlists[focusedPlaylistName];

                        if (selectedPlaylist) {
                            const songs = Object.entries(selectedPlaylist);

                            // Genera las opciones para el autocompletado
                            const songOptions = songs.length > 0
                                ? songs.map(([title, url], index) => ({
                                    name: `${index + 1}. ${title}`,
                                    value: url,
                                }))
                                : [{ name: "No hay canciones en esta playlist", value: "none" }];
                            await interaction.respond(songOptions);
                        } else {
                            await interaction.respond([
                                { name: "No existe la playlist selecionada", value: "none" },
                            ]);
                        }
                        break;
                    }
                }
                break;
            }
            case "remove":
            case "add": {
                const filteredPlaylists = Object.keys(playlists)
                    .filter(name => {
                        return name.toLowerCase().startsWith(focusedValue.toLowerCase());
                    })
                    .map(name => ({ name, value: name }));

                if (filteredPlaylists.length === 0) {
                    filteredPlaylists.push({ name: "No hay playlists que empiecen por " + focusedValue.toLowerCase(), value: "none" });
                }

                await interaction.respond(filteredPlaylists);
            }
                break;
            case "play": {
                const filteredPlaylists = Object.keys(playlists)
                    .filter(name => {
                        const isEmpty = Object.keys(playlists[name]).length === 0; // Verifica si la playlist está vacía
                        return name.toLowerCase().startsWith(focusedValue.toLowerCase()) && !isEmpty;
                    })
                    .map(name => ({ name, value: name }));

                if (filteredPlaylists.length === 0) {
                    filteredPlaylists.push({ name: "No hay playlists que empiecen por " + focusedValue.toLowerCase(), value: "none" });
                }

                await interaction.respond(filteredPlaylists);
            }
                break;
        }*/
    },


    run: async ({ interaction }) => {
        const { options, guildId } = interaction;
        const embed = new EmbedBuilder();
        const player = useMainPlayer();

        switch (options.getSubcommand()) {
            case "create":
                try {
                    let arrayCrear = await crearPlaylist(guildId, options.getString("name"));
                    embed.setColor(arrayCrear["color"])
                        .setDescription(arrayCrear["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
            case "list":
                try {
                    let arrayLista = await mostrarPlaylists(guildId);
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

                    let arrayAdd = await addCancionPlaylist(guildId, url, playlistName, tituloCancion);
                    embed.setColor(arrayAdd["color"])
                        .setDescription(arrayAdd["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
            case "play":
                try {
                    let arrayPlayCheck = await playCheckPlaylist(guildId, options.getString("name"));
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
                    let arrayRemove = await eliminarPlaylist(guildId, options.getString("name"));
                    embed.setColor(arrayRemove["color"])
                        .setDescription(arrayRemove["mensaje"]);
                    await interaction.reply({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                }
                break;
            case "delete":
                try {
                    let arrayDelete = await eliminarCancionPlaylist(guildId, options.getString("playlist"), options.getString("name"));
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
