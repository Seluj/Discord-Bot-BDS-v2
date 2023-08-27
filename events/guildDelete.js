const {Events} = require('discord.js');
const fs = require('node:fs');
const {log} = require('../utils/utils');

module.exports = {
  name: Events.GuildDelete,
  execute(guild) {
    log(`Le serveur ${guild.name} a été quitté`, null);
    const r_file = fs.readdirSync('./serveur/roles').filter(file => file.endsWith(`${guild.id}.json`));
    const c_file = fs.readdirSync('./serveur/channels').filter(file => file.endsWith(`${guild.id}.json`));
    fs.unlink('./roles/' + r_file, (err) => {
      if (err)
        throw err;
    });
    fs.unlink('./channels/' + c_file, (err) => {
      if (err)
        throw err;
    });
  },
};