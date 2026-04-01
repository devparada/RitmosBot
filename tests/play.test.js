// Mockeamos las utilidades
jest.mock("@/utils/voiceUtils", () => ({
    usuarioEnVoiceChannel: jest.fn(),
}));

const playCommand = require("@/commands/play");
const { Colors } = require("discord.js");
const { usuarioEnVoiceChannel } = require("@/utils/voiceUtils");
const { createVoiceInteraction } = require("@tests/mocks/discordMocks");

const PLAY_TEST = {
    SONG_URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    SONG_TITLE: "Never Gonna Give You Up",
    AUTHOR: "Rick Astley",
};

describe("/play command", () => {
    let clientMock;
    let interactionMock;
    let nodeMock;
    let playerMock;

    beforeEach(() => {
        jest.clearAllMocks();

        usuarioEnVoiceChannel.mockResolvedValue(true);

        // Mock del Nodo de Lavalink
        nodeMock = {
            connected: true,
            search: jest.fn().mockResolvedValue({
                tracks: [
                    {
                        info: {
                            title: PLAY_TEST.SONG_TITLE,
                            author: PLAY_TEST.AUTHOR,
                            artworkUrl: "http://example.com/image.jpg",
                        },
                    },
                ],
            }),
        };

        // Mock del Player de Lavalink
        playerMock = {
            connected: false,
            playing: false,
            connect: jest.fn().mockResolvedValue(true),
            play: jest.fn().mockResolvedValue(true),
            queue: {
                tracks: [],
                add: jest.fn(),
            },
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

        interactionMock = createVoiceInteraction({
            GUILD_ID: "123",
            SONG_URL: PLAY_TEST.SONG_URL,
        });
    });

    test("Debe detener la ejecución si el usuario no está en un canal de voz", async () => {
        // Forzamos que la validación de voz devuelva false
        usuarioEnVoiceChannel.mockResolvedValue(false);

        const result = await playCommand.run({ client: clientMock, interaction: interactionMock });

        // Verificamos que el comando retorne false (como indica tu código)
        expect(result).toBe(false);
        // Verificamos que NO se intentó buscar música ni crear un player
        expect(clientMock.lavalink.createPlayer).not.toHaveBeenCalled();
        expect(nodeMock.search).not.toHaveBeenCalled();
    });

    test("Debe reproducir una canción si no hay nada en la cola", async () => {
        await playCommand.run({ client: clientMock, interaction: interactionMock });

        expect(clientMock.lavalink.createPlayer).toHaveBeenCalled();
        expect(playerMock.play).toHaveBeenCalledWith(
            expect.objectContaining({
                track: expect.any(Object),
            }),
        );

        // Verificamos que el embed enviado tenga el título correcto
        expect(interactionMock.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            title: PLAY_TEST.SONG_TITLE,
                            color: Colors.Green,
                        }),
                    }),
                ],
            }),
        );
    });

    test("debe añadir a la cola si el player ya está reproduciendo", async () => {
        // Simulamos player existente y reproduciendo
        const existingPlayer = {
            playing: true,
            queue: { tracks: [{ title: "Canción 1" }], add: jest.fn() },
            connected: true,
        };

        clientMock.lavalink.getPlayer.mockReturnValue(existingPlayer);

        await playCommand.run({ client: clientMock, interaction: interactionMock });

        expect(existingPlayer.queue.add).toHaveBeenCalled();
        expect(interactionMock.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Blue,
                            footer: { text: "Posición en cola: #1" },
                        }),
                    }),
                ],
            }),
        );
    });

    test("Debe fallar si el nodo de Lavalink no está conectado", async () => {
        nodeMock.connected = false;

        await playCommand.run({ client: clientMock, interaction: interactionMock });

        expect(interactionMock.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Red,
                            description: expect.stringContaining("Lavalink) se está reiniciando"),
                        }),
                    }),
                ],
            }),
        );
    });

    test("Debe fallar si no se encuentran resultados", async () => {
        nodeMock.search.mockResolvedValue({ tracks: [] });

        await playCommand.run({ client: clientMock, interaction: interactionMock });

        expect(interactionMock.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            description: "No se encontraron resultados.",
                        }),
                    }),
                ],
            }),
        );
    });

    test("Debe manejar archivos adjuntos correctamente", async () => {
        const fileUrl = "https://cdn.discordapp.com/attachments/123/456/audio.mp3";
        interactionMock.options.getAttachment.mockReturnValue({ url: fileUrl });

        await playCommand.run({ client: clientMock, interaction: interactionMock });

        // Verificamos que la búsqueda se haga con la URL del archivo y no con el string de SONG_URL
        expect(nodeMock.search).toHaveBeenCalledWith(fileUrl, interactionMock.user);
    });
});
