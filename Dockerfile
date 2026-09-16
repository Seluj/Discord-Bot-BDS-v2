# Image du bot Discord BDS.
#
# Le bot écrit son fichier d'adhérents dans /data, monté comme volume par le
# compose : contrairement à l'ancienne version qui l'écrivait à côté du code,
# le fichier survit désormais aux mises à jour d'image.

# Debian et non Alpine : `bufferutil` et `utf-8-validate` sont des modules natifs
# qui publient des binaires précompilés pour la glibc, mais pas pour la musl
# d'Alpine, où il faudrait embarquer toute une chaîne de compilation.
ARG NODE_VERSION=24.21.0-bookworm-slim

FROM node:${NODE_VERSION} AS builder

WORKDIR /usr/src/bot

# Les dépendances d'abord : cette couche n'est reconstruite qu'au changement du
# lockfile, pas à chaque modification du code.
# `bufferutil` et `utf-8-validate` se compilent quand aucun binaire précompilé ne
# correspond à la plateforme visée. La chaîne de compilation reste confinée à
# cette étape : seul `node_modules` est repris dans l'image finale.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

FROM node:${NODE_VERSION} AS runner

ENV NODE_ENV=production \
    DATA_DIR=/data \
    API_PORT=8080

WORKDIR /usr/src/bot

COPY --from=builder /usr/src/bot/node_modules ./node_modules
COPY . .

# `serveur/` et `logs/` sont régénérés à chaque démarrage à partir de Discord ;
# ils restent dans la couche inscriptible du conteneur, sans volume. Seul /data
# contient de la donnée qu'on ne sait pas reconstruire.
RUN mkdir -p /data /usr/src/bot/logs /usr/src/bot/serveur \
    && chown -R node:node /data /usr/src/bot

USER node

EXPOSE 8080

# Le bot doit être joignable pour que le frontend puisse déposer son CSV ;
# une API muette signale un conteneur à redémarrer.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('node:http').get({host:'127.0.0.1',port:process.env.API_PORT||8080,path:'/health'},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "index.js"]
