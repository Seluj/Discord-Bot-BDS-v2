const fs = require("node:fs");
const {parse} = require("csv-parse");
const {resolve} = require("path");
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
    "🧃", "🔥"
  ];
const {readdir} = require('fs').promises;

/**
 * Parse CSV files function
 * @param path where to find the csv file
 * @param separator separator to parse
 * @returns {*[]} data that is contains in the csv file
 */
function parseCSVFiles(path, separator) {
  let data = [];
  fs.createReadStream(path)
    .pipe(
      parse({
        delimiter: separator,
        columns: false,
        ltrim: true,
      })
    )
    .on("data", function (row) {
      data.push(row);
    });
  return data;
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
 * Test si la date passée en paramètre est plus grande que la date du jour de lancement de la commande
 * @param date Date à vérifier
 * @returns {boolean} true si la date est plus grande que celle courante false sinon
 */
function checkDate(date) {
  /*
  let tmp = date.split(' ');
  if (tmp[0] === "")
    return false;
  */
  let tmp = date.split('-');
  let year_cotis = tmp[0];
  let month_cotis = tmp[1];
  let day_cotis = tmp[2];

  let returned;
  let today = new Date();
  let day = String(today.getDate()).padStart(2, '0');
  let month = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  let year = today.getFullYear();

  day = parseInt(day);
  month = parseInt(month);
  year = parseInt(year);
  day_cotis = parseInt(day_cotis);
  month_cotis = parseInt(month_cotis);
  year_cotis = parseInt(year_cotis);

  if (year > year_cotis) {
    returned = false;
  } else {
    if (year === year_cotis) {
      if (month > month_cotis) {
        returned = false;
      } else {
        if (month === month_cotis) {
          returned = day <= day_cotis;
        } else {
          returned = true;
        }
      }
    } else {
      returned = true;
    }
  }
  return returned;
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
  let date = joueur[2].split(' ');
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

async function* getFiles(dir) {
  const dirents = await readdir(dir, {withFileTypes: true});
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sanitizeString(str) {
  str = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return str;
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
  let dbDate;
  let find = false;
  let i = 0;
  do {
    if(table[i][1] === "Base de données") {
      dbDate = table[i][2];
      find = true;
    }
    i++;
  } while (!find && i < table.length);
  return convertDate(dbDate);
}

function convertDate(date) {
  let tmp = date.split('-');
  let year = tmp[0];
  let month = tmp[1];
  let day = tmp[2];
  return `${day}/${month}/${year}`;
}

module.exports = {
  checkDate,
  affichageJoueur,
  parseCSVFiles,
  checkRole,
  deleteOldestFiles,
  replace,
  checkName,
  log,
  getFiles,
  affichageMembre,
  getRndInteger,
  sanitizeString,
  removeAllNonLetter,
  toChannelName,
  countNumberOfWordsInDictionary,
  getDbDate,
  convertDate
};