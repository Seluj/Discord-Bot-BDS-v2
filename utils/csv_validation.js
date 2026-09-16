/**
 * Validation du CSV des adhérents.
 *
 * Ces contrôles vivaient dans `commands/upload.js`. Ils sont extraits ici pour que
 * l'API HTTP et la commande Discord appliquent exactement les mêmes règles : une
 * seule porte d'entrée validée, deux façons de la franchir.
 */
const fs = require('node:fs');
const {parse} = require('csv-parse/sync');
const {ADHERENTS_FILE, ensureDataDir} = require('./paths');

/** Taille maximale acceptée, en octets. */
const MAX_BYTES = 8_000_000;

/** Garde-fous structurels. */
const MAX_ROWS = 10_000;
const MAX_COLS = 50;
const MIN_COLS = 2;

/** Types MIME tolérés quand la source en fournit un. */
const ALLOWED_MIME = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];

/**
 * Erreur de validation : porte un message destiné à l'utilisateur final.
 * On la distingue des erreurs techniques pour ne renvoyer au client que ce qui
 * lui est utile, sans fuiter de détail d'implémentation.
 */
class CsvValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CsvValidationError';
    }
}

/** Vérifie le nom de fichier annoncé. */
function assertFileName(fileName) {
    if (!/\.csv$/i.test(fileName || '')) {
        throw new CsvValidationError('Le fichier doit être au format CSV.');
    }
}

/** Vérifie le type MIME annoncé, quand il y en a un. */
function assertContentType(contentType) {
    if (!contentType) return;
    const normalized = contentType.toLowerCase();
    if (!ALLOWED_MIME.some(type => normalized.includes(type))) {
        throw new CsvValidationError(`Type de fichier non valide (${contentType}). Le fichier doit être un CSV.`);
    }
}

/**
 * Valide le contenu d'un CSV d'adhérents et renvoie le texte prêt à écrire.
 *
 * @param {Buffer} buffer contenu brut du fichier
 * @returns {{text: string, rowCount: number, columnCount: number}}
 * @throws {CsvValidationError} si le contenu ne respecte pas le format attendu
 */
function validateAdherentsCsv(buffer) {
    if (!Buffer.isBuffer(buffer)) {
        throw new CsvValidationError('Contenu illisible.');
    }
    if (buffer.length === 0) {
        throw new CsvValidationError('Le fichier CSV est vide.');
    }
    if (buffer.length > MAX_BYTES) {
        throw new CsvValidationError('Le fichier doit faire moins de 8 Mo.');
    }
    // Un CSV est du texte : la présence d'octets NUL trahit un binaire renommé.
    if (buffer.includes(0)) {
        throw new CsvValidationError('Le fichier semble binaire (octets NUL détectés). Un CSV texte est requis.');
    }

    const text = buffer.toString('utf8');

    // On inspecte les premières lignes non vides pour attraper tôt les erreurs de
    // séparateur, avant de lancer l'analyseur sur tout le fichier.
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const nonEmpty = lines.filter(line => line.trim().length > 0).slice(0, 5);
    if (nonEmpty.length === 0) {
        throw new CsvValidationError('Le fichier CSV est vide.');
    }
    if (nonEmpty.some(line => line.includes('\t'))) {
        throw new CsvValidationError('Le fichier ne doit pas utiliser la tabulation. Le séparateur requis est « ; ».');
    }
    const semiCount = nonEmpty.reduce((acc, line) => acc + (line.split(';').length - 1), 0);
    if (semiCount < 1) {
        throw new CsvValidationError('Le fichier doit utiliser « ; » comme séparateur (aucun « ; » détecté).');
    }

    let records;
    try {
        records = parse(text, {
            bom: true,
            delimiter: ';',
            relax_column_count: false,
            skip_empty_lines: true,
            trim: true,
            record_delimiter: ['\r\n', '\n', '\r'],
            max_record_size: 1024 * 1024 // 1 Mo par ligne au maximum
        });
    } catch (err) {
        throw new CsvValidationError(`Le fichier n'est pas un CSV valide avec « ; » comme séparateur : ${err.message}`);
    }

    if (!Array.isArray(records) || records.length === 0) {
        throw new CsvValidationError('Le fichier CSV ne contient aucune ligne exploitable.');
    }

    const firstRow = records[0];
    if (!Array.isArray(firstRow) || firstRow.length < MIN_COLS) {
        throw new CsvValidationError(`Le CSV doit contenir au moins ${MIN_COLS} colonnes.`);
    }
    if (records.length > MAX_ROWS) {
        throw new CsvValidationError(`Le CSV contient trop de lignes (${records.length} > ${MAX_ROWS}).`);
    }
    if (firstRow.length > MAX_COLS) {
        throw new CsvValidationError(`Le CSV contient trop de colonnes (${firstRow.length} > ${MAX_COLS}).`);
    }

    const expectedCols = firstRow.length;
    const inconsistent = records.findIndex(row => row.length !== expectedCols);
    if (inconsistent !== -1) {
        throw new CsvValidationError(`Nombre de colonnes incohérent à la ligne ${inconsistent + 1}.`);
    }

    return {text, rowCount: records.length, columnCount: expectedCols};
}

/**
 * Écrit le CSV validé à son emplacement définitif.
 *
 * L'écriture passe par un fichier temporaire suivi d'un `rename` : `rename` est
 * atomique sur le même système de fichiers, donc une lecture concurrente par
 * `/role` voit soit l'ancien fichier, soit le nouveau, jamais un fichier tronqué.
 *
 * @param {string} text contenu déjà validé
 * @returns {string} le chemin du fichier écrit
 */
function saveAdherentsCsv(text) {
    ensureDataDir();
    const tmpPath = `${ADHERENTS_FILE}.${process.pid}.tmp`;
    try {
        fs.writeFileSync(tmpPath, text, {encoding: 'utf8'});
        fs.renameSync(tmpPath, ADHERENTS_FILE);
    } catch (err) {
        fs.rmSync(tmpPath, {force: true});
        throw err;
    }
    return ADHERENTS_FILE;
}

module.exports = {
    CsvValidationError,
    MAX_BYTES,
    assertContentType,
    assertFileName,
    saveAdherentsCsv,
    validateAdherentsCsv,
};
