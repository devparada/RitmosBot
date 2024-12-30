const pingCommand = require("../commands/ping");

describe("/ping command", () => {
  test("Calcula el ping y modifica el embed", async () => {

    const interaction = {
      commandName: "ping",
      editReply: jest.fn(),
      reply: jest.fn(),
      client: {
        ws: {
          ping: 50,
        },
      },
    };

    await pingCommand.run({ interaction });

    // Verifica el mensaje inicial
    expect(interaction.reply).toHaveBeenCalledWith("🏓 Pong! Calculando latencia...");

    // Verifica la llamada a `editReply`
    expect(interaction.editReply).toHaveBeenCalled();

    // Obtiene el argumento pasado a editReply
    const editReplyArgs = interaction.editReply.mock.calls[0][0];
    expect(editReplyArgs).toHaveProperty("embeds");

    const embed = editReplyArgs.embeds[0];

    // Verifica el embed enviado con editReply
    expect(embed.data.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Latencia del bot", value: expect.stringMatching(/^(0ms|1ms)$/), inline: true }),
        expect.objectContaining({ name: "Latencia de la API", value: "50ms", inline: true }),
      ]),
    );
  });
});
