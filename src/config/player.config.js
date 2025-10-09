// Este módulo se encarga de configurar el Player
module.exports = {
    connectionTimeout: 30000,
    bufferingTimeout: 8000,
    smoothVolume: true,
    ytdlOptions: {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1024 * 1024, // 1MB
        dlChunkSize: 0, // Auto para que lo maneje ytdl
        requestOptions: {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
            },
        },
    },
    filters: {
        bassboost: false,
        karaoke: false,
        nightcore: false,
        phaser: false,
        tremolo: false,
        vibrato: false,
    },
};
