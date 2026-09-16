/**
 * API HTTP interne du bot.
 *
 * Elle reçoit le CSV des adhérents produit par l'application Yapla, applique la
 * même validation que la commande `/upload`, et l'écrit dans le volume de données.
 *
 * Elle n'est **pas** destinée à être publiée sur Internet : dans le `compose.yaml`
 * de production, son port n'est pas exposé et seul le nginx du frontend l'atteint,
 * par le réseau interne. Le jeton reste néanmoins indispensable — il protège
 * contre tout ce qui se trouverait déjà sur ce réseau.
 */
const http = require('node:http');
const crypto = require('node:crypto');
const {
    CsvValidationError,
    MAX_BYTES,
    assertContentType,
    saveAdherentsCsv,
    validateAdherentsCsv,
} = require('../utils/csv_validation');
const {log} = require('../utils/utils');

/** Longueur minimale du jeton : en deçà, on refuse de démarrer l'API. */
const MIN_TOKEN_LENGTH = 32;

/** Durée d'absorption du corps restant après un refus pour taille excessive. */
const LINGER_MS = 2000;

/**
 * Compare deux jetons sans fuiter d'information par le temps de réponse.
 *
 * On compare les empreintes SHA-256 plutôt que les chaînes : elles font toujours
 * 32 octets, donc `timingSafeEqual` ne lève pas sur des longueurs différentes et
 * la longueur du jeton attendu ne transparaît pas non plus.
 */
function tokensMatch(provided, expected) {
    const a = crypto.createHash('sha256').update(String(provided)).digest();
    const b = crypto.createHash('sha256').update(String(expected)).digest();
    return crypto.timingSafeEqual(a, b);
}

/** Extrait le jeton d'un en-tête `Authorization: Bearer <jeton>`. */
function extractBearer(header) {
    if (typeof header !== 'string') return null;
    const match = /^Bearer\s+(.+)$/i.exec(header.trim());
    return match ? match[1].trim() : null;
}

/** Réponse JSON compacte. */
function sendJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
    });
    res.end(payload);
}

/**
 * Lit le corps de la requête en mémoire, en cessant d'accumuler dès le dépassement
 * de quota.
 *
 * On ne se fie pas au `Content-Length` annoncé : un client peut mentir, ou utiliser
 * un encodage par blocs. C'est le volume réellement reçu qui est compté.
 *
 * On se contente ici de mettre la requête en pause. Détruire la socket sur-le-champ
 * empêcherait le client de lire la réponse 413 : il ne verrait qu'une connexion
 * coupée, sans savoir pourquoi. C'est l'appelant qui referme, après avoir répondu.
 */
function readBody(req, limit) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;

        const tooLarge = () => {
            req.pause();
            reject(new CsvValidationError('Le fichier doit faire moins de 8 Mo.'));
        };

        const announced = Number.parseInt(req.headers['content-length'] ?? '', 10);
        if (Number.isFinite(announced) && announced > limit) {
            tooLarge();
            return;
        }

        req.on('data', chunk => {
            size += chunk.length;
            if (size > limit) {
                // Les octets déjà reçus ne servent plus à rien : on les relâche.
                chunks.length = 0;
                tooLarge();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

/** Traite `POST /adherents`. */
async function handleUpload(req, res, token) {
    const provided = extractBearer(req.headers.authorization);
    if (!provided || !tokensMatch(provided, token)) {
        log('API : dépôt refusé, jeton invalide ou absent', null);
        sendJson(res, 401, {error: 'Jeton invalide.'});
        return;
    }

    let buffer;
    try {
        buffer = await readBody(req, MAX_BYTES);
    } catch (err) {
        const message = err instanceof CsvValidationError ? err.message : 'Lecture du corps de requête impossible.';
        // Pas de `Connection: close` ici : Node détruirait la socket dès la fin de
        // la réponse, et le client, encore en train d'écrire, verrait une erreur
        // réseau au lieu du 413.
        sendJson(res, 413, {error: message});
        // Fermeture « traînante », comme le fait nginx : on absorbe encore un court
        // instant ce que le client est en train d'envoyer, sinon il se prend une
        // erreur d'écriture et ne lit jamais le 413 qui lui explique le refus.
        // Le plafond est temporel, pas volumétrique : personne ne tient la socket
        // au-delà de ce délai.
        const lingering = setTimeout(() => req.destroy(), LINGER_MS);
        lingering.unref();
        req.on('end', () => clearTimeout(lingering));
        req.resume();
        return;
    }

    let result;
    try {
        assertContentType(req.headers['content-type']);
        result = validateAdherentsCsv(buffer);
    } catch (err) {
        if (err instanceof CsvValidationError) {
            sendJson(res, 422, {error: err.message});
            return;
        }
        throw err;
    }

    try {
        saveAdherentsCsv(result.text);
    } catch (err) {
        log(`API : échec de l'enregistrement du CSV — ${err.message}`, null);
        sendJson(res, 500, {error: "Enregistrement du fichier impossible."});
        return;
    }

    log(`API : CSV des adhérents remplacé (${result.rowCount} lignes, ${result.columnCount} colonnes)`, null);
    sendJson(res, 200, {
        status: 'ok',
        rows: result.rowCount,
        columns: result.columnCount,
    });
}

/** Construit le serveur sans le démarrer — pratique pour les tests. */
function createApiServer(token) {
    return http.createServer((req, res) => {
        const url = new URL(req.url, 'http://localhost');

        if (req.method === 'GET' && url.pathname === '/health') {
            sendJson(res, 200, {status: 'ok'});
            return;
        }

        if (url.pathname === '/adherents') {
            if (req.method !== 'POST') {
                res.setHeader('Allow', 'POST');
                sendJson(res, 405, {error: 'Méthode non autorisée.'});
                return;
            }
            handleUpload(req, res, token).catch(err => {
                log(`API : erreur inattendue — ${err.message}`, null);
                if (!res.headersSent) sendJson(res, 500, {error: 'Erreur interne.'});
            });
            return;
        }

        sendJson(res, 404, {error: 'Ressource inconnue.'});
    });
}

/**
 * Démarre l'API si elle est configurée.
 *
 * Sans `API_TOKEN`, l'API ne démarre pas : un endpoint capable de remplacer le
 * fichier qui pilote l'attribution des rôles ne doit jamais être ouvert par
 * défaut. Le bot Discord, lui, continue de tourner normalement.
 *
 * @returns {import('node:http').Server|null}
 */
function startApiServer() {
    const token = process.env.API_TOKEN;
    const port = Number.parseInt(process.env.API_PORT ?? '8080', 10);

    if (!token) {
        log('API : désactivée (API_TOKEN absent). La commande /upload reste disponible.', null);
        return null;
    }
    if (token.length < MIN_TOKEN_LENGTH) {
        log(`API : désactivée, API_TOKEN trop court (${token.length} < ${MIN_TOKEN_LENGTH} caractères).`, null);
        return null;
    }

    const server = createApiServer(token);
    server.listen(port, '0.0.0.0', () => {
        log(`API : à l'écoute sur le port ${port}`, null);
    });
    server.on('error', err => {
        log(`API : impossible de démarrer — ${err.message}`, null);
    });
    return server;
}

module.exports = {
    createApiServer,
    startApiServer,
};
