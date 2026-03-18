// Este módulo se encarga de configurar el Player
import { getEnvVar } from "@/utils/env.ts";

const playerConfig = {
    /**
     * @returns {import("lavalink-client").NodeOptions[]}
     */
    getNodes: () => [
        {
            host: getEnvVar("LAVALINK_HOST", "lavalink"),
            port: Number(getEnvVar("LAVALINK_PORT", "2333")),
            authorization: getEnvVar("LAVALINK_PASSWORD", "password"),
            secure: getEnvVar("LAVALINK_SECURE", "false") === "true",
            retryAmount: Number(getEnvVar("LAVALINK_RETRY_AMOUNT", "5")),
            retryDelay: Number(getEnvVar("LAVALINK_RETRY_DELAY", "5000")),
        },
    ],

    /**
     * @returns {import("lavalink-client").ManagerPlayerOptions}
     */
    getPlayerOptions: () => ({
        clientBasedPositionUpdateInterval: 150,
        defaultSearchPlatform: "ytmsearch",
        defaultVolume: 90,
    }),
};

export default playerConfig;
