import type { Client, VoiceState } from "discord.js";
import type { Player } from "discord-player";
import type { QueueMetadata } from "@/types/types";

/**
 * Registra el evento `voiceStateUpdate` para manejar cambios de canal de voz.
 *
 * Este módulo se encarga de detectar cuando el bot cambia de canal de voz
 * dentro de un mismo servidor y fuerza la reconexión del reproductor
 * (`discord-player`) al nuevo canal.
 *
 * Esto permite que el bot siga reproduciendo música correctamente
 * cuando es movido manualmente entre canales de voz.
 *
 * @param client - Cliente extendido de Discord.js que incluye el reproductor (`Player`).
 */
export function voiceEvent(client: Client & { player: Player }) {
    client.on("voiceStateUpdate", async (oldState: VoiceState, newState: VoiceState) => {
        // Si no hubo cambio de canal de voz, no se hace nada
        if (oldState.channelId === newState.channelId) return;
        const queue = client.player.nodes.get(newState.guild.id);
        if (!queue) return;

        const newChannel = newState.channel;
        // Si el canal no existe o es el mismo canal actual, se ignora
        if (!newChannel || queue.channel?.id === newChannel.id) return;

        try {
            queue.connection?.destroy();
            await queue.connect(newChannel);
            // Actualiza el canal almacenado en los metadatos de la cola
            queue.metadata = { ...(queue.metadata as QueueMetadata), channel: newChannel };
        } catch (err) {
            console.error("Error al reconectar:", err);
        }
    });
}
