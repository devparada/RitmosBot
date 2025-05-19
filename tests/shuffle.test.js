const shuffleCommand = require("../commands/shuffle");
const { useMainPlayer } = require("discord-player");

const RED = 15548997;
const BLUE = 3447003;

// Datos de ejemplo
const SHUFFLE_TEST = {
    GUILD_ID: "test-guild-id",
};

jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const createInteraction = (voiceChannel = null) => ({
    guild: { id: SHUFFLE_TEST.GUILD_ID },
    options: {
        getString: jest.fn(),
    },
    reply: jest.fn(),
    member: {
        voice: {
            channel: voiceChannel,
        },
    },
});

const VOICE_CHANNEL = {
    id: SHUFFLE_TEST.VOICE_CHANNEL_ID,
};

describe("/shuffle command", () => {
    let playerMock;
    let queueMock;
    let tracksMock;

    beforeEach(() => {
        jest.clearAllMocks();

        tracksMock = {
            shuffle: jest.fn(),
            size: 0,
        };
        queueMock = {
            tracks: tracksMock,
        };
        playerMock = {
            nodes: new Map(),
        };
        playerMock.nodes.set(SHUFFLE_TEST.GUILD_ID, queueMock);
        useMainPlayer.mockReturnValue(playerMock);
    });

    test("Intenta hacer el shuffle y responde con un mensaje de error", async () => {
        const interaction = createInteraction(VOICE_CHANNEL);
        await shuffleCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: RED,
                    description: "No hay más canciones en la cola",
                },
            }],
        });
    });

    test("Intenta hacer el shuffle con 0 canciones", async () => {
        playerMock.nodes.clear();
        const interaction = createInteraction(VOICE_CHANNEL);
        await shuffleCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: RED,
                    description: "No hay ninguna canción en la cola",
                },
            }],
        });
    });


    test("Hace el shuffle con una canción", async () => {
        tracksMock.size = 1;
        const interaction = createInteraction(VOICE_CHANNEL);
        await shuffleCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: BLUE,
                    description: "¡La cola ha sido mezclada!",
                },
            }],
        });
    });

    test("Hace el shuffle con varias canciones", async () => {
        tracksMock.size = 4;
        const interaction = createInteraction(VOICE_CHANNEL);
        await shuffleCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: BLUE,
                    description: "¡La cola ha sido mezclada!",
                },
            }],
        });
    });

    test("Muestra el embed de error al no estar el usuario en el canal de voz", async () => {
        const interaction = createInteraction();
        await shuffleCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: RED,
                    description: "¡Debes estar en el canal de voz para usar este comando!",
                },
            }],
        });
    });
});
