import type { TextChannel } from "discord.js";

/**
 * Este tipo es para la metadata que guarda cada cola de música.
 * Básicamente, lo que nos interesa aquí es el canal de texto donde
 * vamos a mandar los mensajes sobre la música que está sonando,
 * avisos, comandos y demás cosas del bot.
 */
export type QueueMetadata = {
    channel: TextChannel;
};

/**
 * Representa las canciones de una playlist:
 * clave = nombre de la canción, valor = URL de la canción
 */
export type PlaylistTracks = Record<string, string>;

/**
 * Documento de playlists en Mongo:
 * - Contiene el serverId del servidor de Discord
 * - Claves dinámicas para cada playlist con sus canciones
 *   (el índice acepta `string | undefined` para no generar conflicto con serverId u otras claves fijas)
 */
export interface ServerPlaylistsDoc {
    serverId: string;
    [playlistName: string]: PlaylistTracks | string | undefined;
}
