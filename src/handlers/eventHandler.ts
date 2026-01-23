import { ActivityType, type Interaction } from "discord.js";
import { playerEvents } from "../events/player";
import { voiceEvent } from "../events/voice";
import type { ExtendedClient } from "../types/discord";

export async function loadEvents(client: ExtendedClient) {
    /**
     * Se ejecuta cuando el bot se conecta exitosamente.
     */
    client.on("clientReady", () => {
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
        }, 10000);
    });

    /**
     * Maneja la ejecución de comandos y el autocompletado.
     */
    client.on("interactionCreate", async (interaction: Interaction) => {
        // Manejo de Comandos Slash
        if (interaction.isChatInputCommand()) {
            const slashcmd = client.slashcommands.get(interaction.commandName);
            if (!slashcmd) return;

            try {
                await slashcmd.run({ client, interaction });
            } catch (error) {
                console.error("Error al ejecutar el comando:", error);
            }
        }

        // Manejo de Autocompletado
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

    playerEvents(client.player);
    voiceEvent(client);
}
