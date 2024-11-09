const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Mide la latencia del bot y de la API de Discord"),

    run: async ({ interaction }) => {
        const fecha = Date.now();
        await interaction.reply("🏓 Pong! Calculando latencia...");

        const botLatencia = Date.now() - fecha;
        const apiLatencia = interaction.client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("🏓 Pong!")
            .setDescription("Tiempos de respuesta:")
            .addFields(
                { name: "Latencia del bot", value: `${botLatencia}ms`, inline: true },
                { name: "Latencia de la API", value: `${apiLatencia}ms`, inline: true }
            )

        await interaction.editReply({ content: null, embeds: [embed] });
    }
}
