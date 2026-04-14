// Mockeamos las utilidades
jest.mock("@/utils/voiceUtils", () => ({
    usuarioEnVoiceChannel: jest.fn(),
}));

const shuffleCommand = require("@/commands/shuffle");
const { usuarioEnVoiceChannel } = require("@/utils/voiceUtils");
const { createVoiceInteraction } = require("@tests/mocks/discordMocks");
const { Colors } = require("discord.js");

// Datos de ejemplo
const SHUFFLE_TEST = { GUILD_ID: "test-guild-id" };

describe.skip("/shuffle command", () => {
    let clientMock;
    let playerMock;
    let interaction;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock del Player de Lavalink
        playerMock = {
            connected: true,
            queue: {
                tracks: [{}, {}, {}], // 3 canciones por defecto
                shuffle: jest.fn().mockResolvedValue(true),
            },
        };

        // Mock del ExtendedClient
        clientMock = {
            lavalink: {
                getPlayer: jest.fn((id) => (id === SHUFFLE_TEST.GUILD_ID ? playerMock : null)),
            },
        };

        interaction = createVoiceInteraction(SHUFFLE_TEST, "voice-channel-id");
        usuarioEnVoiceChannel.mockResolvedValue(true);
    });

    test("Intenta hacer el shuffle cuando no hay cola (getValidatedQueue falla)", async () => {
        clientMock.lavalink.getPlayer.mockReturnValue(null);

        await shuffleCommand.run({ client: clientMock, interaction });

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            description: "❌ No hay más canciones en la cola",
                        }),
                    }),
                ],
            }),
        );
    });

    test("Intenta hacer el shuffle con 0 canciones en la cola", async () => {
        playerMock.queue.tracks = [];

        await shuffleCommand.run({ client: clientMock, interaction });

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Red,
                            description: "❌ No hay más canciones en la cola",
                        }),
                    }),
                ],
            }),
        );
    });

    test("Hace el shuffle correctamente con canciones", async () => {
        await shuffleCommand.run({ client: clientMock, interaction });

        expect(playerMock.queue.shuffle).toHaveBeenCalledTimes(1);

        expect(interaction.editReply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Blue,
                            description: "¡La cola ha sido mezclada!",
                        }),
                    }),
                ],
            }),
        );
    });

    test("Error si el usuario no está en el canal de voz", async () => {
        // Simulamos que la utilidad de validación de voz devuelve false
        usuarioEnVoiceChannel.mockResolvedValue(false);

        await shuffleCommand.run({ client: clientMock, interaction });

        expect(playerMock.queue.shuffle).not.toHaveBeenCalled();
        expect(interaction.reply).not.toHaveBeenCalled();
    });
});
