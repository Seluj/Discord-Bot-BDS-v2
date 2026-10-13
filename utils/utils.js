const fs = require("node:fs");
const {parse} = require("csv-parse/sync");
const excludeCharactere =
    [
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "/", "(", ")", " - ", "{", "}", "[", "]", ":",
        "😀", "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😗", "🥰", "😘", "😍", "😎", "😋", "😊", "😉", "😙", "😚",
        "☺", "🙂", "🤗", "🤩", "🤔", "🤨", "😮", "😥", "😣", "😏", "🙄", "😶", "😑", "😐", "🤐", "😯", "😪", "😫",
        "🥱", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓", "😔", "😕", "🙃", "😤", "😟", "😞", "😖", "🙁", "☹",
        "😲", "🤑", "😢", "😭", "😦", "😧", "😨", "😩", "🤯", "😬", "🥴", "😵", "🤪", "😳", "🥶", "🥵", "😱", "😰",
        "😠", "😡", "🤬", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇", "🥳", "🥺", "🤠", "🤡", "🤥", "🤫", "💀", "👺",
        "👹", "👿", "😈", "🤓", "🧐", "🤭", "☠", "👻", "👽", "👾", "🤖", "💩", "😺", "😸", "🐱", "👤", "😾", "😿",
        "🙀", "😽", "😼", "😻", "😹", "🐱", "🏍", "🐱", "💻", "🐱", "🐉", "🐱", "👓", "🐱", "🚀", "🙈", "🙉", "🙊",
        "🦊", "🦒", "🐯", "🦁", "🐱", "🐺", "🐶", "🐵", "🦝", "🐮", "🐷", "🐗", "🐭", "🐹", "🐰", "🐻", "🐲", "🐔",
        "🦄", "🐴", "🦓", "🐸", "🐼", "🐨", "🐽", "🐾", "🐒", "🦍", "🦧", "🦮", "🦺", "🐩", "🐕", "🐈", "🐅", "🐆",
        "🐎", "🦌", "🦏", "🦛", "🐪", "🐐", "🐑", "🐏", "🐖", "🐄", "🐃", "🐂", "🐫", "🦙", "🦘", "🦥", "🦨", "🦡",
        "🐘", "🐁", "🐍", "🐢", "🐊", "🦎", "🐿", "🐇", "🦔", "🐀", "🐉", "🦕", "🦖", "🦦", "🦈", "🐬", "🐳", "🐋",
        "🦀", "🦞", "🐙", "🦑", "🦐", "🐡", "🐠", "🐟", "🐚", "🦆", "🐓", "🦃", "🦅", "🕊", "🦢", "🦜", "🐣", "🐤",
        "🐥", "🐧", "🐦", "🦉", "🦚", "🦩", "🦇", "🦋", "🐌", "🐛", "🦟", "🦗", "🐜", "🐝", "🗣", "🧞", "♂", "♀", "🦠",
        "🕸", "🕷", "🦂", "🐞", "👥", "👁", "👀", "🦴", "🦷", "👅", "👄", "🤼", "️", "⛷", "🤺", "👣", "🦿", "🦾", "🧠",
        "👯", "👩", "❤", "💑", "👨", "💏", "💋", "👧", "👦", "👪", "👭", "🏻", "🤝", "🏼", "🏽", "🏿", "🏾", "👫", "🧑", "👬",
        "🧃", "🔥", "⛺", "☁", "🌪", "🌈", "🌞", "🌝", "🌚", "🌛", "🌜", "🌙", "🌘", "🌗", "🌖", "🌕", "🌔", "🌓", "🌒", "🇩🇿",
        "🇦🇩", "🇦🇪", "🇦🇫", "🇦🇬", "🇦🇷", "🇦🇸", "🇦🇹", "🇦🇺", "🇦🇼", "🇦🇽", "🇦🇾", "🇧🇦", "🇧🇧", "🇧🇩", "🇧🇪",
        "🇧🇫", "🇧🇬", "🇧🇭", "🇧🇮", "🇧🇯", "🇧🇱", "🇧🇲", "🇧🇳", "🇧🇴", "🇧🇶", "🇧🇷", "🇧🇸", "🇧🇹", "🇻🇬", "🇻🇨",
        "🇻🇪", "🇻🇺", "🇾🇪", "🇾🇹", "🇿🇦", "🇿🇲", "🇿🇼", "🇦🇴", "🇦🇶", "🇦🇷", "🇦🇸", "🇧🇧", "🇧🇩", "🇧🇪", "🎾", "🏀", "🏐", "🎮"
    ];

