# Version LTS slim
FROM node:22.11.0-slim

RUN apt update && apt upgrade -y
RUN apt install -y ffmpeg

# Directorio de trabajo
WORKDIR /home/node/RitmosBot

COPY . .

# Instala las dependencias
RUN npm install -omit=dev

# Limpia archivos innecesarios
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

CMD ["node", "."]
