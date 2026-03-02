import { type Collection, type Db, MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGO_INITDB_DATABASE;

export let mongoClient: MongoClient | null = null;
export let db: Db | null = null;
export let coleccionPlaylists: Collection | null = null;

if (MONGO_URI && MONGO_DB) {
    mongoClient = new MongoClient(MONGO_URI);
    db = mongoClient.db(MONGO_DB);
    coleccionPlaylists = db.collection("playlists");
} else {
    console.warn("MongoDB no configurado. Las funciones de guardado no estarán disponibles.");
}

let connected = false;

export async function connectMongo() {
    if (!mongoClient || connected) return;
    try {
        await mongoClient.connect();
        connected = true;
        console.log("Conectado a MongoDB");
    } catch (err) {
        console.error("No se pudo conectar a MongoDB. El bot funciona sin base de datos: ", err);
    }
}
