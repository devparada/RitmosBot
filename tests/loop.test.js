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

describe("/loop command", () => {
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

    test("Activa la repetición y responde con un mensaje cuando es 'on'", async () => {
        const interaction = mockInteraction();
        interaction.options.getString.mockReturnValue("on");
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(2);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "🔁 Repetición de la cola activada",
        });
    });

    test("Desactiva la repetición y responde con un mensaje cuando es 'off'", async () => {
        const interaction = mockInteraction();
        interaction.options.getString.mockReturnValue("off");
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(0);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "⏹️ Repetición desactivada",
        });
    });
});
