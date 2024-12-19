const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer, Player } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce una canción o playlist")
        .addStringOption(option =>
            option.setName("url")
                .setDescription("the song url")
                .setRequired(true)
                .setAutocomplete(true),
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused() || "";
        const player = new Player(interaction.client);

        if (focusedValue === "") {
            await interaction.respond([{ name: "Introduce una url o texto para comenzar a buscar", value: "none" }]);
        } else {
            try {
                const searchResult = await player.search(focusedValue, { requestedBy: interaction.user });

                if (searchResult.tracks.length > 0) {
                    const songTitle = searchResult.tracks[0].title;
                    await interaction.respond([{ name: songTitle, value: focusedValue }]);
                } else {
                    await interaction.respond([{ name: "No se pudo encontrar la canción", value: "none" }]);
                }
            } catch (error) {
                console.log("Error al buscar la canción: " + error);
                await interaction.respond([{ name: "Hubo un error al buscar la canción", value: "none" }]);
            }
        }
    },

    run: async ({ interaction }) => {
        const { options, member } = interaction;
        const query = options.getString("url");
        const voiceChannel = member.voice.channel;
        const embed = new EmbedBuilder();

        // Verifica si el usuario está en un canal de voz
        if (!voiceChannel) {
            embed.setColor("Red").setDescription("¡Debes estar en un canal de voz para reproducir música!");
            return interaction.reply({ embeds: [embed] });
        } else {
            const player = useMainPlayer();
            await interaction.deferReply();
            try {
                // Verifica si ya existe una cola
                const queue = player.nodes.get(interaction.guild.id) || player.nodes.create(interaction.guild, {
                    metadata: {
                        channel: interaction.channel,
                    },
                    // Ensordece al bot
                    selfDeaf: true,
                    leaveOnEmpty: false,
                    leaveOnEnd: false,
                    leaveOnStop: false,
                    ytdlOptions: {
                        filter: "audioonly",
                        quality: "medium",
                        highWaterMark: 1 << 24, // 16 MB de buffer
                        dlChunkSize: 128 * 1024, // 128 KB para un mejor balance entre fragmentos y memoria
                        requestOptions: { // Emula un navegador para evitar bloqueos
                            headers: {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
                                "Accept-Language": "en-US,en;q=0.9", // Idioma preferido
                                "Connection": "keep-alive", // Mantener la conexión para mejorar velocidad
                            },
                        },
                    },
                    filters: {
                        bassboost: false,
                        karaoke: false,
                        nightcore: false,
                        phaser: false,
                        tremolo: false,
                        vibrato: false,
                    },
                });

                // Conecta la cola si no está conectada
                if (!queue.connection) {
                    await queue.connect(voiceChannel);
                }

                try {
                    // Reproduce la canción
                    const song = await player.play(voiceChannel, query, {
                        channel: interaction.channel,
                    });

                    // Manda el mensaje cuándo aparece lo de está pensando
                    embed.setColor("Green").setDescription(`💿 Añadido a la cola: ${song.track.title}`);
                    await interaction.followUp({ embeds: [embed] });
                } catch (error) {
                    console.log(error);
                    // Manda el mensaje cuándo aparece lo de está pensando
                    embed.setColor("Red").setDescription("La canción o playlist no existe");
                    await interaction.followUp({ embeds: [embed] });
                }
            } catch (error) {
                console.log(error);
                embed.setColor("Red").setDescription("Error al intentar reproducir la canción");
                await interaction.followUp({ embeds: [embed] });
            }
        }
    },
};
