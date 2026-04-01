import { ActivityType, type Interaction } from "discord.js";
import { playerEvents } from "../events/playerEvents";
import type { ExtendedClient } from "../types/discord";

export async function loadEvents(client: ExtendedClient) {
    /**
     * Se ejecuta cuando el bot se conecta exitosamente.
     */
    client.on("clientReady", async (readyClient) => {
        console.log(`Logeado como ${client.user?.tag}`);

        // Iniciamos el estado rotativo
        const status = [
            { name: "Ritmos", type: ActivityType.Listening },
            { name: "Ritmos on live", type: ActivityType.Listening },
            { name: "Music is live", type: ActivityType.Listening },
            { name: "Music Lofi", type: ActivityType.Listening },
        ];

        let i = 0;
        setInterval(() => {
            client.user?.setActivity(status[i]);
            i = (i + 1) % status.length;
        }, 30000);

        try {
            // Inicializamos lavalink UNA VEZ el cliente está listo
            await client.lavalink.init({
                id: readyClient.user.id,
                username: readyClient.user.username,
            });
            console.log("LavalinkManager iniciado correctamente.");
        } catch (err) {
            console.error("Error iniciando LavalinkManager:", err);
        }
    });

    client.on("raw", (d) => client.lavalink.sendRawData(d));

    playerEvents(client);

    /**
     * Maneja la ejecución de comandos y el autocompletado.
     */
    client.on("interactionCreate", async (interaction: Interaction) => {
        // --- Manejo de Comandos Slash ---
        if (interaction.isChatInputCommand()) {
            await interaction.deferReply();
            const slashcmd = client.slashcommands.get(interaction.commandName);
            if (!slashcmd) return;

            try {
                await slashcmd.run({ client, interaction });
            } catch (error) {
                console.error("Error al ejecutar el comando:", error);
            }
        }

        // --- Manejo de Autocompletado ---
        if (interaction.isAutocomplete()) {
            const command = client.slashcommands.get(interaction.commandName);
            try {
                await command?.autocomplete?.(interaction);
            } catch (error) {
                console.error(`Error en autocompletado de ${interaction.commandName}:`, error);
                await interaction.respond([]);
            }
        }
    });
}
