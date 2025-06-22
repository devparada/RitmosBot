jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const loopCommand = require("../src/commands/loop");
const { useMainPlayer } = require("discord-player");

// Datos de ejemplo
const LOOP_TEST = {
    GUILD_ID: "test-guild-id",
    MODES: {
        ON: "on",
        OFF: "off",
    },
};

const createInteraction = ({ mode = LOOP_TEST.MODES.OFF }) => ({
    guild: { id: LOOP_TEST.GUILD_ID },
    options: {
        getString: jest.fn(() => mode),
    },
    reply: jest.fn(),
});

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
        const interaction = createInteraction(LOOP_TEST.MODES.ON);
        queueMock.isPlaying.mockReturnValue(false);

        await loopCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            content: "No hay ninguna canción reproduciéndose actualmente",
            ephemeral: true,
        });
    });


    test("Activa la repetición y responde con un mensaje cuando es 'on'", async () => {
        const interaction = createInteraction({ mode: LOOP_TEST.MODES.ON });
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(2);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "🔁 Repetición de la cola activada",
        });
    });

    test("Desactiva la repetición y responde con un mensaje cuando es 'off'", async () => {
        const interaction = createInteraction({ mode: LOOP_TEST.MODES.OFF });
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(0);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "⏹️ Repetición desactivada",
        });
    });
});
