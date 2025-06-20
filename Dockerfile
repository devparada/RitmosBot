# Versión slim
FROM node:24-slim

RUN apt update && apt upgrade -y

# Instala ffmpeg sin istalar los paquetes recomendados
RUN apt install -y --no-install-recommends ffmpeg

# Directorio de trabajo
WORKDIR /home/node/RitmosBot

COPY . .

# Instala las dependencias
RUN npm install -omit=dev

# Compila el TypeScript a JavaScript
RUN npm run build

# Limpia los archivos innecesarios
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

CMD ["node", "."]
