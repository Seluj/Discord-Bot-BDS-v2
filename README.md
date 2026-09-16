# Discord-Bot-BDS-v2

Bot Discord du **BDS (Bureau des Sports)** de l'ESTA. Il automatise l'attribution des rôles
Discord à partir du fichier des adhérents exporté depuis Yapla : chaque membre du serveur est
rapproché de la base d'adhérents par son pseudo, et reçoit le rôle *Cotisants* ou
*Attente_Cotisant* selon la validité de son adhésion.

Le CSV d'entrée est produit par le projet compagnon [`yapla`](../yapla).

---

## Sommaire

- [Fonctionnement](#fonctionnement)
- [Installation](#installation)
- [Configuration](#configuration)
- [Commandes](#commandes)
- [API de dépôt du CSV](#api-de-dépôt-du-csv)
- [Déploiement Docker](#déploiement-docker)
- [Audit technique — septembre 2026](#audit-technique--septembre-2026)

---

## Fonctionnement

```
Yapla  ──export xlsx──>  projet yapla  ──┬── /upload (Discord)  ──┐
                                         │                        ├──>  /data/adherent.csv  ──>  /role
                                         └── POST /adherents  ────┘                                │
                                             (API, via le nginx du frontend)                       │
                                                                          attribution des rôles Discord
```

Les deux chemins appliquent **la même validation** ([`utils/csv_validation.js`](utils/csv_validation.js))
et écrivent le même fichier. L'API évite simplement l'aller-retour par le téléchargement
puis la commande Discord.

Le fichier `adherent.csv` utilise `;` comme séparateur, sans en-tête, avec les colonnes :

| Index | Contenu             | Exemple      |
|-------|---------------------|--------------|
| `0`   | Nom                 | `DUPONT`     |
| `1`   | Prénom              | `Marie`      |
| `2`   | Début d'adhésion    | `2025-09-01` |
| `3`   | Fin d'adhésion      | `2026-08-31` |

La première ligne est une ligne technique `Base de données;Base de données;<date>;<date>`
qui sert à afficher la date de fraîcheur de la base dans les réponses du bot.

### Fichiers de configuration par serveur

Au démarrage (`ready`) et à chaque nouveau serveur rejoint (`guildCreate`), le bot génère
automatiquement deux fichiers par guilde :

- `serveur/roles/role_<guildId>.json` — table `nom_du_rôle: id`
- `serveur/channels/channels_<guildId>.json` — table `nom_du_salon: id`

Les noms sont normalisés (espaces, `-`, `'` et `@` remplacés). Le code s'attend donc à trouver
des rôles nommés `Cotisants`, `Attente_Cotisant`, `Membre_du_Bureau`, `Bureau_Restreints`,
`Anciens_du_Bureau`, `Admin_Discord`, `BDS_ESTA`, `ESTA`, `Bots`, `Bannis_inscriptions`,
`exception`, et des salons `logs`, `commandes`, `arrivée`, `départ`, `ligne_de_départ`,
`attribution_sports`.

> Renommer un rôle ou un salon sur Discord suffit à casser la commande qui en dépend.

---

## Installation

```bash
npm install
```

Créer un fichier `.env` à la racine :

```
BOT_TOKEN=le_token_du_bot
CLIENTID=l_id_de_l_application
API_TOKEN=            # facultatif en local ; sans lui, l'API ne démarre pas
```

Enregistrer les commandes slash auprès de Discord (à refaire à chaque ajout/modification
de commande) :

```bash
node deploy_commands.js
```

Démarrer le bot :

```bash
node index.js
```

Pour désenregistrer toutes les commandes globales : `node delete_commands.js`.

---

## Configuration

| Variable      | Rôle                                                   | Défaut |
|---------------|--------------------------------------------------------|--------|
| `BOT_TOKEN`   | Token du bot Discord                                   | —      |
| `CLIENTID`    | ID de l'application, pour le déploiement des commandes | —      |
| `API_TOKEN`   | Jeton de l'API de dépôt ; **32 caractères minimum**    | absent → API désactivée |
| `API_PORT`    | Port d'écoute de l'API                                 | `8080` |
| `DATA_DIR`    | Répertoire des données mutables                        | racine du dépôt (`/data` en conteneur) |

Fichiers ignorés par Git et à ne jamais committer : `.env`, `adherent.csv`, `serveur/`, `*.txt`.

---

## Commandes

| Commande        | Permission        | Description |
|-----------------|-------------------|-------------|
| `/upload`       | Administrateur    | Envoie et valide le fichier `adherent.csv` |
| `/role`         | Administrateur    | Synchronise les rôles Cotisants / Attente_Cotisant avec la base |
| `/adherent`     | ManageEvents      | Recherche un adhérent dans la base par nom ou prénom |
| `/membre`       | ManageEvents      | Recherche un membre du serveur et liste ses rôles |
| `/stats`        | Administrateur    | Met à jour les salons compteurs du serveur |
| `/sport`        | —                 | Attribution des rôles de sport |
| `/embed`        | —                 | Envoi des messages d'accueil / d'information |
| `/help`         | —                 | Aide |
| `/ping`         | Restreinte        | Test de latence |
| `/restart`      | Administrateur    | Réinitialisation après redémarrage |
| `/annual_reset` | Restreinte        | Purge annuelle des rôles (partie destructrice actuellement commentée) |

Évènements écoutés : `channelCreate`, `channelDelete`, `channelUpdate`, `guildCreate`,
`guildDelete`, `guildMemberAdd`, `guildMemberRemove`, `guildMemberUpdate`, `interactionCreate`,
`messageCreate`, `messageReactionAdd`, `ready`, `roleCreate`, `roleDelete`, `roleUpdate`.

---

## API de dépôt du CSV

Montée par [`api/server.js`](api/server.js) au démarrage, **uniquement** si `API_TOKEN`
est défini et fait au moins 32 caractères. Sans cela, le bot démarre normalement mais
l'API reste fermée : un endpoint capable de remplacer le fichier qui pilote l'attribution
des rôles ne s'ouvre pas par défaut.

| Route             | Méthode | Authentification         | Réponse |
|-------------------|---------|--------------------------|---------|
| `/health`         | `GET`   | aucune                   | `200 {"status":"ok"}` |
| `/adherents`      | `POST`  | `Authorization: Bearer`  | `200 {"status":"ok","rows":n,"columns":n}` |

Codes d'erreur : `401` jeton invalide, `413` au-delà de 8 Mo, `422` CSV non conforme.

Le jeton est comparé en temps constant, sur les empreintes SHA-256 des deux valeurs :
ni le contenu ni la longueur du jeton attendu ne transparaissent dans le temps de réponse.

L'écriture passe par un fichier temporaire suivi d'un `rename`, atomique : une commande
`/role` concurrente lit soit l'ancien fichier, soit le nouveau, jamais un fichier tronqué.

Le port n'est **pas** publié en production ; seul le nginx du frontend l'atteint, par le
réseau interne.

---

## Déploiement Docker

Le bot n'a plus de `compose.yaml` propre : il est déployé avec le frontend depuis le
dépôt de déploiement, à la racine de l'espace de travail.

```bash
docker compose pull && docker compose up -d
```

L'image est publiée sur `registry.selutech.fr/bds/bot`. Voir [`../README.md`](../README.md).

### Données

`adherent.csv` est écrit dans `DATA_DIR`, monté sur le volume `adherents` : il survit
désormais aux reconstructions d'image. `serveur/` et `logs/` restent dans le conteneur,
le premier étant régénéré depuis l'API Discord à chaque `ready`.

> L'image tourne sous l'utilisateur `node`, non privilégié, et embarque une sonde
> `HEALTHCHECK` sur `/health`. `pm2` a été retiré : `restart: unless-stopped` au niveau
> du compose remplit le même rôle sans superviseur imbriqué.

---
---

# Audit technique — septembre 2026

> Revue réalisée le **16/09/2026** après ~12 mois sans développement.
> Dernier commit : `1721162`, 21/09/2025.
> Environnement de vérification : Node 26.8.2 / npm 11.19.1.
>
> Vérifications exécutées : `npm outdated`, `npm audit`, `node --check` sur les 41 fichiers JS,
> et reproduction isolée du bug de lecture CSV.

## 1. Dépendances

| Paquet             | Installé        | Dernière   | Remarque |
|--------------------|-----------------|------------|----------|
| `discord.js`       | 14.19.1         | **14.27.0**| Mineure, sans rupture — corrige les CVE `undici` |
| `@discordjs/voice` | 0.16.1          | 0.19.2     | **Jamais importé** → à supprimer |
| `csv-parse`        | 5.6.0           | **7.0.2**  | 2 majeures de retard |
| `dotenv`           | 16.5.0          | **17.4.2** | 1 majeure |
| `bufferutil`       | 4.0.9           | 4.1.0      | Optionnel (perf `ws`), **non importé** |
| `utf-8-validate`   | 6.0.5           | 6.0.6      | Idem |
| `fs`               | 0.0.1-security  | —          | **Paquet fantôme npm**, pas le module Node |
| `path`             | 0.12.7          | —          | Polyfill userland obsolète |

`fs` et `path` sont des paquets npm sans rapport avec les modules natifs. Node donne toujours
la priorité aux modules core pour ces noms, donc ils ne sont **jamais chargés** : ils sont
inertes. Mais `fs@0.0.1-security` est un placeholder de *name-squatting* et n'a rien à faire
dans un `package.json`.

### Vulnérabilités

**`npm audit` : 6 vulnérabilités (3 hautes, 3 modérées)**, toutes transitives via
`discord.js` → `undici` (14 advisories : HTTP request smuggling, injection CRLF, DoS WebSocket,
empoisonnement de file de réponses) et `ws`.

**Un simple `npm audit fix` les corrige toutes.**

```bash
npm uninstall fs path @discordjs/voice bufferutil utf-8-validate
npm i discord.js@latest dotenv@latest
npm audit fix
```

`csv-parse` v7 est une migration à traiter séparément (l'API `parse` synchrone utilisée dans
`upload.js` change peu, mais reste à tester).

## 2. Anomalies relevées

### 🔴 Critique — `parseCSVFiles` retourne un tableau vide

`utils/utils.js:64`

La fonction ouvre un stream asynchrone puis fait `return data` immédiatement, avant qu'aucun
évènement `on("data")` n'ait été émis. Reproduit en isolation :

```
longueur immédiatement après appel : 0
longueur après un tick du event loop : 2
```

Les appelants ne « fonctionnent » que parce qu'un `await interaction.reply()` laisse tourner
l'event loop entre-temps. C'est une course, pas un fonctionnement.

**La conséquence sur `commands/role.js:16` est destructrice.** Si `etudiant` est vide ou
partiel au moment de la seconde boucle, `matchingStudent` vaut `undefined` pour *tout le
monde*, la condition `|| !matchingStudent` se déclenche, et le bot **retire le rôle
`Cotisants` à l'ensemble du serveur**.

C'est le bug le plus grave du projet.

*Correctif* : rendre la fonction `async` en s'appuyant sur `csv-parse/sync` (déjà utilisé
dans `upload.js`) ou sur une Promise, puis `await` chez les deux appelants (`role.js`,
`adherent.js`).

### 🔴 `/membre` renvoie toujours 0 résultat

`commands/membre.js:39`

`interaction.guild.members.fetch().then(...)` n'est pas attendu : `str` et `nb` sont lus avant
l'exécution du `.then`. La commande affiche systématiquement « Nombre trouvé : 0 ».

### 🟠 `/restart` — test de type inopérant

`commands/restart.js:22`

`if (channel.isTextBased)` teste la *référence de fonction*, toujours truthy — il manque les
parenthèses. Par ailleurs `message` et la branche `commandes` sont calculés puis jetés : la
commande ne fait plus rien d'utile.

### 🟠 `annual_reset` — `splice(indexOf(...))` sur un rôle absent

`commands/annualReset.js:53-62`

Si une clé manque dans `role_<guildId>.json`, `indexOf` renvoie `-1` et `splice(-1, 1)`
supprime **le dernier élément** du tableau. La liste des rôles à purger devient silencieusement
fausse. La partie destructrice est actuellement commentée, mais le piège reste armé.

### 🟠 Crash en message privé

`events/messageCreate.js:23`

`message.member.user.tag` : en DM, `message.member` vaut `null` → `TypeError` non catché.
Le chemin `bds!` est atteignable en DM.

Au passage, la condition `!message.author.bot && ...` laisse passer **les bots**, à rebours du
commentaire « Ignore all human messages » juste au-dessus.

### 🟡 `upload.js` ne suit pas les redirections

`commands/upload.js:53`

`https.get` brut : un 302 du CDN Discord passe le test `>= 400`, le corps est vide, et
l'utilisateur voit « Le fichier CSV est vide ». Utiliser `fetch()` (natif depuis Node 18) suffit.

### 🟡 `throw` dans un callback asynchrone

`utils/utils.js:212`

`fs.unlink(..., err => { if (err) throw err })` : l'exception remonte hors de toute pile
catchable et tue le process. Même motif dans `channels_files.js` et `roles_files.js`.

### 🟡 Appels de rôles non attendus

`commands/role.js:83`

`member.roles.add()` / `.remove()` sans `await` dans une boucle : rafale de requêtes non
throttlée et rejets non gérés au premier rate-limit de l'API Discord.

## 3. Qualité et infrastructure

### 3.1 Projet

- ~~**`package.json` quasi vide**~~ → `name`, `version`, `engines` et `scripts`
  (`npm start`, `npm run deploy:commands`) ajoutés. La version sert de tag d'image.
- **Aucun test, aucun linter, aucune CI.**
- **Identifiants personnels en dur** : `"jul.e.s"` et `234255301728141314` dans `ping.js:29`,
  `annualReset.js:11`, `messageCreate.js:23` ; « Jules - Respo Info » dans `embed.js:107` et
  `messageCreate.js:16`. Le jour où le poste change de main, le bot devient inadministrable.
  À sortir dans `.env` ou dans les fichiers `serveur/`.
- **IDs de salons en dur** dans `stats.js:47-58` : le bot n'est utilisable que sur un seul
  serveur, alors que tout le reste du code est pensé multi-guild.
- **`require()` de JSON à chaud** dans 15 fichiers : `require` met en cache, donc toute
  modification de `serveur/*.json` est ignorée jusqu'au redémarrage. Et si le fichier n'existe
  pas (serveur fraîchement rejoint), `interactionCreate.js:9` lève **avant** de savoir quelle
  commande exécuter → *toutes* les commandes cassent.
- **`intents: [3276799]`** (`index.js:9`) : nombre magique activant tous les intents
  privilégiés. À réécrire avec `GatewayIntentBits` et à réduire au strict nécessaire.
- **Fuites de variables globales** : `dotenv = require('dotenv')` sans `const` dans `index.js`,
  `deploy_commands.js` et `delete_commands.js`.
- **Monkey-patching de `Date.prototype.yyyymmdd`** (`utils.js:131`), utilisé uniquement par du
  code commenté.
- **Logs sans rotation** : `logs/log.txt` et `logs/logTimed.txt` grossissent indéfiniment, en
  `appendFileSync` (I/O bloquante à chaque ligne).

### 3.2 Docker — réglé

- ~~`FROM node:latest`~~ → `node:24.21.0-bookworm-slim`, épinglé. Debian et non Alpine :
  les modules natifs `bufferutil` / `utf-8-validate` n'ont pas de binaire précompilé pour
  la musl, et il faudrait embarquer toute une chaîne de compilation.
- ~~`npm install`~~ → `npm ci --omit=dev` avec le `package-lock.json`, dans une étape de
  build séparée dont seul `node_modules` est repris.
- ~~Exécution en root~~ → `USER node`.
- ~~Pas de `.dockerignore`~~ → ajouté (`node_modules`, `.env`, `adherent.csv`, `serveur/`).
- `pm2` retiré : `restart: unless-stopped` remplit le même rôle sans superviseur imbriqué.
- `HEALTHCHECK` ajouté sur `/health`.

### 3.3 Infrastructure — réglé

Le `compose.yaml` local a été supprimé au profit d'un compose unique à la racine de
l'espace de travail, qui déploie le bot et le frontend depuis les images publiées sur
`registry.selutech.fr`.

1. ~~`BOT_TOKEN` n'est pas injecté~~ → passé par le `.env` du dépôt de déploiement.
2. ~~`adherent.csv` perdu à chaque reconstruction~~ → écrit dans `DATA_DIR`, monté sur un
   volume nommé. `serveur/*.json` reste éphémère **à dessein** : il est intégralement
   régénéré depuis l'API Discord à chaque `ready`, et le persister ne ferait que figer
   des IDs périmés.

## 4. Plan d'action

**Priorité 1 — risque de corruption de données**

1. Corriger `parseCSVFiles` — `/role` peut dépouiller tout le serveur de ses rôles.

**Priorité 2 — sécurité et exploitation**

2. `npm audit fix` + nettoyage des dépendances mortes (couvre les 6 CVE).
3. ~~Ajouter `env_file` et volumes au `compose.yaml`~~ — fait, voir [3.3](#33-infrastructure--réglé).
4. ~~Épingler l'image de base, `npm ci`, `USER node`, `.dockerignore`~~ — fait,
   voir [3.2](#32-docker--réglé).

**Priorité 3 — dette de fond**

5. Corriger `/membre`, `/restart`, le crash DM, le `splice(-1)`.
6. Sortir les identifiants et IDs de salons en dur.
7. ~~Ajouter `scripts` + `engines` au `package.json`~~ — fait.
8. ESLint + Prettier, et un workflow GitHub Actions minimal.
