const shuffleCommand = require("../commands/shuffle");
const { useMainPlayer } = require("discord-player");
const RED = 15548997;

jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const mockInteraction = () => ({
    guild: { id: "test-guild-id" },
    options: {
        getString: jest.fn(),
    },
    reply: jest.fn(),
    member: {
        voice: {
            channel: { id: "test-voice-channel-id" },
        },
    },
});

describe("/shuffle command", () => {
    let playerMock;
    let queueMock;
    let tracksMock;

    beforeEach(() => {
        tracksMock = {
            shuffle: jest.fn(),
            size: 0,
        };
        queueMock = {
            tracks: tracksMock,
        };
        playerMock = {
            nodes: new Map(),
        };
        playerMock.nodes.set("test-guild-id", queueMock);
        useMainPlayer.mockReturnValue(playerMock);
    });

    test("Intenta hacer el shuffle y responde con un mensaje de error", async () => {
        const interaction = mockInteraction();

        await shuffleCommand.run({ interaction });

        expect(tracksMock.shuffle).not.toHaveBeenCalled();
        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: RED,
                    description: "No hay más canciones en la cola",
                },
            }],
        });
    });
});
