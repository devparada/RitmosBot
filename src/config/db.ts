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
 */
export async function connectMongo(): Promise<void> {
    if (isConnected || !mongoClient) return;

    if (!connectionPromise) {
        connectionPromise = (async () => {
            try {
                await mongoClient.connect();
                isConnected = true;
                console.log("Conectado a MongoDB");
            } catch (err) {
                console.error("No se pudo conectar a MongoDB. El bot funciona sin base de datos: ", err);
                isConnected = false;
            }
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
