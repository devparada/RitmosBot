import fs from "node:fs";
import path from "node:path";
import { AttachmentExtractor, SpotifyExtractor } from "@discord-player/extractor";
import { REST } from "@discordjs/rest";
import { ActivityType, Client, Collection, GatewayIntentBits, type Interaction } from "discord.js";
import { type RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord-api-types/v10";
import { Player } from "discord-player";
import { YoutubeSabrExtractor } from "discord-player-googlevideo";
import dotenv from "dotenv";
import { connectMongo } from "@/config/db";
import playerConfig from "@/config/player.config";
import { getEnvVar } from "@/utils/env";
import { playerEvents } from "./events/player";
import { voiceEvent } from "./events/voice";

// ------------------- Configuración y Variables de Entorno -------------------

dotenv.config({ quiet: true });

const TOKEN = getEnvVar("TOKEN");
const CLIENT_ID = getEnvVar("CLIENT_ID");
const ENVIRONMENT = getEnvVar("ENVIRONMENT");
const GUILD_ID = getEnvVar("GUILD_ID");

const LOAD_SLASH = process.argv[2] === "slash";

// ------------------- Interfaces -------------------

interface SlashCommand {
    data: {
        name: string;
        toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
    };
    run: (args: { client: Client; interaction: Interaction }) => Promise<void>;
    autocomplete?: (interaction: Interaction) => Promise<void>;
}

interface ExtendedClient extends Client {
    slashcommands: Collection<string, SlashCommand>;
    player: Player;
}

// ------------------- Inicialización del Cliente y Player -------------------

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
}) as ExtendedClient;

const player = new Player(client, playerConfig);

player.extractors.register(SpotifyExtractor, {});
player.extractors.register(YoutubeSabrExtractor, {
    disableAdaptiveBitrate: true,
    highWaterMark: 1 << 25,
});
player.extractors.register(AttachmentExtractor, {});

client.player = player;
client.slashcommands = new Collection<string, SlashCommand>();

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

const commandsPath = path.join(__dirname, "commands");
const commandsFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

// ------------------- Funciones de Comandos -------------------

async function loadCommands() {
    await Promise.all(
        commandsFiles.map(async (file) => {
            const slashcmd: SlashCommand = await import(path.join(commandsPath, file));
            client.slashcommands.set(slashcmd.data.name, slashcmd);

            if (LOAD_SLASH) {
                commands.push(slashcmd.data.toJSON());
            }
        }),
    );
}

async function registerCommands(entorno: "global" | "local") {
    return entorno === "global"
        ? Routes.applicationCommands(CLIENT_ID)
        : Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);
}

async function deleteCommands(entorno: "global" | "local", rest: REST) {
    const route = await registerCommands(entorno);
    const entornoText = entorno === "global" ? "globales" : "en el servidor de desarrollo";

    try {
        console.log(`Eliminando comandos slash ${entornoText}...`);
        await rest.put(route, { body: [] });
        console.log(`Comandos slash ${entornoText} eliminados.`);
    } catch (error) {
        console.error(`Error al eliminar los comandos slash ${entornoText}:`, error);
    }
}

async function deployCommands(entorno: "global" | "local", rest: REST) {
    const route = await registerCommands(entorno);
    const entornoText = entorno === "global" ? "globales" : "en el servidor de desarrollo";

    try {
        console.log(`Desplegando comandos slash ${entornoText}...`);
        await rest.put(route, { body: commands });
        console.log(`Comandos slash ${entornoText} desplegados correctamente.`);
    } catch (error) {
        console.error(`Error al desplegar los comandos slash ${entornoText}:`, error);
        process.exit(1);
    }
}

async function initCommands() {
    console.log(`Entorno actual: ${ENVIRONMENT}`);

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    if (ENVIRONMENT === "production") {
        await deleteCommands("local", rest);
        await deleteCommands("global", rest);
        await deployCommands("global", rest);
    } else if (ENVIRONMENT === "developer") {
        await deleteCommands("local", rest);
        await deployCommands("local", rest);
    } else {
        console.error("La variable ENVIRONMENT debe ser 'developer' o 'production'");
    }

    process.exit(0);
}

// ------------------- Main -------------------

(async () => {
    await loadCommands();

    if (LOAD_SLASH) {
        await initCommands();
        return;
    }

    // ------------------- Eventos del Bot -------------------

    client.on("clientReady", () => {
        console.log(`Logeado como ${client.user?.tag}`);
        connectMongo();

        (async function rotateStatus() {
            const status = [
                { name: "Ritmos", type: ActivityType.Listening },
                { name: "Ritmos on live", type: ActivityType.Listening },
                { name: "Music is live", type: ActivityType.Listening },
                { name: "Music Lofi", type: ActivityType.Listening },
            ];

            let i = 0;
            while (true) {
                client.user?.setActivity(status[i]);
                i = (i + 1) % status.length;
                await new Promise((res) => setTimeout(res, 10000));
            }
        })();
    });

    client.on("interactionCreate", async (interaction) => {
        if (interaction.isCommand()) {
            const slashcmd = client.slashcommands.get(interaction.commandName);
            if (!slashcmd) return;

            try {
                await slashcmd.run({ client, interaction });
            } catch (error) {
                console.error("Error al ejecutar el comando:", error);
            }
        }

        if (interaction.isAutocomplete()) {
            const command = client.slashcommands.get(interaction.commandName);

            try {
                await command?.autocomplete?.(interaction);
            } catch (error) {
                console.error(`Error en el autocompletado de ${interaction.commandName}:`, error);
                await interaction.respond([]);
            }
        }
    });

    playerEvents(player);
    voiceEvent(client);

    client.login(TOKEN);
})();
