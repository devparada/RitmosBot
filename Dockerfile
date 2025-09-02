# Version slim
FROM node:24.7-slim

# Actualiza todos los paquetes
RUN apt update -y && apt upgrade -y && \
    # Instala ffmpeg sin instalar los paquetes recomendados
    apt install -y --no-install-recommends ffmpeg && \
    # Limpia los archivos innecesarios
    apt clean && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /home/node/RitmosBot

# Copia los archivos y lo asigna al propietario root
# También asegura los permisos de escritura y ejecución para todos y sólo escritura para root
COPY --chown=root:root --chmod=755 src ./src
COPY --chown=root:root --chmod=755 package.json package-lock.json tsconfig.json ./

# Instala las dependencias
RUN npm ci --omit=dev --ignore-scripts && \
    # Compila el TypeScript a JavaScript
    npm run build

# Cambia al usuario node
USER node

CMD ["node", "."]
