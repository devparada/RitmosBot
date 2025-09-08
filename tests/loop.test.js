jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const loopCommand = require("@/commands/loop");
const { useMainPlayer } = require("discord-player");
const { createModeInteraction } = require("@tests/mocks/discordMocks");

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
    let interaction;

    beforeEach(() => {
        jest.clearAllMocks();

        queueMock = {
            isPlaying: jest.fn(),
            setRepeatMode: jest.fn(),
        };

        playerMock = {
            nodes: new Map([[LOOP_TEST.GUILD_ID, queueMock]]),
        };

        useMainPlayer.mockReturnValue(playerMock);
    });

    test("Si no hay canción reproduciéndose", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.ON);
        queueMock.isPlaying.mockReturnValue(false);

        await loopCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            content: "No hay ninguna canción reproduciéndose actualmente",
            ephemeral: true,
        });
    });

    test("Activa la repetición y responde con un mensaje cuando es 'on'", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.ON);
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(2);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "🔁 Repetición de la cola activada",
        });
    });

    test("Desactiva la repetición y responde con un mensaje cuando es 'off'", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.OFF);
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(0);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "⏹️ Repetición desactivada",
        });
    });

    test("Manda error si no hay cola en el servidor", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.ON);
        playerMock.nodes.clear();

        await loopCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            content: "No hay ninguna canción reproduciéndose actualmente",
            ephemeral: true,
        });
    });
});
