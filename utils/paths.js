/**
 * Emplacement des données persistantes du bot.
 *
 * En conteneur, `/data` est un volume : le fichier des adhérents survit aux
 * reconstructions d'image, ce qui n'était pas le cas quand il était écrit à côté
 * du code dans `/usr/src/bot`.
 *
 * Hors conteneur (développement), on retombe sur la racine du dépôt pour ne pas
 * imposer la création d'un `/data` sur la machine du développeur.
 */
const path = require('node:path');
const fs = require('node:fs');

const REPO_ROOT = path.join(__dirname, '..');

/** Répertoire des données mutables. */
const DATA_DIR = process.env.DATA_DIR || REPO_ROOT;

/** Fichier CSV des adhérents, alimenté par `/upload` ou par l'API HTTP. */
const ADHERENTS_FILE = process.env.ADHERENTS_FILE || path.join(DATA_DIR, 'adherent.csv');

/**
 * Crée le répertoire de données s'il manque.
 * Appelé au démarrage : un volume fraîchement créé est vide mais existe déjà,
 * c'est surtout le cas du développement local qui est couvert ici.
 */
function ensureDataDir() {
    const dir = path.dirname(ADHERENTS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
    return dir;
}

module.exports = {
    DATA_DIR,
    ADHERENTS_FILE,
    ensureDataDir,
};
