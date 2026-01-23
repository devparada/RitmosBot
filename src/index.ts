import { AttachmentExtractor, SpotifyExtractor } from "@discord-player/extractor";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { Player } from "discord-player";
import { YoutubeSabrExtractor } from "discord-player-googlevideo";
import dotenv from "dotenv";

// Importaciones de configuración y utilidades
import { connectMongo } from "@/config/db";
import playerConfig from "@/config/player.config";
import { getEnvVar } from "@/utils/env";

// Handlers y Tipos
import { loadCommands } from "./handlers/commandHandler";
import { loadEvents } from "./handlers/eventHandler";
import type { ExtendedClient } from "./types/discord";

// Inicializar variables de entorno
dotenv.config({ quiet: true });

/**
 * Configuración del Cliente de Discord
 */
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
}) as ExtendedClient;

/**
 * Configuración del Reproductor (Discord Player)
 */
const player = new Player(client, playerConfig);

// Registro de extractores de música
player.extractors.register(SpotifyExtractor, {});
player.extractors.register(YoutubeSabrExtractor, {
    disableAdaptiveBitrate: true,
    highWaterMark: 1 << 25,
});
player.extractors.register(AttachmentExtractor, {});

// Adjuntar instancias al cliente para acceso global
client.player = player;
client.slashcommands = new Collection();

/**
 * Función principal de arranque
 */
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
