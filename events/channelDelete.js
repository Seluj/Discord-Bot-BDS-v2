const {Events} = require('discord.js');
const {channelFiles} = require("../utils/channels_files");
const {log} = require('../utils/utils');

module.exports = {
  name: Events.ChannelDelete,
  async execute(channel) {
    log(`Salon ${channel.name} supprimé, mise a jour du fichier...`, null);
    channelFiles(channel.guild);
  },
};