// Mockeamos las utilidades
jest.mock("@/utils/voiceUtils", () => ({
    usuarioEnVoiceChannel: jest.fn(),
    getValidatedQueue: jest.fn(),
}));

// Mockeamos discord-player
jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const shuffleCommand = require("@/commands/shuffle");
const { usuarioEnVoiceChannel, getValidatedQueue } = require("@/utils/voiceUtils");
const { createVoiceInteraction } = require("@tests/mocks/discordMocks");
const { Colors } = require("discord.js");

// Datos de ejemplo
const SHUFFLE_TEST = { GUILD_ID: "test-guild-id" };

describe("/shuffle command", () => {
    let queueMock;
    let interaction;

    beforeEach(() => {
        jest.clearAllMocks();

        // Creamos un mock de la cola
        queueMock = {
            tracks: {
                size: 5,
                shuffle: jest.fn(),
            },
        };

        interaction = createVoiceInteraction(SHUFFLE_TEST, "voice-channel-id");

        // Configuramos los mocks de las utilidades por defecto para que "pasen"
        usuarioEnVoiceChannel.mockResolvedValue(true);
        getValidatedQueue.mockResolvedValue(queueMock);
    });

    test("Intenta hacer el shuffle cuando no hay cola (getValidatedQueue falla)", async () => {
        // Simulamos que getValidatedQueue ya manejó el error y devolvió null
        getValidatedQueue.mockResolvedValue(null);

        await shuffleCommand.run({ interaction });

        expect(queueMock.tracks.shuffle).not.toHaveBeenCalled();
        // No verificamos interaction.reply porque se asume que getValidatedQueue ya respondió
    });

    test("Intenta hacer el shuffle con 0 canciones en la cola", async () => {
        queueMock.tracks.size = 0;

        await shuffleCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith(
            expect.objectContaining({
                embeds: [
                    expect.objectContaining({
                        data: expect.objectContaining({
                            color: Colors.Red,
                            description: "No hay más canciones en la cola",
                        }),
                    }),
                ],
            }),
        );
    });

    test("Hace el shuffle correctamente con canciones", async () => {
        queueMock.tracks.size = 3;

        await shuffleCommand.run({ interaction });

        expect(queueMock.tracks.shuffle).toHaveBeenCalledTimes(1);
        expect(interaction.reply).toHaveBeenCalledWith(
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

        const result = await shuffleCommand.run({ interaction });

        expect(result).toBe(false);
        expect(getValidatedQueue).not.toHaveBeenCalled();
    });
});
