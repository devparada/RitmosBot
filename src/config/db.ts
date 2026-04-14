import { type Collection, MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGO_INITDB_DATABASE;
export const mongoClient = MONGO_URI ? new MongoClient(MONGO_URI) : null;

let connected = false;

/**
 * Conecta a la base de datos de MongoDB
 * @returns Si no se ha configurado la URL de MongoDB, retorna null y el bot funciona sin base de datos
 */
export async function connectMongo(): Promise<void> {
    if (!mongoClient || connected) return;
    try {
        await mongoClient.connect();
        connected = true;
        console.log("Conectado a MongoDB");
    } catch (err) {
        console.error("No se pudo conectar a MongoDB. El bot funciona sin base de datos: ", err);
    }
}

/**
 * Muestra la colección de playlists de MongoDB
 * @returns Si no se ha conectado a MongoDB, devuelve null
 */
export function getPlaylists(): Collection | null {
    if (!mongoClient || !connected) return null;
    return mongoClient.db(MONGO_DB).collection("playlists");
}
