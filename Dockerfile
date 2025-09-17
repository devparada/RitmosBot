# Etapa 1: Build
FROM node:24.7-slim AS builder

WORKDIR /ritmosbot


# Copiamos package.json, pnpm-lock.yaml y tsconfig.json
COPY --chown=root:root --chmod=755 package.json pnpm-lock.yaml tsconfig.json ./

# Copia el código fuente y lo asigna al propietario root
# También asegura los permisos de escritura y ejecución para todos y sólo escritura para root
COPY --chown=root:root --chmod=755 src ./src

# Habilitamos corepack para manejar pnpm automáticamente
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    # Instalamos TODAS las dependencias
    pnpm install --frozen-lockfile --ignore-scripts && \
    # Compila el TypeScript a JavaScript
    pnpm run build && \
    # Eliminamos las devDependencies para reducir el tamaño
    pnpm prune --prod

# Etapa 2: Runtime
FROM node:24.7-slim

# Actualiza los paquetes y instala ffmpeg en runtime
RUN apt update -y && apt upgrade -y && \
    apt install -y --no-install-recommends ffmpeg && \
    # Limpia los archivos innecesarios
    apt clean && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /ritmosbot

# Copia el node_modules, dist y package.json desde el builder
COPY --from=builder --chown=root:root --chmod=755 /ritmosbot/node_modules ./node_modules
COPY --from=builder --chown=root:root --chmod=755 /ritmosbot/dist ./dist
COPY --from=builder --chown=root:root --chmod=755 /ritmosbot/package.json ./

# Usamos el usuario node
USER node

CMD ["node", "."]
