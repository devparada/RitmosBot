const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Mide la latencia del bot"),

    run: async ({ interaction }) => {
        const fecha = Date.now();
        await interaction.reply("🏓 Pong!");

        const latencia = Date.now() - fecha;
        await interaction.editReply(`🏓 Pong! Latencia: ${latencia}ms`);
    }
}
