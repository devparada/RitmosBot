// Mockeamos discord-player
jest.mock("discord-player", () => ({
    useMainPlayer: jest.fn(),
}));

// Mockeamos la función del archivo utils
jest.mock("../src/utils/utils", () => ({
    usuarioEnVoiceChannel: jest.fn(),
}));

const playCommand = require("../src/commands/play");
const { usuarioEnVoiceChannel } = require("../src/utils/utils");
const { useMainPlayer } = require("discord-player");
const { GuildMember, User } = require("discord.js");

const RED = 15548997;
const GREEN = 5763719;

// Datos de ejemplo
const PLAY_TEST = {
    GUILD_ID: "test-guild-id",
    VOICE_CHANNEL_ID: "test-voice-channel-id",
    SONG_URL: "https://www.youtube.com/watch?v=RXKabdUBiWM",
    SONG_TITLE: "Título de Prueba",
};

// Creamos un mock de GuildMember que pase el instanceof
class FakeGuildMember extends GuildMember {
    constructor() {
        super(null, null);
        this._voiceChannel = null;
    }

    get voice() {
        return { channel: this._voiceChannel };
    }

    setVoiceChannel(channel) {
        this._voiceChannel = channel;
    }
}

// Simulamos una interacción de Discord
const createInteraction = (voiceChannel = null) => {
    const member = new FakeGuildMember();
    member.setVoiceChannel(voiceChannel);

    const user = new User(null, { id: "user-id", username: "TestUser" });

    return {
        guild: { id: PLAY_TEST.GUILD_ID },
        member,
        user,
        options: { getString: () => PLAY_TEST.SONG_URL, getAttachment: jest.fn() },
        reply: jest.fn(),
        deferReply: jest.fn(() => Promise.resolve()),
        followUp: jest.fn(),
        channel: { id: "text-channel-id" },
    };
};

describe("/play command", () => {
    let playerMock;
    let queueMock;
    let searchResult;

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
    });

    test("Envia el mensaje de error si el usuario no está en un canal de voz", async () => {
        const interaction = createInteraction();

        usuarioEnVoiceChannel.mockResolvedValue(false);

        await playCommand.run({ interaction });

        // Verifica que se responde con el mensaje de error
        expect(interaction.deferReply).toHaveBeenCalledWith();
    });

    test("Envia el mensaje de error si no hay URL ni archivo adjunto", async () => {
        const voiceChannel = { id: PLAY_TEST.VOICE_CHANNEL_ID };
        const interaction = createInteraction(voiceChannel);
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
            flags: expect.any(Number),
        });
    });

    test("Reproduce música correctamente cuando todo es válido", async () => {
        const voiceChannel = { id: PLAY_TEST.VOICE_CHANNEL_ID };
        const interaction = createInteraction(voiceChannel);

        await playCommand.run({ interaction });

        expect(interaction.deferReply).toHaveBeenCalled();

        // Búsqueda con la URL
        expect(playerMock.search).toHaveBeenCalledWith(PLAY_TEST.SONG_URL, { requestedBy: interaction.user });

        // Conecta la cola y añade la pista en ella
        expect(queueMock.connect).toHaveBeenCalledWith(voiceChannel);
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
        const interaction = createInteraction(voiceChannel);

        // Simulamos que no hay resultados en la búsqueda
        playerMock.search.mockResolvedValueOnce({ tracks: [] });

        await playCommand.run({ interaction });

        expect(interaction.followUp).toHaveBeenCalledWith({
            embeds: [{ data: { color: RED, description: "No se ha podido encontrar la canción" } }],
            flags: expect.any(Number),
        });
    });
});
