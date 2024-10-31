# Version LTS slim
FROM node:22.11.0-slim

RUN apt update && apt upgrade -y
RUN apt install -y ffmpeg

# Directorio de trabajo
WORKDIR /home/node/RitmosBot

COPY . .
# Instala las dependencias
RUN npm install -omit=dev

CMD ["node", "."]
