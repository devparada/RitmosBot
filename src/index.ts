import { Client, Collection, GatewayIntentBits } from "discord.js";
import { LavalinkManager } from "lavalink-client";

// Importaciones de configuración y utilidades
import { connectMongo } from "@/config/db";
//import playerConfig from "@/config/player.config";
import { getEnvVar } from "@/utils/env";

// Handlers y Tipos
import { loadCommands } from "./handlers/commandHandler";
import { loadEvents } from "./handlers/eventHandler";
import type { ExtendedClient } from "./types/discord";

/**
 * Configuración del Cliente de Discord
 */
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
}) as ExtendedClient;

// 1. Configurar LavalinkManager
const lavalink = new LavalinkManager({
    nodes: [
        {
            host: getEnvVar("LAVALINK_HOST", "lavalink"),
            port: Number(getEnvVar("LAVALINK_PORT", "2333")),
            authorization: getEnvVar("LAVALINK_PASSWORD", "password"),
            secure: getEnvVar("LAVALINK_SECURE", "false") === "true",
            retryAmount: Number(getEnvVar("LAVALINK_RETRY_AMOUNT", "5")),
            retryDelay: Number(getEnvVar("LAVALINK_RETRY_DELAY", "5000")),
        },
    ],
    sendToShard: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        guild?.shard?.send(payload);
    },
    playerOptions: {
        clientBasedPositionUpdateInterval: 150,
        defaultSearchPlatform: "ytmsearch",
    },
});

client.lavalink = lavalink;
client.slashcommands = new Collection();

// 2. Eventos de Lavalink
client.lavalink.nodeManager.on("connect", (node) => {
    console.log(`NODO LAVALINK CONECTADO: ${node.id}`);
});

client.lavalink.nodeManager.on("error", (node, error) => {
    console.log(`ERROR EN NODO LAVALINK ${node.id}:`, error.message);
});

// 3. Evento RAW (El puente de voz)
client.on("raw", (d) => client.lavalink.sendRawData(d));

// 4. Evento Ready mejorado
client.on("ready", async (readyClient) => {
    console.log(`Logeado como ${readyClient.user.tag}`);

    try {
        // Inicializamos lavalink UNA VEZ el cliente está listo
        await client.lavalink.init({
            id: readyClient.user.id,
            username: readyClient.user.username,
        });
        console.log("LavalinkManager iniciado correctamente.");
    } catch (err) {
        console.error("Error iniciando LavalinkManager:", err);
    }
});

// 5. Función de inicio
async function start() {
    try {
        // Cargamos los comandos desde el sistema de archivos
        const commandsData = await loadCommands(client);

        // Modo Despliegue: Si se pasa el argumento "slash", registra comandos y cierra
        if (process.argv[2] === "slash") {
            const { handleDeployment } = await import("./scripts/deploy");
            await handleDeployment(commandsData);
            process.exit(0);
        }

        // Cargamos todos los eventos (Discord, Player y Voz)
        await loadEvents(client);
        // Conexión a la Base de Datos y login del bot
        await connectMongo();

        await client.login(getEnvVar("TOKEN"));
    } catch (error) {
        console.error("Error crítico durante el arranque:", error);
        process.exit(1);
    }
}

// Arrancar la aplicación
start();
