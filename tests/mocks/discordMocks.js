// Creamos una interacción con voz (ej: /play, /shuffle, etc.)
const createVoiceInteraction = (constants, voiceChannel = null) => {
    const member = {
        voice: {
            channel: { id: voiceChannel },
            channelId: voiceChannel,
        },
    };
    const user = { id: "user", username: "TestUser" };

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
const createModeInteraction = (constants, mode, voiceChannelId = "voice-channel-id") => {
    const member = {
        voice: {
            channel: { id: voiceChannelId },
            channelId: voiceChannelId,
        },
    };

    return {
        guild: { id: constants.GUILD_ID },
        member,
        options: {
            getString: jest.fn(() => mode),
        },
        reply: jest.fn(),
    };
};

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
    createVoiceInteraction,
    createModeInteraction,
    createBasicInteraction,
};
