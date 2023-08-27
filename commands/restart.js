const {SlashCommandBuilder, AttachmentBuilder, messageLink} = require('discord.js');
const {log} = require('../utils/utils');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Initialise le bot après un redémarrage')
    .setDefaultMemberPermissions(0)
    .addChannelOption(
      option =>
        option
          .setName('first_channel')
          .setDescription('Channel où se trouver le premier message')
          .setRequired(true)
    ),
  async execute(interaction) {
    let option_channel = interaction.options.getChannel('first_channel');
    let message;
    let channel = await interaction.guild.channels.cache.get(option_channel.id);
    let response = '';

    if (channel.isTextBased) {
      message = channel.messages.fetch(channel.messages.lastMessageId);
      response = "Tout est bon !";
    } else {
      response = "Le Channel n'est pas bon";
    }
    const {commandes} = require(`../serveur/channels/channels_${interaction.guild.id}.json`);
    // Envoi des stats
    if (commandes === undefined) {
      log("Aucun salon 'commandes'");
    } else {
      channel = interaction.guild.channels.cache.get(commandes);
    }

    interaction.reply({content: response, ephemeral: false});

    setInterval(function () {
      channel.send("bds!stats!autoupdate")
      channel.send("I am updating every 10 hours")
    }, 10 * 3600000);
  },
};