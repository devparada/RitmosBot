// Mockeamos discord-player
jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

const playCommand = require("../src/commands/play");
const { useMainPlayer } = require("discord-player");
const { createVoiceInteraction } = require("./mocks/discordMocks");
const { MessageFlags } = require("discord.js");

const RED = 15548997;
const GREEN = 5763719;

// Datos de ejemplo
const PLAY_TEST = {
    GUILD_ID: "test-guild-id",
    VOICE_CHANNEL_ID: "test-voice-channel-id",
    SONG_URL: "https://www.youtube.com/watch?v=RXKabdUBiWM",
    SONG_TITLE: "Título de Prueba",
};

describe("/play command", () => {
    let playerMock;
    let queueMock;
    let searchResult;
    let interaction;

    beforeEach(() => {
        jest.clearAllMocks();

        // Resultado simulado de player.search()
        searchResult = {
            tracks: [
                {
                    title: PLAY_TEST.SONG_TITLE,
                    url: PLAY_TEST.SONG_URL,
                },
            ],
        };

        // Simulamos una cola existente con node.play()
        queueMock = {
            connect: jest.fn(), // Conecta al canal de voz
            addTrack: jest.fn(), // Añade pista a la cola
            node: {
                isPlaying: jest.fn(() => false),
                isPaused: jest.fn(() => false),
                play: jest.fn(() => Promise.resolve(searchResult.tracks[0])),
            },
            tracks: { size: 1 },
        };

        // Mock principal del jugador
        playerMock = {
            nodes: new Map([[PLAY_TEST.GUILD_ID, queueMock]]),
            search: jest.fn(() => Promise.resolve(searchResult)),
        };

        useMainPlayer.mockReturnValue(playerMock);
        interaction = createVoiceInteraction(PLAY_TEST, PLAY_TEST.VOICE_CHANNEL_ID);
    });

    test("Envia el mensaje de error si el usuario no está en un canal de voz", async () => {
        interaction = createVoiceInteraction(PLAY_TEST, null);

        await playCommand.run({ interaction });

        // Verifica que se responde con el mensaje de error
        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [
                {
                    data: {
                        color: RED,
                        description: "¡Debes estar en un canal de voz para reproducir música!",
                    },
                },
            ],
            flags: MessageFlags.Ephemeral,
        });
    });

    test("Envia el mensaje de error si no hay URL ni archivo adjunto", async () => {
        // Hacemos que no tenemos URL ni file
        interaction.options.getString = () => null;
        interaction.options.getAttachment = () => null;

        await playCommand.run({ interaction });

        // Verifica que se responde con un reply efímero
        expect(interaction.reply).toHaveBeenCalledWith({
            embeds: [
                {
                    data: {
                        color: RED,
                        description: "Debes especificar una URL o subir un archivo para reproducir música",
                    },
                },
            ],
            flags: MessageFlags.Ephemeral,
        });
    });

    test("Reproduce música correctamente cuando todo es válido", async () => {
        await playCommand.run({ interaction });

        expect(interaction.deferReply).toHaveBeenCalled();
        // Búsqueda con la URL
        expect(playerMock.search).toHaveBeenCalledWith(PLAY_TEST.SONG_URL, { requestedBy: interaction.user });

        // Conecta la cola y añade la pista en ella
        expect(queueMock.connect).toHaveBeenCalledWith(PLAY_TEST.VOICE_CHANNEL_ID);
        expect(queueMock.addTrack).toHaveBeenCalledWith(searchResult.tracks[0]);

        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [
                {
                    data: {
                        color: GREEN,
                        description: `💿 Añadido a la cola: ${PLAY_TEST.SONG_TITLE} 💿`,
                    },
                },
            ],
        });
    });

    test("Maneja cuando no se encuentra la canción en la búsqueda", async () => {
        const voiceChannel = { id: PLAY_TEST.VOICE_CHANNEL_ID };
        const interaction = createVoiceInteraction(PLAY_TEST, voiceChannel);

        // Simulamos que no hay resultados en la búsqueda
        playerMock.search.mockResolvedValueOnce({ tracks: [] });

        await playCommand.run({ interaction });

        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [{ data: { color: RED, description: "No se ha podido encontrar la canción" } }],
            flags: MessageFlags.Ephemeral,
        });
    });
});
