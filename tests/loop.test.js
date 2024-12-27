const loopCommand = require("../commands/loop");
const { useMainPlayer } = require("discord-player");

jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const mockInteraction = () => ({
    guild: { id: "test-guild-id" },
    options: {
        getString: jest.fn(),
    },
    reply: jest.fn(),
});

describe("Loop Command", () => {
    let playerMock;
    let queueMock;

    beforeEach(() => {
        queueMock = {
            isPlaying: jest.fn(),
            setRepeatMode: jest.fn(),
        };
        playerMock = {
            nodes: new Map(),
        };
        playerMock.nodes.set("test-guild-id", queueMock);
        useMainPlayer.mockReturnValue(playerMock);
    });

    describe("/loop command", () => {
        test("Activa el modo de repetición cuando 'modo' es 'on'", async () => {
            const interaction = mockInteraction();
            interaction.options.getString.mockReturnValue("on");
            queueMock.isPlaying.mockReturnValue(true);

            await loopCommand.run({ interaction });

            expect(queueMock.setRepeatMode).toHaveBeenCalledWith(2);
            expect(interaction.reply).toHaveBeenCalledWith({
                content: "🔁 Repetición de la cola activada",
            });
        });
    });
});
