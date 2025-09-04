// Mockeamos discord-player
jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const shuffleCommand = require("../src/commands/shuffle");
const { useMainPlayer } = require("discord-player");
const { createVoiceInteraction } = require("./mocks/discordMocks");
const { MessageFlags } = require("discord.js");

const RED = 15548997;
const BLUE = 3447003;

// Datos de ejemplo
const SHUFFLE_TEST = {
    GUILD_ID: "test-guild-id",
};

describe("/shuffle command", () => {
    let playerMock;
    let queueMock;
    let interaction;

    beforeEach(() => {
        jest.clearAllMocks();

        // Aquí creamos un mock de tracks con shuffle y size
        const createTracksMock = (size) => {
            return {
                size,
                shuffle: jest.fn(),
            };
        };

        queueMock = {
            tracks: createTracksMock(1),
        };

        playerMock = {
            nodes: new Map([[SHUFFLE_TEST.GUILD_ID, queueMock]]),
        };

        useMainPlayer.mockReturnValue(playerMock);
        interaction = createVoiceInteraction(SHUFFLE_TEST, SHUFFLE_TEST.GUILD_ID);
    });

    test("Intenta hacer el shuffle con 0 canciones", async () => {
        playerMock.nodes.clear();

        await shuffleCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [
                {
                    data: {
                        color: RED,
                        description: "No hay ninguna canción en la cola",
                    },
                },
            ],
        });
    });

    test("Hace el shuffle con una canción", async () => {
        queueMock.tracks.size = 1;

        await shuffleCommand.run({ interaction });

        expect(queueMock.tracks.shuffle).toHaveBeenCalledTimes(1);
        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [
                {
                    data: {
                        color: BLUE,
                        description: "¡La cola ha sido mezclada!",
                    },
                },
            ],
        });
    });

    test("Hace el shuffle con varias canciones", async () => {
        queueMock.tracks.size = 5;

        await shuffleCommand.run({ interaction });

        expect(queueMock.tracks.shuffle).toHaveBeenCalledTimes(1);
        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [
                {
                    data: {
                        color: BLUE,
                        description: "¡La cola ha sido mezclada!",
                    },
                },
            ],
        });
    });

    test("Error si el usuario no está en el canal de voz", async () => {
        const interaction = createVoiceInteraction({ GUILD_ID: "test-guild-id" }, null);

        await shuffleCommand.run({ interaction });

        // Verifica que se responde con el mensaje de error
        expect(interaction.reply).toHaveBeenCalled();
        const replyEmbed = interaction.reply.mock.calls[0][0].embeds[0].toJSON();

        expect(replyEmbed.color).toBe(RED);
        expect(replyEmbed.description).toBe("¡Debes estar en un canal de voz para reproducir música!");
        expect(interaction.reply.mock.calls[0][0].flags).toBe(MessageFlags.Ephemeral);
    });
});
