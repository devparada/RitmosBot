// Mockeamos la utilidad de voz
jest.mock("@/utils/voiceUtils", () => ({
    usuarioEnVoiceChannel: jest.fn(),
}));

const loopCommand = require("@/commands/loop");
const { usuarioEnVoiceChannel } = require("@/utils/voiceUtils");
const { createModeInteraction } = require("@tests/mocks/discordMocks");

const LOOP_TEST = {
    GUILD_ID: "test-guild-id",
    MODES: {
        QUEUE: "queue",
        OFF: "off",
    },
};

describe("/loop command", () => {
    let playerMock;
    let clientMock;
    let interaction;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock del Player de Lavalink
        playerMock = {
            connected: true,
            playing: true,
            repeatMode: "off",
            setRepeatMode: jest.fn().mockResolvedValue(true),
        };

        // Mock del Cliente Extendido
        clientMock = {
            lavalink: {
                getPlayer: jest.fn((id) => (id === LOOP_TEST.GUILD_ID ? playerMock : null)),
            },
        };

        // Mock de voz por defecto
        usuarioEnVoiceChannel.mockResolvedValue(true);
    });

    test("Si no hay canción reproduciéndose (queue.isPlaying es false)", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.QUEUE);

        playerMock.playing = false;
        playerMock.connected = true;

        await loopCommand.run({ client: clientMock, interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            content: "❌ No hay ninguna canción reproduciéndose actualmente",
            ephemeral: true,
        });
    });

    test("Activa la repetición y responde cuando el modo es 'on'", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.QUEUE);

        await loopCommand.run({ client:clientMock, interaction });

        // Verifica modo 2 y el texto exacto con emoji
        expect(playerMock.setRepeatMode).toHaveBeenCalledWith("queue");
        expect(interaction.editReply).toHaveBeenCalledWith({
            content: "🔁 Repetición de la cola activada",
        });
    });

    test("Desactiva la repetición y responde cuando el modo es 'off'", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.OFF);

        playerMock.playing = true;
        playerMock.connected = true;

        await loopCommand.run({ client: clientMock, interaction });

        // Verifica modo 0 y el texto exacto con emoji
        expect(playerMock.setRepeatMode).toHaveBeenCalledWith("off");
        expect(interaction.editReply).toHaveBeenCalledWith({
            content: "⏹️ Repetición desactivada",
        });
    });

    test("Manda error si el player no existe para ese servidor", async () => {
        interaction = createModeInteraction(LOOP_TEST, LOOP_TEST.MODES.QUEUE);
        // Hacemos que el get devuelva null
        clientMock.lavalink.getPlayer.mockReturnValue(null);

        await loopCommand.run({ client: clientMock, interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            content: "❌ No hay ninguna canción reproduciéndose actualmente",
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
