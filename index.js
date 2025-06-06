const { Client, Collection, EmbedBuilder } = require("discord.js");
const dotenv = require("dotenv");
const { REST } = require("@discordjs/rest");
const { Routes, ActivityType } = require("discord-api-types/v9");
const fs = require("fs");
const { Player } = require("discord-player");
const { YoutubeiExtractor } = require("discord-player-youtubei");
const { SpotifyExtractor, AttachmentExtractor } = require("@discord-player/extractor");

// Carga las variables del archivo .env
dotenv.config();
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const ENVIRONMENT = process.env.ENVIRONMENT;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: ["Guilds", "GuildVoiceStates"],
});

// Inicia y configura el player
const player = new Player(client, {
    connectionTimeout: 30000,
    smoothVolume: true,
});

// Registra el reproductor de Youtube, Spotify y Attachment
player.extractors.register(SpotifyExtractor);
player.extractors.register(YoutubeiExtractor);
player.extractors.register(AttachmentExtractor);
client.player = player;

// node index.js slash -> para actualizar los slash commands
const LOAD_SLASH = process.argv[2] === "slash";

let commands = [];
client.slashcommands = new Collection();

const commandsFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));
for (const file of commandsFiles) {
    const slashcmd = require(`./commands/${file}`);
    client.slashcommands.set(slashcmd.data.name, slashcmd);
    if (LOAD_SLASH) commands.push(slashcmd.data.toJSON());
}

if (LOAD_SLASH) {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    (async () => {
        console.log(`Entorno actual: ${ENVIRONMENT}`);

        if (ENVIRONMENT === "production") {
            try {
                console.log("Eliminando todos los comandos slash en el servidor de desarrollo...");
                await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
                console.log("Comandos slash en el servidor de desarrollo eliminados.");
            } catch (error) {
                console.error("Error al eliminar los comandos slash en el servidor de desarrollo:", error);
            }
            try {
                console.log("Eliminando todos los comandos slash globales...");
                await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
                console.log("Comandos slash globales eliminados");
            } catch (error) {
                console.error("Error al eliminar los comandos slash globales:", error);
            }

            try {
                console.log("Desplegando comandos slash globales...");
                await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
                console.log("Comandos slash globales desplegados correctamente");
            } catch (error) {
                console.error("Error al desplegar los comandos slash globales:", error);
                process.exit(1);
            }
        } else if (ENVIRONMENT === "developer") {
            try {
                console.log("Eliminando todos los comandos slash en el servidor de desarrollo...");
                await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
                console.log("Comandos slash en el servidor de desarrollo eliminados");
            } catch (error) {
                console.error("Error al eliminar los comandos slash en el servidor de desarrollo:", error);
            }

            try {
                console.log("Desplegando comandos slash en el servidor de desarrollo...");
                await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
                console.log("Comandos slash desplegados en el servidor de desarrollo correctamente");
            } catch (error) {
                console.error("Error al desplegar los comandos slash en el servidor de desarrollo:", error);
                process.exit(1);
            }
        } else {
            console.log("Es necesario que la variable .env ENVIRONMENT tenga o developer o production");
            process.exit(1);
        }
        process.exit(0);
    })();
} else {
    // Cuando el bot está listo
    client.on("ready", () => {
        console.log(`Logeado como ${client.user.tag}`);

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
            let random = Math.floor(Math.random() * status.length);
            client.user.setActivity(status[random]);
        }, 10000);
    });

    client.on("interactionCreate", async (interaction) => {
        if (interaction.isCommand()) {
            const slashcmd = client.slashcommands.get(interaction.commandName);

            try {
                await slashcmd.run({ client, interaction });
            } catch (error) {
                console.error("Error al ejecutar el comando:", error);
            }
        }

        if (interaction.isAutocomplete()) {
            const command = client.slashcommands.get(interaction.commandName);

            try {
                if (command.autocomplete) {
                    await command.autocomplete(interaction);
                }
            } catch (error) {
                console.error("Error en el autocompletado:", error);
                await interaction.respond([]); // Si hay error, responde con nada
            }
        }
    });

    // <-------------------------- Eventos Música Bot ------------------------------------->

    client.on("voiceStateUpdate", async (nuevoEstado) => {
        // Verifica que el bot está conectado y que la cola tiene una conexión
        const currentQueue = player.nodes.get(nuevoEstado.guild.id);
        if (!currentQueue || !currentQueue.connection || !currentQueue.connection.channel) return;
        try {
            await currentQueue.connect(nuevoEstado.channel);
        } catch (error) {
            console.log("Error al reconectar: " + error);
        }
    });

    let lastTrackId = null;

    client.player.events.on("playerStart", async (queue, track) => {
        const embed = new EmbedBuilder();
        const textChannel = queue.metadata.channel;

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
                descripcion += `subido por **${track.requestedBy.username}** 🎶`;
            }
            embed.setColor("Blue").setThumbnail(urlThumbnail).setDescription(descripcion);
            await textChannel.send({ embeds: [embed] });
        }
    });

    client.player.events.on("trackEnd", () => {
        lastTrackId = null;
    });

    client.login(TOKEN);
}
