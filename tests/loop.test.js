// Mockeamos la utilidad de voz
jest.mock("@/utils/voiceUtils", () => ({
    usuarioEnVoiceChannel: jest.fn(),
}));

// Mockeamos discord-player
jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const loopCommand = require("@/commands/loop");
const { usuarioEnVoiceChannel } = require("@/utils/voiceUtils");
const { useMainPlayer } = require("discord-player");
const { createModeInteraction } = require("@tests/mocks/discordMocks");

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

        // Creamos el mock de la cola (queue)
        queueMock = {
            isPlaying: jest.fn(),
            setRepeatMode: jest.fn(),
        };

        // Creamos el mock del player con soporte para nodes.get
        playerMock = {
            nodes: {
                get: jest.fn((id) => (id === LOOP_TEST.GUILD_ID ? queueMock : null)),
            },
        };

        useMainPlayer.mockReturnValue(playerMock);

        // Mock de voz por defecto: el usuario está en el canal
        usuarioEnVoiceChannel.mockResolvedValue(true);
    });

    test("Si no hay canción reproduciéndose (queue.isPlaying es false)", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.ON);
        queueMock.isPlaying.mockReturnValue(false);

        await loopCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            content: "No hay ninguna canción reproduciéndose actualmente",
            ephemeral: true,
        });
    });

    test("Activa la repetición y responde cuando el modo es 'on'", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.ON);
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        // Verifica modo 2 y el texto exacto con emoji
        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(2);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "🔁 Repetición de la cola activada",
        });
    });

    test("Desactiva la repetición y responde cuando el modo es 'off'", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.OFF);
        queueMock.isPlaying.mockReturnValue(true);

        await loopCommand.run({ interaction });

        // Verifica modo 0 y el texto exacto con emoji
        expect(queueMock.setRepeatMode).toHaveBeenCalledWith(0);
        expect(interaction.reply).toHaveBeenCalledWith({
            content: "⏹️ Repetición desactivada",
        });
    });

    test("Manda error si no existe la cola en el servidor (queue es null)", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.ON);
        // Hacemos que el get devuelva null
        playerMock.nodes.get.mockReturnValue(null);

        await loopCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            content: "No hay ninguna canción reproduciéndose actualmente",
            ephemeral: true,
        });
    });

    test("Error si el usuario no está en el canal de voz", async () => {
        usuarioEnVoiceChannel.mockResolvedValue(false);
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.ON);

        const result = await loopCommand.run({ interaction });

        expect(result).toBe(false);
        expect(interaction.reply).not.toHaveBeenCalled();
    });
});
