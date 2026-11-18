# ==============================================================================
# Etapa 1: Builder
# ==============================================================================
FROM node:20-alpine AS builder

# Instalar OpenSSL requerido por el motor de Prisma en distribuciones Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copiar archivos de dependencias y schema de Prisma para aprovechar la caché de capas Docker
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias exactas y generar cliente tipado de Prisma
RUN npm ci
RUN npx prisma generate

# Copiar el resto del código fuente del proyecto y compilar NestJS
COPY . .
RUN npm run build

# ==============================================================================
# Etapa 2: Production (Runtime)
# ==============================================================================
FROM node:20-alpine AS production

# Instalar OpenSSL requerido en runtime por el motor de Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Definir variable de entorno para producción
ENV NODE_ENV=production

# Copiar únicamente los artefactos necesarios desde la etapa builder garantizando ownership
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma

# Configurar ejecución bajo usuario sin privilegios (no-root)
USER node

# Exponer el puerto de la aplicación NestJS
EXPOSE 3000

# Comando de arranque en producción
CMD ["npm", "run", "start:prod"]
