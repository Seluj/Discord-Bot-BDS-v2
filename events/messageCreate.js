const {Events} = require('discord.js');
const {log} = require("../utils/utils");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {

    if (message.content.startsWith('bds!')) {
      // Ignore all human messages
      if (!message.author.bot && message.member.user.tag !== "jul.e.s") return;

      let temp = message.content.split('!')[1];
      let command = message.client.commands.get(temp);
      try {
        await command.execute(message);
      } catch (error) {
        console.error(`Error executing command ${command}`);
        console.error(error);
      }
    } else {
      // Ignore all bot messages
      if (message.author.bot) return;
      if (!message.guild) {
        message.reply('Je ne suis pas encore prêt pour les messages privés, désolé !');
        log("Message privé de " + message.member.user.tag + " contenu : " + message.content);
      } else {
        const {attribution_sports} = require(`../serveur/channels/channels_${message.guild.id}.json`);

        // Ignore all messages not in the attribution_sports channel
        if (message.channelId === attribution_sports) {
          message.delete();
        }
      }
    }
  },
};