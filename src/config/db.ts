import { type Collection, MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGO_INITDB_DATABASE;

if (!MONGO_URI) {
    console.error("MONGODB_URI no definido en variables de entorno");
}

export const mongoClient = MONGO_URI ? new MongoClient(MONGO_URI) : null;

let connectionPromise: Promise<void> | null = null;
let isConnected = false;

/**
 * Establece la conexión con MongoDB.
 * Utiliza un patrón de singleton con promesa para evitar múltiples intentos de conexión simultáneos.
 * Si no se ha configurado la URL, la función finaliza y el bot operará con las funcionalidades de DB desactivadas.
 * En caso de fallo, reintenta la conexión hasta 10 veces con 5 segundos de espera entre intentos.
 */
export async function connectMongo(): Promise<void> {
    if (isConnected || !mongoClient) return;

    if (!connectionPromise) {
        connectionPromise = (async () => {
            const MAX_RETRIES = 10;
            const RETRY_DELAY_MS = 5000;

            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    await mongoClient.connect();
                    isConnected = true;
                    console.log("Conectado a MongoDB");
                    return;
                } catch (err) {
                    console.error(`Intento ${attempt}/${MAX_RETRIES} fallido al conectar a MongoDB:`, (err as Error).message);
                    if (attempt < MAX_RETRIES) {
                        console.log(`Reintentando en ${RETRY_DELAY_MS / 1000}s...`);
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                    }
                }
            }

            console.error("No se pudo conectar a MongoDB tras todos los intentos. El bot funciona sin base de datos.");
            isConnected = false;
            connectionPromise = null; // Permite futuros reintentos si se llama de nuevo
        })();
    }
    return connectionPromise;
}

/**
 * Obtiene la referencia a la colección de playlists.
 * @returns La colección si hay conexión establecida, o null si la conexión no está activa o no fue configurada.
 */
export function getPlaylists(): Collection | null {
    if (!isConnected || !mongoClient) return null;
    return mongoClient.db(MONGO_DB).collection("playlists");
}
