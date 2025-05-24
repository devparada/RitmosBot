const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { useMainPlayer } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce una canción o playlist")
        .addStringOption((option) =>
            option.setName("url").setDescription("Introduce una URL o texto").setRequired(true).setAutocomplete(false),
        )
        .addAttachmentOption((option) =>
            option.setName("file").setDescription("Sube un archivo de audio o video").setRequired(false),
        ),

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
                const queue =
                    player.nodes.get(interaction.guild.id) ||
                    player.nodes.create(interaction.guild, {
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
                            highWaterMark: 64 * 1024 * 1024,
                            dlChunkSize: 0, // Tamaño automático para que ytdl lo administre
                            requestOptions: {
                                // Emula un navegador para evitar bloqueos
                                headers: {
                                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                                    Connection: "keep-alive",
                                    "Accept-Language": "en-US,en;q=0.9",
                                    "Accept-Encoding": "gzip, deflate, br",
                                    "Upgrade-Insecure-Requests": "1",
                                    "Sec-Fetch-Site": "none",
                                    "Sec-Fetch-Mode": "navigate",
                                    "Sec-Fetch-User": "?1",
                                    "Sec-Fetch-Dest": "document",
                                    "User-Agent":
                                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
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
                        queueMaxListeners: 50,
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
                    embed.setColor("Green").setDescription(`💿 Añadido a la cola: ${song.track.title} 💿`);
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
