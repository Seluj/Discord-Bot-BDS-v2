const fs = require("node:fs");
const {replace, log} = require('./utils');

/**
 * Create channel files for a given guild, compare if guild is a table or not
 * @param guild guild to check
 */
function channelFiles(guild) {
  if (Array.isArray(guild)) {
    for (let i = 0; i < guild.length; i++)
      createChannelFiles(guild[i]);
  } else {
    createChannelFiles(guild);
  }
}


/**
 * Create channel files for a given guild
 * @param guild guild to check
 */
function createChannelFiles(guild) {
  let dir = "./serveur/channels";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true});
  }

  let filename = "./serveur/channels/channels_" + guild.id + ".json";
  let channels_id = guild.channels.cache.map(m => m.id);
  let channels_name = guild.channels.cache.map((m => m.name));
  let data = '{\n';
  for (let j = 0; j < channels_id.length; j++) {
    data += ("\t\"" + replace(channels_name[j]) + "\"" + ": \"" + channels_id[j] + "\"");
    if (j !== channels_id.length - 1)
      data += ',\n';
    else
      data += '\n';
  }
  data += '}';
  fs.writeFile(filename, data, (err) => {
    if (err)
      throw err;
  })
  log(`Fichier de salons pour ${guild} est créé`);
}

module.exports = {
  channelFiles,
};