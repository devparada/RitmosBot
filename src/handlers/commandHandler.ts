import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { ExtendedClient, SlashCommand } from "../types/discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Escanea la carpeta de comandos e importa cada archivo dinámicamente
 * para registrarlos en la colección del cliente.
 * @param client - Instancia del cliente extendido donde se guardarán los comandos.
 * @returns Un array con la estructura JSON de todos los comandos cargados.
 */
export async function loadCommands(client: ExtendedClient) {
    const commandsPath = path.join(__dirname, "..", "commands");
    const commandsFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

    for (const file of commandsFiles) {
        const filePath = path.join(commandsPath, file);
        const fileUrl = pathToFileURL(filePath).href;

        // Importa el módulo y extrae la propiedad default
        const module = await import(fileUrl);
        const slashcmd: SlashCommand = module.default;

        if (slashcmd?.data) {
            client.slashcommands.set(slashcmd.data.name, slashcmd);
        } else {
            console.warn(`⚠️ El comando en el archivo ${file} no exporta un default válido.`);
        }
}
    return client.slashcommands.map((cmd) => cmd.data.toJSON());
}
