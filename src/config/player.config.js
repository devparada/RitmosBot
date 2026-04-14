// Este módulo se encarga de configurar el Player
import { getEnvVar } from "@/utils/env";

const playerConfig = {
    /**
     * Shoukaku espera un array de objetos para los nodos.
     * Nota: Shoukaku NO usa una propiedad 'url' completa,
     * usa 'url' (host:port) o separa 'host' y 'port'.
     */
    getNodes: () => [
        {
            name: getEnvVar("LAVALINK_NAME", "Principal"),
            url: `${getEnvVar("LAVALINK_HOST", "lavalink")}:${getEnvVar("LAVALINK_PORT", "2333")}`,
            auth: getEnvVar("LAVALINK_PASSWORD", "password"),
            secure: getEnvVar("LAVALINK_SECURE", "false") === "true",
        },
    ],

    /**
     * Opciones del Gestor de Shoukaku
     */
    getShoukakuOptions: () => ({
        moveOnDisconnect: false,
        resumable: false,
        resumableTimeout: 60,
        reconnectTries: 2,
        restTimeout: 10000,
    }),
};

export default playerConfig;
