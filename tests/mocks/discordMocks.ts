import { vi } from "vitest";

// Creamos una interacción con voz (ej: /play, /shuffle, etc.)
export const createVoiceInteraction = (constants: any, voiceChannel = "voice-channel-id") => {
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
            getString: vi.fn(() => constants.SONG_URL),
            getAttachment: vi.fn(),
        },
        reply: vi.fn().mockResolvedValue({}),
        editReply: vi.fn().mockResolvedValue({}),
        deferReply: vi.fn().mockResolvedValue({}),
        followUp: vi.fn().mockResolvedValue({}),
        channel: { id: "text-channel-id" },
    };
};

// Creamos una interacción para comandos simples como /loop
export const createModeInteraction = (constants: any, mode: string, voiceChannelId = "voice-channel-id") => {
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
            getString: vi.fn(() => mode),
        },
        reply: vi.fn().mockResolvedValue({}),
        editReply: vi.fn().mockResolvedValue({}),
    };
};

// Creamos una interacción para comandos simples como /ping
export const createBasicInteraction = (pingValue: number) => ({
    guildId: "test-guild-id",
    guild: { id: "test-guild-id" },
    reply: vi.fn().mockResolvedValue({}),
    editReply: vi.fn().mockResolvedValue({}),
    client: {
        ws: {
            ping: pingValue,
        },
    },
});
