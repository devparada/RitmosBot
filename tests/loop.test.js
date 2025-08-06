jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const loopCommand = require("../src/commands/loop");
const { useMainPlayer } = require("discord-player");
const { createModeInteraction } = require("./mocks/discordMocks");

// Datos de ejemplo
const LOOP_TEST = {
    GUILD_ID: "test-guild-id",
    MODES: {
        ON: "on",
        OFF: "off",
    },
};

describe("/loop command", () => {
    let playerMock;
    let queueMock;

    beforeEach(() => {
        jest.clearAllMocks();

        queueMock = {
            isPlaying: jest.fn(),
            setRepeatMode: jest.fn(),
        };
        playerMock = {
            nodes: new Map(),
        };
        playerMock.nodes.set(LOOP_TEST.GUILD_ID, queueMock);
        useMainPlayer.mockReturnValue(playerMock);
    });

    test("Si no hay canción reproduciéndose", async () => {
        const interaction = createModeInteraction(LOOP_TEST.MODES.ON, LOOP_TEST);
        queueMock.isPlaying.mockReturnValue(false);

        await loopCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            content: "No hay ninguna canción reproduciéndose actualmente",
            ephemeral: true,
        });
    });

    test("Activa la repetición y responde con un mensaje cuando es 'on'", async () => {
        const interaction = createModeInteraction(LOOP_TEST.MODES.ON, LOOP_TEST);
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(2);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "🔁 Repetición de la cola activada",
        });
    });

    test("Desactiva la repetición y responde con un mensaje cuando es 'off'", async () => {
        const interaction = createModeInteraction(LOOP_TEST.MODES.OFF, LOOP_TEST);
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(0);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "⏹️ Repetición desactivada",
        });
    });
});
