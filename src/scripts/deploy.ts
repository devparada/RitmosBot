import { REST, type RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from "discord.js";
import { getEnvVar } from "@/utils/env";

/**
 * Función encargada de registrar los Slash Commands en la API de Discord.
 * @param commands - Lista de comandos en formato JSON listos para ser enviados.
 */
export async function handleDeployment(commands: RESTPostAPIChatInputApplicationCommandsJSONBody[]) {
    const TOKEN = getEnvVar("TOKEN");
    const CLIENT_ID = getEnvVar("CLIENT_ID");
    const GUILD_ID = getEnvVar("GUILD_ID");
    const ENVIRONMENT = getEnvVar("ENVIRONMENT");

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    try {
        console.log(`Entorno detectado: ${ENVIRONMENT}`);

        if (ENVIRONMENT === "production") {
            console.log("Registrando comandos globales...");
            await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        } else {
            console.log("Registrando comandos locales (Guild ID)...");
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        }

        console.log("Comandos desplegados correctamente.");
    } catch (error) {
        console.error("Error en el despliegue:", error);
    }
}
