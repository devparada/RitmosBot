import fs from "node:fs";
import path from "node:path";
import type { ExtendedClient, SlashCommand } from "../types/discord";

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
        const slashcmd: SlashCommand = await import(path.join(commandsPath, file));
        client.slashcommands.set(slashcmd.data.name, slashcmd);
    }
    return client.slashcommands.map((cmd) => cmd.data.toJSON());
}
