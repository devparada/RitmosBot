import { type ChatInputCommandInteraction, Colors } from "discord.js";
import type { KazagumoPlayer } from "kazagumo";
import { afterEach, beforeEach, describe, expect, type MockInstance, test, vi } from "vitest";
import playCommand from "#/commands/play.js";
import type { ExtendedClient } from "#/types/discord.js";
import { usuarioEnVoiceChannel } from "#/utils/voiceUtils.js";
import { createVoiceInteraction } from "#tests/mocks/discordMocks.js";

vi.mock("#/utils/voiceUtils", () => ({
    usuarioEnVoiceChannel: vi.fn(),
}));

const PLAY_TEST = {
    SONG_URL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    SONG_TITLE: "Never Gonna Give You Up",
    AUTHOR: "Rick Astley",
};

describe("/play command", () => {
    let clientMock: ExtendedClient;
    let interactionMock: ChatInputCommandInteraction;
    let playerMock: Partial<KazagumoPlayer> & { play: ReturnType<typeof vi.fn> };
    let consoleSpy: MockInstance;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        vi.mocked(usuarioEnVoiceChannel).mockResolvedValue(true);

        playerMock = {
            queue: { tracks: [], add: vi.fn(), length: 0 } as any,
            play: vi.fn(),
            playing: false,
            paused: false,
        } as Partial<KazagumoPlayer> & { play: ReturnType<typeof vi.fn> };

        clientMock = {
            lavalink: {
                createPlayer: vi.fn().mockResolvedValue(playerMock),
                getPlayer: vi.fn().mockReturnValue(null),
                search: vi
                    .fn()
                    .mockResolvedValue({ tracks: [{ title: PLAY_TEST.SONG_TITLE, author: PLAY_TEST.AUTHOR }] }),
            },
        } as unknown as ExtendedClient;

        interactionMock = createVoiceInteraction({
            GUILD_ID: "123",
            SONG_URL: PLAY_TEST.SONG_URL,
        }) as unknown as ChatInputCommandInteraction;
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    const getEmbed = (callIndex = 0) => {
        const call = (interactionMock.editReply as any).mock.calls[callIndex][0];
        const embed = call.embeds ? call.embeds[0] : call;
        return embed.data || embed;
    };

    test("Debe detener ejecución si no está en voz", async () => {
        // Valida que el comando se detenga tempranamente si el usuario no está en un canal de voz
        vi.mocked(usuarioEnVoiceChannel).mockResolvedValue(false);
        await playCommand.run({ client: clientMock, interaction: interactionMock });
        expect(clientMock.lavalink.createPlayer).not.toHaveBeenCalled();
    });

    test("Debe reproducir si no hay cola", async () => {
        // Valida que la canción empiece a sonar inmediatamente (embed verde) si el bot no estaba reproduciendo nada
        await playCommand.run({ client: clientMock, interaction: interactionMock });
        const embed = getEmbed();
        expect(embed.title).toBe(PLAY_TEST.SONG_TITLE);
        expect(embed.color).toBe(Colors.Green);
    });

    test("Debe añadir a la cola si ya reproduce", async () => {
        // Valida que la canción se añada a la cola (embed azul) si el bot ya está reproduciendo música
        vi.mocked(clientMock.lavalink.createPlayer).mockResolvedValue({ ...playerMock, playing: true } as any);
        await playCommand.run({ client: clientMock, interaction: interactionMock });
        const embed = getEmbed();
        expect(embed.color).toBe(Colors.Blue);
    });

    test("Debe fallar si Lavalink desconectado", async () => {
        // Valida el manejo de errores enviando un embed rojo si ocurre una excepción al conectar con Lavalink
        vi.mocked(clientMock.lavalink.createPlayer).mockRejectedValue(new Error("Lavalink desconectado"));
        await playCommand.run({ client: clientMock, interaction: interactionMock });
        const embed = getEmbed();
        expect(embed.color).toBe(Colors.Red);
    });

    test("Debe fallar si no hay resultados", async () => {
        // Valida que se informe al usuario si la búsqueda de la canción no devuelve resultados
        vi.mocked(clientMock.lavalink.search).mockResolvedValue({ tracks: [] } as any);
        await playCommand.run({ client: clientMock, interaction: interactionMock });
        const embed = getEmbed();
        expect(embed.description).toBe("No se encontraron resultados.");
    });
});
