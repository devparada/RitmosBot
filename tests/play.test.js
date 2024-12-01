const playCommand = require("../commands/play");
const RED = 15548997;

jest.mock('discord-player', () => ({
    useMainPlayer: jest.fn(),
}));

describe("/play command", () => {
    test('Responde con un mensaje de error si el usuario no está en un canal de voz', async () => {
        const interaction = {
            member: {
                voice: {
                    channel: null
                }
            },
            options: { getString: () => "https://www.youtube.com/watch?v=RXKabdUBiWM" },
            reply: jest.fn(),
        };

        await playCommand.run({ interaction });

        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    color: RED,
                    description: "¡Debes estar en un canal de voz para reproducir música!"
                }
            }]
        });
    });
});
