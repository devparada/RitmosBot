# Version slim
FROM node:24.6-slim

RUN apt update && apt upgrade -y && \
# Instala ffmpeg sin istalar los paquetes recomendados
apt install -y --no-install-recommends ffmpeg && \
# Limpia los archivos innecesarios
apt-get clean && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /home/node/RitmosBot

COPY . .

# Instala las dependencias
RUN npm ci --omit=dev

# Compila el TypeScript a JavaScript
RUN npm run build

CMD ["node", "."]
