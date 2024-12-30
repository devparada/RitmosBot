const playCommand = require("../commands/play");
const { useMainPlayer } = require("discord-player");
const RED = 15548997;
const GREEN = 5763719;

jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const mockInteraction = (voiceChannel = null) => ({
    guild: { id: "test-guild-id" },
    member: {
        voice: {
            channel: voiceChannel,
        },
    },
    options: { getString: () => "https://www.youtube.com/watch?v=RXKabdUBiWM" },
    reply: jest.fn(),
    deferReply: jest.fn(),
    followUp: jest.fn(),
    client: {
        on: jest.fn(),
    },
});

describe("/play command", () => {
    let playerMock;
    let queueMock;
    let trackMock;
    let songMock;

    beforeEach(() => {
        trackMock = {
            title: "Song Title",
            url: "https://www.youtube.com/watch?v=RXKabdUBiWM",
        };
        songMock = {
            track: trackMock,
        };
        const tracksMock = {
            size: 1,
            add: jest.fn(),
        };
        queueMock = {
            tracks: tracksMock,
            connect: jest.fn(),
            play: tracksMock.play,
            addTrack: jest.fn(() => songMock),  // Método simulado que devuelve la canción agregada
        };
        playerMock = {
            nodes: new Map(),
            play: jest.fn(() => Promise.resolve(songMock)),  // Aquí se mockea la función `play` en el player
        };
        playerMock.nodes.set("test-guild-id", queueMock);
        useMainPlayer.mockReturnValue(playerMock);
    });

    test("Responde con un mensaje de error si el usuario no está en un canal de voz", async () => {
        const interaction = mockInteraction();

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
        const voiceChannel = { id: "test-voice-channel-id" };
        const interaction = mockInteraction(voiceChannel);
        const songUrl = "https://www.youtube.com/watch?v=RXKabdUBiWM";

        await playCommand.run({ interaction });

        expect(playerMock.play).toHaveBeenCalledWith(voiceChannel, songUrl, {
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
});
