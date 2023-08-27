const {Events} = require('discord.js');
const {channelFiles} = require("../utils/channels_files");
const {rolesFiles} = require("../utils/roles_files");
const {log} = require('../utils/utils');


module.exports = {
  name: Events.GuildCreate,
  execute(guild) {
    log(`Le serveur ${guild.name} a été rejoins`, null);
    rolesFiles(guild);
    channelFiles(guild);
  },
};