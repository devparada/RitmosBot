const Discord = require("discord.js");
const dotenv = require("dotenv");
const { REST } = require("@discordjs/rest");
const { Routes, ActivityType } = require("discord-api-types/v9");
const fs = require("fs");
const { Player } = require("discord-player");

dotenv.config();
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Discord.Client({
    intents: [
        "Guilds",
        "GuildVoiceStates"
    ]
});

const LOAD_SLASH = process.argv[2] == "slash";

client.slashcommands = new Discord.Collection();
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25
    }
});

let commands = [];

const slashFiles = fs.readdirSync("./slash").filter(file => file.endsWith(".js"));
for (const file of slashFiles) {
    const slashcmd = require(`./slash/${file}`);
    client.slashcommands.set(slashcmd.data.name, slashcmd);
    if (LOAD_SLASH) commands.push(slashcmd.data.toJSON());
}

if (LOAD_SLASH) {
    const rest = new REST({ version: "9" }).setToken(TOKEN);
    console.log("Deploying slash commands");
    rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
        .then(() => {
            console.log("Succesfully loaded");
            process.exit(0);
        })
        .catch((err) => {
            console.log(err);
            process.exit(1);
        })
} else {
    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}`);

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
            if (!slashcmd) interaction.reply("Not a valid slash command");

            await interaction.deferReply()
            await slashcmd.run({ client, interaction })
        }
        handleCommand();
    })
    client.login(TOKEN);
}
