const discord = require("discord.js");
const client = new discord.Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "MessageContent"
    ]
});

client.on("ready", client => {
    console.log("Bot is ONLINE!");
})

client.login("");
