const { Client, Collection, EmbedBuilder } = require("discord.js");
const dotenv = require("dotenv");
const { REST } = require("@discordjs/rest");
const { Routes, ActivityType } = require("discord-api-types/v9");
const fs = require("fs");
const { Player } = require('discord-player');
const { YoutubeiExtractor } = require("discord-player-youtubei");
const { SpotifyExtractor } = require("@discord-player/extractor");

// Carga las variables del archivo .env
dotenv.config();
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const ENVIRONMENT = process.env.ENVIRONMENT;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [
        "Guilds",
        "GuildVoiceStates"
    ]
});

// Inicia el player
const player = new Player(client);

// Registra el reproductor de Youtube y Spotify
player.extractors.register(SpotifyExtractor, {});
player.extractors.register(YoutubeiExtractor, {})
client.player = player;

// node index.js slash -> para actualizar los slash commands
const LOAD_SLASH = process.argv[2] == "slash";

let commands = [];
client.slashcommands = new Collection();

const commandsFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandsFiles) {
    const slashcmd = require(`./commands/${file}`);
    client.slashcommands.set(slashcmd.data.name, slashcmd);
    if (LOAD_SLASH) commands.push(slashcmd.data.toJSON());
}

if (LOAD_SLASH) {
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    console.log(ENVIRONMENT);

    (async () => {
        try {
            console.log(`Entorno actual: ${ENVIRONMENT}`);

            if (ENVIRONMENT == "production") {
                try {
                    console.log('Eliminando todos los comandos slash globales...');
                    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
                    console.log('Comandos slash globales eliminados.');
                } catch (error) {
                    console.error(error);
                }

                console.log("Desplegando comandos slash a nivel de servidor");

                rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
                    .then(() => {
                        console.log("Cargados correctamente");
                        process.exit(0);
                    })
                    .catch((error) => {
                        console.log(error);
                        process.exit(1);
                    })
            } else if (ENVIRONMENT == "developer") {
                rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] })
                    .then(() => console.log('Comandos slash en el servidor de desarrollo eliminados.'))
                    .catch(console.error);

                console.log("Desplegando comandos slash en el servidor de desarrollo");

                rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
                    .then(() => {
                        console.log("Cargados correctamente");
                        process.exit(0);
                    })
                    .catch((error) => {
                        console.log(error);
                        process.exit(1);
                    })
            } else {
                console.log("Es necesario que la variable .env ENVIRONMENT tenga o developer o production");
            }
        } catch (error) {
            console.log(error);
        }
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
            }
        ]

        // 10000 ms = 10 segundos
        setInterval(() => {
            let random = Math.floor(Math.random() * status.length);
            client.user.setActivity(status[random]);
        }, 10000);
    });

    client.on("interactionCreate", (interaction) => {
        async function handleCommand() {
            if (!interaction.isCommand()) return;

            const slashcmd = client.slashcommands.get(interaction.commandName);
            await slashcmd.run({ client, interaction })
        }
        handleCommand();
    })

    // <-------------------------- Eventos Música Bot ------------------------------------->

    client.player.events.on('playerStart', async (queue, track) => {
        const embed = new EmbedBuilder();
        const textChannel = queue.metadata.channel;
        embed.setColor("Blue").setDescription(`🎶 Reproduciendo: **${track.title}** 🎶`);
        await textChannel.send({ embeds: [embed], ephemeral: true });
    });

    client.login(TOKEN);
}
