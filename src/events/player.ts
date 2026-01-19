import { Colors, EmbedBuilder } from "discord.js";
import type { GuildQueue, Player, Track } from "discord-player";
import type { QueueMetadata } from "@/types/types";

const URLS_VALIDAS = [
    "https://youtube.com/",
    "https://www.youtube.com/",
    "https://m.youtube.com/",
    "https://open.spotify.com/",
    "https://play.spotify.com/",
];

export function playerEvents(player: Player) {
    player.events.on("playerStart", async (queue: GuildQueue, track: Track) => {
        const metadata = queue.metadata as QueueMetadata;
        const textChannel = metadata.channel;

        if (metadata.lastTrackId === track.id) return;
        metadata.lastTrackId = track.id;

        let urlThumbnail = "https://i.imgur.com/yd01iL2.jpeg";
        let descripcion = `🎶 Reproduciendo: **${track.title}** `;
        const videoURLValido = URLS_VALIDAS.some((url) => track.url.startsWith(url));

        if (track.thumbnail && videoURLValido) {
            urlThumbnail = track.thumbnail;
            descripcion += `de **${track.author}** 🎶`;
        } else {
            descripcion += track.requestedBy ? `subido por **${track.requestedBy.username}** 🎶` : "";
        }

        const embed = new EmbedBuilder().setColor(Colors.Blue).setThumbnail(urlThumbnail).setDescription(descripcion);

        await textChannel.send({ embeds: [embed] });
    });

    player.events.on("playerFinish", (queue: GuildQueue) => {
        const metadata = queue.metadata as QueueMetadata;
        metadata.lastTrackId = null;
    });

    player.events.on("error", (error) => console.error("Player error:", error));
}
