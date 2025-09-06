import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import {
    Client,
    Collection,
    EmbedBuilder,
    GatewayIntentBits,
    Interaction,
    ActivityType,
    VoiceState,
    Colors,
} from "discord.js";
import { Routes, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord-api-types/v10";
import { REST } from "@discordjs/rest";
import { SpotifyExtractor, AttachmentExtractor } from "@discord-player/extractor";
import { YoutubeiExtractor } from "discord-player-youtubei";
import { Track, GuildQueue, Player } from "discord-player";
import playerConfig from "./config/player.config";
import { QueueMetadata } from "./types/types";

// Carga las variables del archivo .env en silencio
dotenv.config({ quiet: true });
const TOKEN = process.env.TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const ENVIRONMENT = process.env.ENVIRONMENT!;
const GUILD_ID = process.env.GUILD_ID!;

interface ExtendedClient extends Client {
    slashcommands: Collection<string, SlashCommand>;
    player: Player;
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
}) as ExtendedClient;

// Inicia y configura el player
const player = new Player(client, playerConfig);

// Registra el reproductor de Youtube, Spotify y Attachment
player.extractors.register(SpotifyExtractor, {});
player.extractors.register(YoutubeiExtractor, {});
player.extractors.register(AttachmentExtractor, {});
client.player = player;

// node index.js slash -> para actualizar los slash commands
const LOAD_SLASH = process.argv[2] === "slash";

interface SlashCommand {
    data: {
        name: string;
        toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
    };
    run: (args: { client: Client; interaction: Interaction }) => Promise<void>;
    autocomplete?: (interacion: Interaction) => Promise<void>;
}

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
client.slashcommands = new Collection<string, SlashCommand>();

const commandsPath = path.join(__dirname, "commands");
const commandsFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

async function loadCommands() {
    for (const file of commandsFiles) {
        const slashcmd = await import(path.join(commandsPath, file));
        client.slashcommands.set(slashcmd.data.name, slashcmd);
        if (LOAD_SLASH) commands.push(slashcmd.data.toJSON());
    }
}

loadCommands();

if (LOAD_SLASH) {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    const deleteCommands = async (entorno: "global" | "local") => {
        const route = await registerCommands(entorno);
        const entornoText = entorno === "global" ? "globales" : "en el servidor de desarrollo";

        try {
            console.log(`Eliminando comandos slash ${entornoText}...`);
            await rest.put(route, { body: [] });
            console.log(`Comandos slash ${entornoText} eliminados.`);
        } catch (error) {
            console.error(`Error al eliminar los comandos slash ${entornoText}:`, error);
        }
    };

    const deployCommands = async (entorno: "global" | "local") => {
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
    };

    const registerCommands = async (entorno: "global" | "local") => {
        const route =
            entorno === "global"
                ? Routes.applicationCommands(CLIENT_ID)
                : Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);

        return route;
    };

    (async () => {
        console.log(`Entorno actual: ${ENVIRONMENT}`);

        if (ENVIRONMENT === "production") {
            await deleteCommands("local");
            await deleteCommands("global");
            await deployCommands("global");
        } else if (ENVIRONMENT === "developer") {
            await deleteCommands("local");
            await deployCommands("local");
        } else {
            console.error("La variable ENVIROMENT debe ser 'developer' o 'production'");
        }
        process.exit(0);
    })();
} else {
    // Cuando el bot está listo
    client.on("clientReady", () => {
        console.log(`Logeado como ${client.user?.tag}`);

        // <---------------------- Presencia Bot ------------------------------------->

        let status = [
            {
                name: "Ritmos",
                type: ActivityType.Listening,
            },
            {
                name: "Ritmos on live",
                type: ActivityType.Listening,
            },
            {
                name: "Music is live",
                type: ActivityType.Listening,
            },
            {
                name: "Music Lofi",
                type: ActivityType.Listening,
            },
        ];

        // 10000 ms = 10 segundos
        setInterval(() => {
            const random = Math.floor(Math.random() * status.length);
            client.user?.setActivity(status[random]);
        }, 10000);
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
                await interaction.respond([]); // Si hay error, responde con nada
            }
        }
    });

    // <-------------------------- Eventos Música Bot ------------------------------------->

    client.on("voiceStateUpdate", async (viejoEstado: VoiceState, nuevoEstado: VoiceState) => {
        if (viejoEstado.channelId !== nuevoEstado.channelId) {
            const queue = player.nodes.get(nuevoEstado.guild.id);
            if (!queue) return;

            const nuevoCanal = nuevoEstado.channel;
            if (!nuevoCanal || queue.channel?.id === nuevoCanal.id) return;

            try {
                // Desconecta la conexión anterior (sin destruir la cola)
                queue.connection?.destroy();
                await queue.connect(nuevoCanal);

                // Actualiza el canal asociado a la cola
                queue.metadata = { ...(queue.metadata as QueueMetadata), channel: nuevoCanal };
            } catch (error) {
                console.log("Error al reconectar: " + error);
            }
        }
    });

    let lastTrackId: string | null = null;

    client.player.events.on("playerStart", async (queue: GuildQueue, track: Track) => {
        const embed = new EmbedBuilder();
        const metadata = queue.metadata as QueueMetadata;
        const textChannel = metadata.channel;

        // Verifica si la canción que se está reproduciéndose es distinta
        if (lastTrackId !== track.id) {
            lastTrackId = track.id;

            let urlThumbnail = "https://i.imgur.com/yd01iL2.jpeg";
            let descripcion = `🎶 Reproduciendo: **${track.title}** `;

            const urlsValidas = [
                "https://youtube.com/",
                "https://www.youtube.com/",
                "https://m.youtube.com/",
                "https://open.spotify.com/",
                "https://play.spotify.com/",
            ];

            // Comprueba si el video o música es de Youtube o Spotify
            const videoURLValido = urlsValidas.some((urlEmpieza) => track.url.startsWith(urlEmpieza));

            // Si la canción no tiene miniatura se utiliza una miniatura por defecto y una descripción distinta
            if (track.thumbnail && videoURLValido) {
                urlThumbnail = track.thumbnail;
                descripcion += `de **${track.author}** 🎶`;
            } else {
                descripcion += track.requestedBy ? `subido por **${track.requestedBy.username}** 🎶` : "";
            }
            embed.setColor(Colors.Blue).setThumbnail(urlThumbnail).setDescription(descripcion);
            await textChannel.send({ embeds: [embed] });
        }
    });

    client.player.events.on("playerFinish", () => {
        lastTrackId = null;
    });

    client.login(TOKEN);
}
