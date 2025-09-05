# Etapa 1: Build
FROM node:24.7-slim AS builder

WORKDIR /home/node/RitmosBot

# Copiamos package.json, package-lock.json y tsconfig.json
COPY package.json package-lock.json tsconfig.json ./

# Instalamos TODAS las dependencias
RUN npm ci --ignore-scripts

# Copia el código fuente y lo asigna al propietario root
# También asegura los permisos de escritura y ejecución para todos y sólo escritura para root
COPY --chown=root:root --chmod=755 src ./src

# Compila el TypeScript a JavaScript
RUN npm run build

# Eliminamos las devDependencies para reducir el tamaño
RUN npm prune --omit=dev

# Etapa 2: Runtime
FROM node:24.7-slim

# Actualiza los paquetes y instala ffmpeg en runtime
RUN apt update -y && apt upgrade -y && \
    apt install -y --no-install-recommends ffmpeg && \
    # Limpia los archivos innecesarios
    apt clean && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /home/node/RitmosBot

# Copia el node_modules, dist y .env desde el builder
COPY --from=builder --chown=root:root --chmod=755  /home/node/RitmosBot/node_modules ./node_modules
COPY --from=builder --chown=root:root --chmod=755  /home/node/RitmosBot/dist ./dist
COPY --from=builder --chown=root:root --chmod=755  /home/node/RitmosBot/package.json /home/node/RitmosBot/package-lock.json ./

# Usamos el usuario node
USER node

CMD ["node", "."]
