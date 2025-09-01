const pingCommand = require("../src/commands/ping");
const { createBasicInteraction } = require("./mocks/discordMocks");

const WS_PING = 50;

describe("/ping command", () => {
    let interaction;

    beforeEach(() => {
        jest.clearAllMocks();
        interaction = createBasicInteraction(WS_PING);
    });

    test("Calcula el ping y modifica el embed", async () => {
        await pingCommand.run({ interaction });

        // Verifica el mensaje inicial
        expect(interaction.reply).toHaveBeenCalledWith("🏓 Pong! Calculando latencia...");
        expect(interaction.editReply).toHaveBeenCalled();

        // Obtiene el argumento pasado a editReply
        const editReplyArgs = interaction.editReply.mock.calls[0][0];
        const embed = editReplyArgs.embeds[0].toJSON();

        expect(embed.title).toBe("🏓 Pong!");

        // Valida los campos del embed
        const botLatency = embed.fields.find((f) => f.name === "Latencia del bot");
        const apiLatency = embed.fields.find((f) => f.name === "Latencia de la API");

        // La latencia del bot es en ms
        expect(botLatency.value).toMatch(/^\d+ms$/);
        expect(botLatency.inline).toBe(true);

        // La latencia de la API debe coincidir con el mock
        expect(apiLatency.value).toBe(`${WS_PING}ms`);
        expect(apiLatency.inline).toBe(true);
    });
});
