const playCommand = require("../commands/play");
const { useMainPlayer } = require("discord-player");

const RED = 15548997;
const GREEN = 5763719;

// Datos de ejemplo
const PLAY_TEST = {
    GUILD_ID: "test-guild-id",
    VOICE_CHANNEL_ID: "test-voice-channel-id",
    SONG_URL: "https://www.youtube.com/watch?v=RXKabdUBiWM",
    SONG_TITLE: "Título de Prueba",
};

jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const createInteraction = (voiceChannel = null) => ({
    guild: { id: PLAY_TEST.GUILD_ID },
    member: {
        voice: {
            channel: voiceChannel,
        },
    },
    options: { getString: () => PLAY_TEST.SONG_URL, getAttachment: jest.fn() },
    reply: jest.fn(),
    deferReply: jest.fn(() => Promise.resolve()),
    followUp: jest.fn(),
    channel: { id: "text-channel-id" },
});

describe.skip("/play command", () => {
    let playerMock;
    let queueMock;
    let songMock;
    let consoleSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleSpy = jest.spyOn(console, "log").mockImplementation(() => { });

        songMock = {
            track: {
                title: PLAY_TEST.SONG_TITLE,
                url: PLAY_TEST.SONG_URL,
            },
        };
        queueMock = {
            connect: jest.fn(),
            play: jest.fn(() => Promise.resolve(songMock)),
            addTrack: jest.fn(() => songMock),  // Método simulado que devuelve la canción agregada
        };
        playerMock = {
            nodes: new Map([[PLAY_TEST.GUILD_ID, queueMock]]),
            play: jest.fn(() => Promise.resolve(songMock)),  // Aquí se mockea la función `play` en el player
        };

        useMainPlayer.mockReturnValue(playerMock);
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    test("Responde con un mensaje de error si el usuario no está en un canal de voz", async () => {
        const interaction = createInteraction();

        await playCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: RED,
                    description: "¡Debes estar en un canal de voz para reproducir música!",
                },
            }],
        });
    });

    test("Reproduce música si el usuario está en un canal de voz y la URL es válida", async () => {
        const voiceChannel = { id: PLAY_TEST.VOICE_CHANNEL_ID };
        const interaction = createInteraction(voiceChannel);

        await playCommand.run({ interaction });

        expect(playerMock.play).toHaveBeenCalledWith(voiceChannel, PLAY_TEST.SONG_URL, {
            channel: interaction.channel,
        });

        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: GREEN,
                    description: `💿 Añadido a la cola: ${songMock.track.title} 💿`,
                },
            }],
        });
    });

    test("Maneja error al conectar la cola y notifica error general", async () => {
        const voiceChannel = { id: PLAY_TEST.VOICE_CHANNEL_ID };
        const interaction = createInteraction(voiceChannel);

        queueMock.connection = null;
        queueMock.connect.mockRejectedValue(new Error("Connect failed"));

        await playCommand.run({ interaction });

        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: RED,
                    description: "Error al intentar reproducir la canción",
                },
            }],
        });

        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    test("Maneja error de reproducción y notifica ‘playlist inexistente’", async () => {
        const voiceChannel = { id: PLAY_TEST.VOICE_CHANNEL_ID };
        const interaction = createInteraction(voiceChannel);

        queueMock.connection = {}; // Para que no entre al connect()
        playerMock.play.mockRejectedValue(new Error("Playback error"));

        await playCommand.run({ interaction });

        expect(interaction.deferReply).toHaveBeenCalled();
        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: RED,
                    description: "La canción o playlist no existe",
                },
            }],
        });

        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    test("Crea nueva cola si no existe y reproduce música exitosamente", async () => {
        const interaction = createInteraction({
            id: PLAY_TEST.VOICE_CHANNEL_ID,
        });

        const createMock = jest.fn(() => queueMock);

        playerMock.nodes = {
            get: jest.fn(() => undefined),
            create: createMock,
        };
        useMainPlayer.mockReturnValue(playerMock);

        await playCommand.run({ interaction });

        expect(createMock).toHaveBeenCalledWith(interaction.guild, expect.any(Object));
        expect(queueMock.connect).toHaveBeenCalledWith(interaction.member.voice.channel);
        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: GREEN,
                    description: `💿 Añadido a la cola: ${songMock.track.title} 💿`,
                },
            }],
        });
    });
});
