const {Events} = require('discord.js');
const {log} = require('../utils/utils');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    const {départ, logs, commandes} = require(`../serveur/channels/channels_${member.guild.id}.json`);

    let channel_logs = null;
    if (logs === undefined) {
      log("Aucun salon 'logs'", null);
    } else {
      channel_logs = member.guild.channels.cache.get(logs);
    }

    log(`${member.user.tag} a quitté le serveur ${member.guild.name}`, channel_logs);

    // Notification sur le discord
    if (départ === undefined) {
      log("Aucun salon 'arrivée'");
    } else {
      let channel = member.guild.channels.cache.get(départ);
      channel.send(`${member.user.tag} joined`);
    }

    if (commandes === undefined) {
      log("Aucun salon 'commandes'");
    } else {
      let channel = member.guild.channels.cache.get(commandes);
      channel.send(`bds!stats!leave`);
    }
  },
};