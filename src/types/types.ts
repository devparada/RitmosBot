import { TextChannel } from "discord.js";

/**
 * Este tipo es para la metadata que guarda cada cola de música.
 * Básicamente, lo que nos interesa aquí es el canal de texto donde
 * vamos a mandar los mensajes sobre la música que está sonando,
 * avisos, comandos y demás cosas del bot.
 *
 * Así evitamos usar "any" y nuestro código queda más limpio y fácil de entender.
 * Además, nos ayuda a saber siempre qué tipo de datos esperamos.
 */
export type QueueMetadata = {
    channel: TextChannel;
};
