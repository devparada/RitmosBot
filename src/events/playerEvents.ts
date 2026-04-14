import { Colors, EmbedBuilder, type TextChannel } from "discord.js";
import type { KazagumoTrack } from "kazagumo";
import type { ExtendedClient } from "../types/discord";

export function playerEvents(client: ExtendedClient) {
    client.lavalink.shoukaku.on("ready", (name) => {
        console.log(`[LAVALINK] NODO CONECTADO: ${name}`);
    });

    client.lavalink.shoukaku.on("error", (name, error) => {
        console.error(`[LAVALINK] ERROR EN NODO ${name}:`, error.message);
    });

    client.lavalink.on("playerStart", (player, track: KazagumoTrack) => {
        const channelId = player.textId;
        if (!channelId) return;

        const channel = client.channels.cache.get(channelId) as TextChannel;
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setAuthor({
                name: "Reproduciendo ahora",
                iconURL: client.user?.displayAvatarURL(),
            })
            .setTitle(track.title)
            .setURL(track.uri || null)
            .setThumbnail(track.thumbnail || null)
            .addFields(
                { name: "🎤 Autor", value: track.author || "Desconocido", inline: true },
                { name: "⏳ Duración", value: formatDuration(track.length ?? 0), inline: true },
            )
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(console.error);
    });

    client.lavalink.on("playerException", (player, data) => {
        const track = player.queue.current;
        const error = data.exception?.message || "Error desconocido";

        console.error(`❌ Error en track ${track?.title}:`, error);

        const channelId = player.textId;
        if (!channelId) return;

        const channel = client.channels.cache.get(channelId) as TextChannel;
        if (channel) {
            channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setTitle("⚠️ Error de reproducción")
                        .setDescription(
                            `No se pudo reproducir **${track?.title}**.\n**Motivo:** Error técnico en el nodo de Lavalink.`,
                        ),
                ],
            });
        }
    });

    /**
     * Evento: Cuando la cola se termina
     */
    client.lavalink.on("playerEmpty", (player) => {
        const channelId = player.textId;
        if (!channelId) return;
        const channel = client.channels.cache.get(channelId) as TextChannel;

        if (channel) {
            channel.send("🎵 La cola ha terminado. ¡Añade más canciones!");
        }
        // player.destroy(); // Podrías destruirlo aquí si quieres que se salga del canal
    });
}

/**
 * Función auxiliar para formatear milisegundos a formato mm:ss
 */
function formatDuration(ms: number): string {
    if (ms <= 0 || ms >= 36000000) return "En vivo";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