/**
 * Parse CSV files function
 *
 * Lecture synchrone : les commandes exploitent le tableau juste après l'appel,
 * une lecture en flux le renverrait encore vide (ou incomplet).
 * @param path where to find the csv file
 * @param separator separator to parse
 * @returns {*[]} data that is contains in the csv file
 */
function parseCSVFiles(path, separator) {
    return parse(fs.readFileSync(path, 'utf8'), {
        bom: true,
        delimiter: separator,
        columns: false,
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
    });
}

/**
 * Vérifie pour un étudiant donné s'il possède le role passé en paramètre
 * @param etudiant etudiant a checker
 * @param id_role role a chécker
 * @returns {boolean} retourne true si
 */
function checkRole(etudiant, id_role) {
    if (id_role === "null") {
        return etudiant.roles.cache.size === 1;
    } else {
        return etudiant.roles.cache.some(role => role.id === id_role);
    }
}

/**
 * Vérifie si le nom corresponds à "zea zea *" (* signifiant n'importe quoi)
 * @param name nom a verifier
 * @returns {boolean} true si le nom corresponds false sinon
 */
function checkName(name) {
    let nb = name.split(' ');
    if (nb.length >= 2) {
        return checkCharacter(name, excludeCharactere);
    } else {
        return false;
    }
}

function checkCharacter(name, characters) {
    let returned = true;
    if (Array.isArray(characters)) {
        for (let i = 0; i < characters.length; i++) {
            if (name.indexOf(characters[i]) !== -1)
                returned = false;
        }
    } else {
        if (name.indexOf(characters) !== -1)
            returned = false;
    }
    return returned;
}

/**
 * Convertit une date en format YYYY-MM-DD en format DD/MM/YYYY
 * @returns {string}
 */
Date.prototype.yyyymmdd = function () {
    const mm = this.getMonth() + 1; // getMonth() is zero-based
    const dd = this.getDate();

    return [this.getFullYear(),
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd
    ].join('-');
};

/**
 * Check if the current date is between the start and end dates
 * @param {string} startDate - The start date in the format YYYY-MM-DD
 * @param {string} endDate - The end date in the format YYYY-MM-DD
 * @param name - The lastname of the student
 * @returns {boolean} - True if the current date is between the start and end dates, false otherwise
 */
function isCurrentDateBetween(startDate, endDate, name) {
    const currentDate = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    //if (returned === false) {
    //    log("Name:" + name + " CurrentDate:" + currentDate.yyyymmdd() + " StartDate:" + start.yyyymmdd() + " EndDate:" + end.yyyymmdd() + " Result:" + returned, null);
    //}
    return currentDate >= start && currentDate <= end;
}

/**
 * Créer une chaine de caractère préte à être affiché ensuite avec les informations d'un joueur.
 * En fonction du boolean, la date va être en gras si true et normal si false
 * @param joueur Joueur à afficher
 * @param boolean pour décorer la date
 * @returns {string} retourne la chaine de caractère pour affichage
 */
function affichageJoueur(joueur, boolean) {
    let returned;
    let date = joueur[3].split(' ');
    if (date[0] === "") {
        date[0] = "null";
    }
    if (boolean === true) {
        returned = `__Trouvé__:\n> **Nom : ${joueur[0]}\n> Prénom : ${joueur[1]}\n> Date : ${convertDate(date[0])}**\n`;
    } else {
        returned = `__Trouvé__:\n> Nom : ${joueur[0]}\n> Prénom : ${joueur[1]}\n> Date : ${convertDate(date[0])}\n`;
    }
    return returned;
}

function affichageMembre(membre) {
    let returned;
    returned = `__${membre.displayName}__:\n`;
    let roleName = "";
    membre.roles.cache.map(role => {
        if (role.name !== "@everyone")
            roleName += `> ${role}\n`;
    })
    returned += `Roles:\n${roleName}`;
    returned += `\n`;
    return returned;
}

/**
 * Modifie les caractères non-désirés : espace et -
 * @param string chaine à modifier
 * @returns {string} chaine modifiée
 */
function replace(string) {
    let returned = string;
    for (let i = 0; i < returned.length; i++) {
        if (returned[i] === ' ')
            returned = replaceAt(returned, i, "_");
        if (returned[i] === '-')
            returned = replaceAt(returned, i, "_");
        if (returned[i] === '@')
            returned = replaceAt(returned, i, "");
        if (returned[i] === "'")
            returned = replaceAt(returned, i, "_");
    }
    return returned;
}

/**
 * Remplace un caractère d'une chaine à l'index donnée
 * @param str chaine à modifier
 * @param index index ou modifier le caractère
 * @param chr caractère de remplacement
 * @returns {string} chaine avec le caractère modifié
 */
