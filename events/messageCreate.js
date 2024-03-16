const {Events} = require('discord.js');
const {log, countNumberOfWordsInDictionary} = require("../utils/utils");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {

    let dictionary =
        [
            [ "cotisation", "cotiser", "cotisant", "role", "discord", "cotise", "avoir", "attendre", "attente" ],
            [ 2, 3, 2.5, 5, 1.5, 3, 0.5, 0.5, 0.5 ]
        ];

    let replyMessage =
        "Bonjour, il semblerait que vous ayez un problème de rôle sur le discord. Si c'est le cas:" +
        "\n- Si ça fait plus de 4 jours que vous attendez, contactez '@Jules - Respo Info' en MP" +
        "\n- Sinon patientez." +
        "\nSi le problème n'est pas celui la, vous pouvez toujours le contacter" +
        "\n\nMerci !";

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
        log("Message privé de " + message.author.username + " contenu : " + message.content);
      } else {
        const {attribution_sports} = require(`../serveur/channels/channels_${message.guild.id}.json`);

        // Ignore all messages not in the attribution_sports channel
        if (message.channelId === attribution_sports) {
          message.delete();
          return;
        }
        let numberOfWordsInDictionary = countNumberOfWordsInDictionary(message.content, dictionary);
        let numberOfWords = message.content.split(' ').length;

        if (numberOfWordsInDictionary === 0) {
          return;
        }
        if (numberOfWords === 0) {

        } else if (numberOfWords <= 8) {
          if (numberOfWordsInDictionary/numberOfWords > 0.5) {
            await message.reply(replyMessage);
          }
        } else {
          if (numberOfWordsInDictionary/numberOfWords > 0.25) {
            await message.reply(replyMessage);
          }
        }
      }
    }
  },
};