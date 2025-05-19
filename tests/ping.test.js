const pingCommand = require("../commands/ping");

describe("/ping command", () => {

  let interaction;
  const WS_PING = 50;

  beforeEach(() => {
    jest.clearAllMocks();

    interaction = {
      commandName: "ping",
      reply: jest.fn(),
      editReply: jest.fn(),
      client: {
        ws: {
          ping: WS_PING,
        },
      },
    };
  });

  test("Calcula el ping y modifica el embed", async () => {

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
        expect.objectContaining({ name: "Latencia de la API", value: WS_PING + "ms", inline: true }),
      ]),
    );
  });
});
