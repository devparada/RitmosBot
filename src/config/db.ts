import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Carga las variables del archivo .env en silencio
dotenv.config({ quiet: true });
const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGO_INITDB_DATABASE;

if (!MONGO_URI) throw new Error("La variable MONGODB_URI no está definida");
if (!MONGO_DB) throw new Error("La variable MONGO_INITDB_DATABASE no está definida");

export const mongoClient = new MongoClient(MONGO_URI);
export const db = mongoClient.db(MONGO_DB);
export const coleccionPlaylists = db.collection("playlists");

let connected = false;

export async function connectMongo() {
    if (connected) return;
    try {
        await mongoClient.connect();
        connected = true;
        console.log("Conectado a MongoDB");
    } catch (err) {
        console.error("Error conectando a MongoDB: ", err);
        process.exit(1);
    }
}