function replaceAt(str, index, chr) {
    if (index > str.length - 1)
        return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
}

/**
 * Supprime tous les anciens fichiers pour éviter la multiplication et l'accumulation des données
 */
function deleteOldestFiles() {
    let dir = './serveur/';
    if (!fs.existsSync(dir)) {
        return;
    }

    let pathRoles = './serveur/roles/';
    let pathChannel = './serveur/channels/';
    if (!fs.existsSync(pathRoles) || !fs.existsSync(pathChannel)) {
        return;
    }

    const roles_files = fs.readdirSync(pathRoles).filter(file => file.startsWith('role_'));
    const channels_files = fs.readdirSync(pathChannel).filter(file => file.startsWith('channels_'));
    for (let i = 0; i < roles_files.length; i++) {
        fs.unlink(pathRoles + roles_files[i], (err) => {
            if (err)
                throw err;
        });
    }
    for (let i = 0; i < channels_files.length; i++) {
        fs.unlink(pathChannel + channels_files[i], (err) => {
            if (err)
                throw err;
        })
    }
    log(`${roles_files.length} fichier(s) de rôles et ${channels_files.length} fichier(s) de salons ont été supprimé`);
}


function log(message, channel_log) {
    let dir = './logs/';
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    let str = '';
    let date = new Date();
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    let year = date.getFullYear();
    let hour = String(date.getHours()).padStart(2, '0');
    let minute = String(date.getMinutes()).padStart(2, '0');
    let second = String(date.getSeconds()).padStart(2, '0');

    str += '[' + day + '/' + month + '/' + year + ' ' + hour + ':' + minute + ':' + second + '] ' + message;
    console.log(str);
    fs.appendFileSync(dir + 'logTimed.txt', str + '\n');
    fs.appendFileSync(dir + 'log.txt', message + '\n');

    if (channel_log !== undefined && channel_log !== null) {
        channel_log.send(str);
    }
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sanitizeString(str) {
    str = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return str;
}

/**
 * Lettres que la décomposition Unicode ne ramène pas à l'ASCII.
 */
const SPECIAL_LETTERS = {"œ": "oe", "æ": "ae", "ß": "ss", "ø": "o", "ł": "l", "đ": "d", "ð": "d", "þ": "th", "ı": "i"};

/**
 * Normalise un nom pour le comparer : insensible à la casse, aux accents, aux
 * polices « fantaisie » (𝐉𝐮𝐥𝐞𝐬, ｊｕｌｅｓ...) et à la ponctuation.
 * Les séparateurs (espaces, tirets, apostrophes...) sont supprimés, si bien que
 * « Marie-Laure », « marie laure » et « MarieLaure » donnent tous « marielaure ».
 * @param str chaine à normaliser
 * @returns {string} chaine normalisée (lettres et chiffres uniquement)
 */
function normalizeName(str) {
    return String(str ?? "")
        .normalize("NFKD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[œæßøłđðþı]/g, c => SPECIAL_LETTERS[c])
        .replace(/[^\p{L}\p{N}]/gu, "");
}

function removeAllNonLetter(str) {
    str = sanitizeString(str);
    str = str.replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "");
    return str;
}

function toChannelName(str) {
    let returnedString = "__" + str.replace(/\s/g, "-").replace(/[.,\/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase();
    if (returnedString.length > 50) {
        returnedString = returnedString.substring(0, 50);
    }
    returnedString += "__";
    return returnedString;
}

function countNumberOfWordsInDictionary(str, dictionary) {
    let count = 0;
    let words = str.split(' ');
    for (let word of words) {
        let sanitizedWord = removeAllNonLetter(word);
        if (dictionary[0].includes(sanitizedWord)) {
            count += dictionary[1][dictionary[0].indexOf(sanitizedWord)];
        }
    }
    return count;
}

function getDbDate(table) {
    const row = table.find(r => r[1] === "Base de données");
    if (row === undefined || !row[2]) {
        return null;
    }
    return convertDate(row[2]);
}

function convertDate(date) {
    let tmp = date.split('-');
    let year = tmp[0];
    let month = tmp[1];
    let day = tmp[2];
    return `${day}/${month}/${year}`;
}

module.exports = {
    isCurrentDateBetween,
    affichageJoueur,
    parseCSVFiles,
    checkRole,
    deleteOldestFiles,
    replace,
    checkName,
    log,
    affichageMembre,
    getRndInteger,
    normalizeName,
    toChannelName,
    countNumberOfWordsInDictionary,
    getDbDate,
};