const playCommand = require("@/commands/play");
const { Colors } = require("discord.js");

const PLAY_TEST = {
    GUILD_ID: "test-guild-id",
    VOICE_CHANNEL_ID: "test-voice-channel-id",
    TEXT_CHANNEL_ID: "test-text-channel-id",
    SONG_URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    SONG_TITLE: "Never Gonna Give You Up",
    AUTHOR: "Rick Astley",
};

describe("/play command", () => {
    let clientMock;
    let playerMock;
    let nodeMock;
    let interaction;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock del Player de Lavalink
        playerMock = {
            connected: true,
            playing: false,
            paused: false,
            connect: jest.fn().mockResolvedValue({}),
            play: jest.fn().mockResolvedValue({}),
            queue: {
                tracks: [],
                add: jest.fn(),
            },
        };

        // Mock del Nodo de Lavalink
        nodeMock = {
            connected: true,
            search: jest.fn().mockResolvedValue({
                tracks: [
                    {
                        info: {
                            title: PLAY_TEST.SONG_TITLE,
                            uri: PLAY_TEST.SONG_URL,
                            author: PLAY_TEST.AUTHOR,
                        },
                    },
                ],
            }),
        };

        // Mock del Cliente extendido
        clientMock = {
            lavalink: {
                nodeManager: {
                    leastUsedNodes: jest.fn().mockReturnValue([nodeMock]),
                },
                getPlayer: jest.fn().mockReturnValue(null),
                createPlayer: jest.fn().mockReturnValue(playerMock),
            },
        };

        // Mock de la Interacción de Discord
        interaction = {
            guildId: PLAY_TEST.GUILD_ID,
            channelId: PLAY_TEST.TEXT_CHANNEL_ID,
            user: { id: "user-id" },
            member: {
                voice: {
                    channel: { id: PLAY_TEST.VOICE_CHANNEL_ID },
                },
            },
            options: {
                getString: jest.fn().mockReturnValue(PLAY_TEST.SONG_URL),
                getAttachment: jest.fn().mockReturnValue(null),
            },
            editReply: jest.fn().mockResolvedValue({}),
        };
    });

    test("Envia el mensaje de error si el usuario no tiene canal de voz", async () => {
        interaction.member.voice.channel = null;

        await playCommand.run({ client: clientMock, interaction });

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Red,
                            description: "¡Debes estar en un canal de voz para reproducir música!",
                        }),
                    }),
                ],
            }),
        );
    });

    test("Envia el mensaje de error si no hay URL ni archivo adjunto", async () => {
        // Simulamos que no se envió nada
        interaction.options.getString = jest.fn().mockReturnValue(null);
        interaction.options.getAttachment = jest.fn().mockReturnValue(null);

        await playCommand.run({ client: clientMock, interaction });

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            description: expect.stringContaining("Debes proporcionar una URL o un archivo."),
                        }),
                    }),
                ],
            }),
        );
    });

    test("Envía mensaje de error si el nodo de Lavalink no está disponible", async () => {
        nodeMock.connected = false;

        await playCommand.run({ client: clientMock, interaction });

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Red,
                            description: expect.stringContaining(
                                "¡El servidor de música (Lavalink) se está reiniciando!",
                            ),
                        }),
                    }),
                ],
            }),
        );
    });

    test("Maneja correctamente cuando no se encuentra la canción en la búsqueda", async () => {
        nodeMock.search.mockResolvedValueOnce({ tracks: [] }); // Sin resultados

        await playCommand.run({ client: clientMock, interaction });

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Red,
                            description: "No se encontraron resultados.",
                        }),
                    }),
                ],
            }),
        );
    });

    test("Reproduce música directamente cuando la cola está vacía", async () => {
        playerMock.connected = false;

        await playCommand.run({ client: clientMock, interaction });

        expect(playerMock.connect).toHaveBeenCalled();
        expect(nodeMock.search).toHaveBeenCalledWith(PLAY_TEST.SONG_URL, interaction.user);
        expect(playerMock.play).toHaveBeenCalledWith({ track: expect.any(Object) });
        expect(playerMock.queue.add).not.toHaveBeenCalled();

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Green,
                            title: PLAY_TEST.SONG_TITLE,
                        }),
                    }),
                ],
            }),
        );
    });

    test("Añade la canción a la cola si ya hay música sonando", async () => {
        playerMock.playing = true;
        playerMock.queue.tracks = [{ info: { title: "Otra canción" } }];

        await playCommand.run({ client: clientMock, interaction });

        expect(playerMock.queue.add).toHaveBeenCalledWith(expect.any(Object));
        expect(playerMock.play).not.toHaveBeenCalled();

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Blue,
                            title: PLAY_TEST.SONG_TITLE,
                        }),
                    }),
                ],
            }),
        );
    });
});
