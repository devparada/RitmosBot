jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

// Mockeamos voiceUtils si lo usas dentro del comando
jest.mock("../src/utils/voiceUtils", () => ({
    usuarioEnVoiceChannel: jest.fn(),
}));

const loopCommand = require("../src/commands/loop");
const { useMainPlayer } = require("discord-player");
const { createModeInteraction } = require("./mocks/discordMocks");
const { usuarioEnVoiceChannel } = require("../src/utils/voiceUtils");

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
        usuarioEnVoiceChannel.mockReturnValue(true);
    });

    test("Si no hay canción reproduciéndose", async () => {
        interaction = createModeInteraction(LOOP_TEST.MODES.ON, LOOP_TEST);
        queueMock.isPlaying.mockReturnValue(false);

        await loopCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            content: "No hay ninguna canción reproduciéndose actualmente",
            ephemeral: true,
        });
    });

    test("Activa la repetición y responde con un mensaje cuando es 'on'", async () => {
        interaction = createModeInteraction(LOOP_TEST.MODES.ON, LOOP_TEST);
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(2);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "🔁 Repetición de la cola activada",
        });
    });

    test("Desactiva la repetición y responde con un mensaje cuando es 'off'", async () => {
        interaction = createModeInteraction(LOOP_TEST.MODES.OFF, LOOP_TEST);
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(0);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "⏹️ Repetición desactivada",
        });
    });

    test("Manda error si no hay cola en el servidor", async () => {
        interaction = createModeInteraction(LOOP_TEST.MODES.ON, LOOP_TEST);
        playerMock.nodes.clear();

        await loopCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            content: "No hay ninguna canción reproduciéndose actualmente",
            ephemeral: true,
        });
    });
});
