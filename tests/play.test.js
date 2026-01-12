// Mockeamos las utilidades de voz y discord-player
jest.mock("@/utils/voiceUtils", () => ({
    usuarioEnVoiceChannel: jest.fn(),
}));

jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const playCommand = require("@/commands/play");
const { useMainPlayer } = require("discord-player");
const { usuarioEnVoiceChannel } = require("@/utils/voiceUtils");
const { createVoiceInteraction } = require("@tests/mocks/discordMocks");
const { Colors, MessageFlags, GuildMember } = require("discord.js");

const PLAY_TEST = {
    GUILD_ID: "test-guild-id",
    VOICE_CHANNEL_ID: "test-voice-channel-id",
    SONG_URL: "https://www.youtube.com/watch?v=RXKabdUBiWM",
    SONG_TITLE: "Título de Prueba",
};

describe("/play command", () => {
    let playerMock;
    let queueMock;
    let searchResult;
    let interaction;

    beforeEach(() => {
        jest.clearAllMocks();

        searchResult = {
            tracks: [
                {
                    title: PLAY_TEST.SONG_TITLE,
                    url: PLAY_TEST.SONG_URL,
                },
            ],
            playlist: null,
        };

        queueMock = {
            connect: jest.fn().mockResolvedValue({}),
            addTrack: jest.fn(),
            connection: null,
            node: {
                isPlaying: jest.fn(() => false),
                isPaused: jest.fn(() => false),
                play: jest.fn().mockResolvedValue({}),
            },
            tracks: { size: 1 },
        };

        playerMock = {
            nodes: {
                get: jest.fn((id) => (id === PLAY_TEST.GUILD_ID ? queueMock : null)),
                create: jest.fn(() => queueMock),
            },
            search: jest.fn().mockResolvedValue(searchResult),
        };

        useMainPlayer.mockReturnValue(playerMock);
        usuarioEnVoiceChannel.mockResolvedValue(true);
        interaction = createVoiceInteraction(PLAY_TEST, PLAY_TEST.VOICE_CHANNEL_ID);

        // Forzamos el prototipo para que pase "member instanceof GuildMember"
        Object.setPrototypeOf(interaction.member, GuildMember.prototype);
        interaction.guild = { id: PLAY_TEST.GUILD_ID };
    });

    test("Envia el mensaje de error si el usuario no tiene canal de voz", async () => {
        // En tu código: if (!voiceChannel)
        interaction.member.voice.channel = null;

        await playCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Red,
                            description: "¡Debes estar en un canal de voz para reproducir música!",
                        }),
                    }),
                ],
                flags: MessageFlags.Ephemeral,
            }),
        );
    });

    test("Envia el mensaje de error si no hay URL ni archivo adjunto", async () => {
        // Simulamos que no se envió nada
        interaction.options.getString = jest.fn().mockReturnValue(null);
        interaction.options.getAttachment = jest.fn().mockReturnValue(null);

        await playCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            description: expect.stringContaining("especificar una URL"),
                        }),
                    }),
                ],
            }),
        );
    });

    test("Reproduce música correctamente cuando todo es válido", async () => {
        // Mock de la opción URL
        interaction.options.getString = jest.fn().mockReturnValue(PLAY_TEST.SONG_URL);

        await playCommand.run({ interaction });

        expect(interaction.deferReply).toHaveBeenCalled();
        expect(playerMock.search).toHaveBeenCalled();
        expect(queueMock.connect).toHaveBeenCalled();

        expect(interaction.followUp).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Green,
                            description: expect.stringContaining(PLAY_TEST.SONG_TITLE),
                        }),
                    }),
                ],
            }),
        );
    });

    test("Maneja cuando no se encuentra la canción en la búsqueda", async () => {
        playerMock.search.mockResolvedValueOnce({ tracks: [] });
        interaction.options.getString = jest.fn().mockReturnValue(PLAY_TEST.SONG_URL);

        await playCommand.run({ interaction });

        expect(interaction.followUp).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            description: "No se ha podido encontrar la canción",
                        }),
                    }),
                ],
            }),
        );
    });
});
