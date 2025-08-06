// Mockeamos discord-player
jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const shuffleCommand = require("../src/commands/shuffle");
const { useMainPlayer } = require("discord-player");
const { createVoiceInteraction } = require("./mocks/discordMocks");

const RED = 15548997;
const BLUE = 3447003;

// Datos de ejemplo
const SHUFFLE_TEST = {
    GUILD_ID: "test-guild-id",
};

describe("/shuffle command", () => {
    let playerMock;
    let queueMock;

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
    });

    test("Intenta hacer el shuffle y responde con un mensaje de error", async () => {
        playerMock.nodes.clear();

        const interaction = createVoiceInteraction(SHUFFLE_TEST.GUILD_ID, SHUFFLE_TEST);
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

    test("Intenta hacer el shuffle con 0 canciones", async () => {
        playerMock.nodes.clear();
        const interaction = createVoiceInteraction(SHUFFLE_TEST.GUILD_ID, SHUFFLE_TEST);
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

        const interaction = createVoiceInteraction(SHUFFLE_TEST.GUILD_ID, SHUFFLE_TEST);
        await shuffleCommand.run({ interaction });

        expect(queueMock.tracks.shuffle).toHaveBeenCalled();

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

        const interaction = createVoiceInteraction(SHUFFLE_TEST.GUILD_ID, SHUFFLE_TEST);
        await shuffleCommand.run({ interaction });

        expect(queueMock.tracks.shuffle).toHaveBeenCalled();

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
        const interaction = createVoiceInteraction(null, SHUFFLE_TEST);

        await shuffleCommand.run({ interaction });

        expect(interaction.deferReply).toHaveBeenCalledWith;
    });
});
