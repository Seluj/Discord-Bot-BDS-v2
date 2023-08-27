const {SlashCommandBuilder} = require('discord.js');
const {checkRole} = require("../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Mets a jour les statisques du serveur')
    .setDefaultMemberPermissions(0),
  async execute(interaction) {
    let membersList;
    let nb_total = 0, nb_coti = 0, nb_non_coti = 0, nb_esta = 0, nb_reste = 0, nb_bot = 0;

    // Récupération des IDs des rôles
    const {Cotisants, Attente_Cotisant, ESTA} = require(`../serveur/roles/role_${interaction.guild.id}.json`);

    // Récupération des membres
    interaction.guild.members.fetch()
      .then((members) => {
        membersList = members.map(m => m);

        // Comptage des membres en fonction de leur rôle Cotisant, Non Cotisant ou ESTA
        for (let i = 0; i < membersList.length; i++) {
          nb_total++;
          if (checkRole(membersList[i], Cotisants))
            nb_coti++;
          else if (checkRole(membersList[i], Attente_Cotisant))
            nb_non_coti++;
          else if (checkRole(membersList[i], ESTA))
            nb_esta++;
          else if (membersList[i].user.bot)
            nb_bot++;
        }

        // Calcul du nombre de membres non renommés
        nb_reste = nb_total - (nb_coti + nb_non_coti + nb_esta + nb_bot);

        // Envoi du message
        interaction.reply(`Sur **${nb_total}** membres:\n> **${nb_coti}** sont cotisants\n> **${nb_non_coti}** sont non cotisants\n> **${nb_reste}** ne sont pas renommés\n> **${nb_esta}** sont de l'ESTA\n> **${nb_bot}** sont des bots\nMerci !`);

        // Mise à jour des noms des channels
        let channel = interaction.guild.channels.cache.get('1069747433950683208');
        channel.setName(`🏃 Cotisants : ${nb_coti}`);

        channel = interaction.guild.channels.cache.get('1069748971100196986');
        channel.setName(`🌴 Non Cotisants : ${nb_non_coti}`);

        channel = interaction.guild.channels.cache.get('1069934157662277723');
        channel.setName(`💀 Unknown : ${nb_reste}`);

        channel = interaction.guild.channels.cache.get('1069749123022061689');
        channel.setName(`🌍 Total : ${nb_total - nb_bot}`);
      })
      .catch(console.error);
  },
};