import type { Client, Collection, Interaction } from "discord.js";
import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord-api-types/v10";
import type { Player } from "discord-player";

/**
 * Define la estructura estándar para cualquier comando de barra (Slash Command).
 * Cada archivo en la carpeta /commands debe exportar un objeto que cumpla esta interfaz.
 */
export interface SlashCommand {
    data: {
        name: string;
        toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
    };
    run: (args: { client: Client; interaction: Interaction }) => Promise<void>;
    autocomplete?: (interaction: Interaction) => Promise<void>;
}

/**
 * Extensión del Cliente nativo de Discord.js.
 * Se utiliza para inyectar propiedades personalizadas que necesitamos en el bot
 * sin recurrir a variables globales.
 */
export interface ExtendedClient extends Client {
    slashcommands: Collection<string, SlashCommand>;
    player: Player;
}
