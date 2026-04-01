import type { Client, User } from "discord.js";

/**
 * Representa la información detallada de una pista de Lavalink
 */
export interface LavalinkTrack {
    info: {
        title: string;
        uri: string;
        author: string;
        length: number;
        identifier: string;
        isStream: boolean;
        isSeekable: boolean;
    };
    pluginInfo: Record<string, unknown>;
    userData: Record<string, unknown>;
}

/**
 * Define la estructura de un nodo de Lavalink y sus métodos de búsqueda
 */
export interface LavalinkNode {
    connected: boolean;
    search: (
        query: string,
        user: User,
    ) => Promise<{
        loadType: string;
        tracks: LavalinkTrack[];
        playlist?: { name: string; tracks: LavalinkTrack[] };
    }>;
}

/**
 * Extensión del cliente de Discord para incluir el gestor de Lavalink
 */
export interface CustomClient extends Client {
    lavalink: {
        nodeManager: {
            leastUsedNodes: (status: "playingPlayers" | "all") => LavalinkNode[];
        };
    };
}
