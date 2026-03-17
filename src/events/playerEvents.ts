import { Colors, EmbedBuilder, type TextChannel } from "discord.js";
import type { ExtendedClient } from "../types/discord";

export function playerEvents(client: ExtendedClient) {
    // Eventos de Lavalink
    client.lavalink.nodeManager.on("connect", (node) => {
        console.log(`NODO LAVALINK CONECTADO: ${node.id}`);
    });

    client.lavalink.nodeManager.on("error", (node, error) => {
        console.log(`ERROR EN NODO LAVALINK ${node.id}:`, error.message);
    });

    /**
     * Evento: Se dispara cuando una canción comienza a sonar.
     */
    client.lavalink.on("trackStart", (player, track) => {
        if (!track?.info) return;

        const channelId = player.textChannelId;
        if (!channelId) return;

        const channel = client.channels.cache.get(channelId) as TextChannel;
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setAuthor({ name: "Reproduciendo ahora", iconURL: client.user?.displayAvatarURL() })
            .setTitle(track.info.title)
            .setURL(track.info.uri || null)
            .setThumbnail(track.info.artworkUrl || null)
            .addFields(
                { name: "🎤 Autor", value: track.info.author, inline: true },
                { name: "⏳ Duración", value: formatDuration(track.info.duration), inline: true },
            )
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch((err) => console.error("Error enviando mensaje de trackStart:", err));
    });

    /**
     * Evento: Se dispara cuando hay un error en la reproducción (Ej: YouTube 403).
     */
    client.lavalink.on("trackError", (player, track, payload) => {
        console.error(`❌ Error en track ${track?.info.title}:`, payload.error);

        const channelId = player.textChannelId;
        if (!channelId) return;

        const channel = client.channels.cache.get(channelId) as TextChannel;
        if (channel) {
            channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor(Colors.Red)
                        .setTitle("⚠️ Error de reproducción")
                        .setDescription(
                            `No se pudo reproducir **${track?.info.title}**.\n**Motivo:** ${payload.error || "Desconocido (posible bloqueo de YouTube)"}`,
                        ),
                ],
            });
        }
    });
}

/**
 * Función auxiliar para formatear milisegundos a formato mm:ss
 */
function formatDuration(ms: number): string {
    if (ms <= 0) return "En vivo";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}
