import { Client, Collection, GatewayIntentBits } from "discord.js";
import { Kazagumo } from "kazagumo";
import Spotify from "kazagumo-spotify";
import { Connectors } from "shoukaku";

// Importaciones de configuración y utilidades
import { connectMongo } from "@/config/db";
import { getEnvVar } from "@/utils/env";
import playerConfig from "./config/player.config";

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
const kazagumo = new Kazagumo(
    {
        defaultSearchEngine: "youtube",
        send: (guildId, payload) => {
            client.guilds.cache.get(guildId)?.shard.send(payload);
        },
        plugins: [
            new Spotify({
                clientId: "",
                clientSecret: "",
                playlistPageLimit: 2,
                albumPageLimit: 2,
                searchMarket: "ES",
            }),
        ],
    },
    new Connectors.DiscordJS(client),
    playerConfig.getNodes(),
);

client.lavalink = kazagumo;
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
