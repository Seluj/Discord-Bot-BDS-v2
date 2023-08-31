const {Events} = require('discord.js');

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

      const {attribution_sports} = require(`../serveur/channels/channels_${message.guild.id}.json`);

      // Ignore all messages not in the attribution_sports channel
      if (message.channelId === attribution_sports) {
        message.delete();
      }
    }
  },
};