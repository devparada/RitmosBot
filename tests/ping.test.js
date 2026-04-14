const pingCommand = require("@/commands/ping");
const { createBasicInteraction } = require("@tests/mocks/discordMocks");

const WS_PING = 50;

describe.skip("/ping command", () => {
    let interaction;

    beforeEach(() => {
        jest.clearAllMocks();
        interaction = createBasicInteraction(WS_PING);
    });

    test("Calcula el ping y modifica el embed", async () => {
        await pingCommand.run({ interaction });

        // Verifica el mensaje inicial
        expect(interaction.editReply).toHaveBeenNthCalledWith(1, "🏓 Pong! Calculando latencia...");

        // Obtiene el argumento pasado a editReply
        const editReplyArgs = interaction.editReply.mock.calls[1][0];
        const embed = editReplyArgs.embeds[0].data;

        expect(embed.title).toBe("🏓 Pong!");

        // Valida los campos del embed
        const botLatency = embed.fields.find((f) => f.name === "Latencia del bot");
        const apiLatency = embed.fields.find((f) => f.name === "Latencia de la API");

        expect(botLatency.value).toMatch(/^\d+ms$/);
        expect(apiLatency.value).toBe(`${WS_PING}ms`);
    });
});
