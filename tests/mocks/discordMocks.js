const { GuildMember, User } = require("discord.js");

// Creamos un mock de GuildMember que pase el instanceof
class FakeGuildMember extends GuildMember {
    constructor(voiceChannel = null) {
        super(null, null);
        this._voiceChannel = voiceChannel;
    }

    get voice() {
        return { channel: this._voiceChannel };
    }

    setVoiceChannel(channel) {
        this._voiceChannel = channel;
    }
}

// Creamos una interacción con voz (ej: /play, /shuffle, etc.)
const createVoiceInteraction = (voiceChannel = null, constants) => {
    const member = new FakeGuildMember(voiceChannel);
    const user = new User(null, { id: "user", username: "TestUser" });

    return {
        guild: { id: constants.GUILD_ID },
        member,
        user,
        options: {
            getString: () => constants.SONG_URL,
            getAttachment: jest.fn(),
        },
        reply: jest.fn(),
        deferReply: jest.fn(() => Promise.resolve()),
        followUp: jest.fn(),
        channel: { id: "text-channel-id" },
    };
};

// Creamos una interacción para comandos simples como /loop
const createModeInteraction = (mode, constants) => ({
    guild: { id: constants.GUILD_ID },
    options: {
        getString: jest.fn(() => mode),
    },
    reply: jest.fn(),
});

// Creamos una interacción para comandos simples como /ping
const createBasicInteraction = (pingValue) => ({
    reply: jest.fn(),
    editReply: jest.fn(),
    client: {
        ws: {
            ping: pingValue,
        },
    },
});

module.exports = {
    FakeGuildMember,
    createVoiceInteraction,
    createModeInteraction,
    createBasicInteraction,
};
