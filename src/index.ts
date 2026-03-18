import { Client, Collection, GatewayIntentBits } from "discord.js";
import { LavalinkManager } from "lavalink-client";

// Importaciones de configuración y utilidades
import { connectMongo } from "@/config/db";
import playerConfig from "./config/player.config";
import { getEnvVar } from "@/utils/env";

// Handlers y Tipos
import { loadEvents } from "./handlers/clientHandler";
import { loadCommands } from "./handlers/commandHandler";
import type { ExtendedClient } from "./types/discord";

/**
 * Configuración del Cliente de Discord
 */
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
}) as ExtendedClient;

// Configurar LavalinkManager
const lavalink = new LavalinkManager({
    nodes: playerConfig.getNodes(),
    playerOptions: playerConfig.getPlayerOptions(),
    sendToShard: (guildId, payload) => {
        client.guilds.cache.get(guildId)?.shard.send(payload);
    },
});

client.lavalink = lavalink;
client.slashcommands = new Collection();

// Función de inicio
async function start() {
    try {
        // Cargamos los comandos desde el sistema de archivos
        const commandsData = await loadCommands(client);

        // Modo Despliegue: Si se pasa el argumento "slash", registra comandos y cierra
        if (process.argv[2] === "slash") {
            const { handleDeployment } = await import("./scripts/deploy");
            await handleDeployment(commandsData);
            return setTimeout(() => process.exit(0), 200);
        }

        // Cargamos todos los eventos (Discord, Player y Voz)
        await loadEvents(client);
        // Conexión a la Base de Datos
        await connectMongo();

        await client.login(getEnvVar("TOKEN"));
    } catch (error) {
        console.error("Error crítico durante el arranque:", error);
        process.exit(1);
    }
}

// Arrancar la aplicación
start();
