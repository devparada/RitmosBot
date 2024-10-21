const { Client, Collection, EmbedBuilder } = require("discord.js");
const dotenv = require("dotenv");
const { REST } = require("@discordjs/rest");
const { Routes, ActivityType } = require("discord-api-types/v9");
const fs = require("fs");
const { DisTube } = require("distube");
//const {SpotifyPlugin} = require("@distube/spotify");
//const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');

dotenv.config();
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [
        "Guilds",
        "GuildVoiceStates"
    ]
});

client.distube = new DisTube(client, {
    //leaveOnFinish: true,
    //searchCooldown: 10,
    //leaveOnEmpty: false,
    //leaveOnStop: true,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    plugins: [
        /*new SpotifyPlugin({
            emitEventsAfterFetching: true
          }),
        new SoundCloudPlugin(),*/
        new YtDlpPlugin()
    ]
});

let commands = [];

// node index.js slash -> para actualizar los slash commands
const LOAD_SLASH = process.argv[2] == "slash";

client.slashcommands = new Collection();

const commandsFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandsFiles) {
    const slashcmd = require(`./commands/${file}`);
    client.slashcommands.set(slashcmd.data.name, slashcmd);
    if (LOAD_SLASH) commands.push(slashcmd.data.toJSON());
}

if (LOAD_SLASH) {
    const rest = new REST({ version: "9" }).setToken(TOKEN);
    console.log("Desplegando comandos slash");
    rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
        .then(() => {
            console.log("Cargados correctamente");
            process.exit(0);
        })
        .catch((err) => {
            console.log(err);
            process.exit(1);
        })
} else {
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

    // <---------------------------- Music Bot --------------------------------------->
    client.distube.on('playSong', (queue, song) => {
        const embed = new EmbedBuilder();
        embed.setColor("Blue").setDescription(`🎶 Reproduciendo: ${song.name} - ${song.formattedDuration} 🎶`);
        queue.textChannel.send({ embeds: [embed] });
    });

    client.on("interactionCreate", (interaction) => {
        async function handleCommand() {
            if (!interaction.isCommand()) return;

            const slashcmd = client.slashcommands.get(interaction.commandName);

            await interaction.deferReply()
            await slashcmd.run({ client, interaction })
        }
        handleCommand();
    })
    client.login(TOKEN);
}
