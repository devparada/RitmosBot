# Etapa 1: Build
FROM node:24.7-slim AS builder

WORKDIR /ritmosbot

# Copiamos package.json, package-lock.json y tsconfig.json
COPY --chown=root:root --chmod=755 package.json package-lock.json tsconfig.json ./

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
WORKDIR /ritmosbot

# Copia el node_modules, dist, package.json y package-lock.json desde el builder
COPY --from=builder --chown=root:root --chmod=755 /ritmosbot/node_modules ./node_modules
COPY --from=builder --chown=root:root --chmod=755 /ritmosbot/dist ./dist
COPY --from=builder --chown=root:root --chmod=755 /ritmosbot/package*.json ./

# Usamos el usuario node
USER node

CMD ["node", "."]
