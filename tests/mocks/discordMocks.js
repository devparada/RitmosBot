// Creamos una interacción con voz (ej: /play, /shuffle, etc.)
const createVoiceInteraction = (constants, voiceChannel = "voice-channel-id") => {
    const member = {
        voice: {
            channel: { id: voiceChannel },
            channelId: voiceChannel,
        },
    };
    const user = { id: "user", username: "TestUser" };

    return {
        guildId: constants.GUILD_ID,
        guild: { id: constants.GUILD_ID },
        member,
        user,
        options: {
            getString: () => constants.SONG_URL,
            getAttachment: jest.fn(),
        },
        reply: jest.fn().mockResolvedValue({}),
        editReply: jest.fn().mockResolvedValue({}),
        deferReply: jest.fn().mockResolvedValue({}),
        followUp: jest.fn().mockResolvedValue({}),
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
        guildId: constants.GUILD_ID,
        guild: { id: constants.GUILD_ID },
        member,
        options: {
            getString: jest.fn(() => mode),
        },
        reply: jest.fn().mockResolvedValue({}),
        editReply: jest.fn().mockResolvedValue({}),
    };
};

// Creamos una interacción para comandos simples como /ping
const createBasicInteraction = (pingValue) => ({
    guildId: "test-guild-id",
    guild: { id: "test-guild-id" },
    reply: jest.fn().mockResolvedValue({}),
    editReply: jest.fn().mockResolvedValue({}),
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
