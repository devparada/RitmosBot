const pingCommand = require("../src/commands/ping");

const WS_PING = 50;

const mockInteraction = () => ({
    commandName: "ping",
    reply: jest.fn(),
    editReply: jest.fn(),
    client: {
        ws: {
            ping: WS_PING,
        },
    },
});

describe("/ping command", () => {
    let interaction;

    beforeEach(() => {
        jest.clearAllMocks();
        interaction = mockInteraction();
    });

    test("Calcula el ping y modifica el embed", async () => {
        await pingCommand.run({ interaction });

        // Verifica el mensaje inicial
        expect(interaction.reply).toHaveBeenCalledWith("🏓 Pong! Calculando latencia...");
        expect(interaction.editReply).toHaveBeenCalled();

        // Obtiene el argumento pasado a editReply
        const editReplyArgs = interaction.editReply.mock.calls[0][0];
        const embed = editReplyArgs.embeds[0].toJSON();

        // Verifica el embed enviado con editReply
        expect(embed.fields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: "Latencia del bot",
                    value: expect.stringMatching(/^(0ms|1ms)$/),
                    inline: true,
                }),
                expect.objectContaining({ name: "Latencia de la API", value: WS_PING + "ms", inline: true }),
            ]),
        );
    });
});
