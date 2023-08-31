const {SlashCommandBuilder, AttachmentBuilder} = require('discord.js');
const {log, checkRole} = require("../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('annual_reset')
    .setDescription("Suppression de l'ensemble des roles des utilisateurs pour reset")
    .setDefaultMemberPermissions(0),
  async execute(interaction) {

    if (interaction.member.user.id !== "234255301728141314" || interaction.member.user.tag !== "jul.e.s") {
      interaction.reply({content: "Vous n'avez pas la permission d'utiliser cette commande", ephemeral: true});
      return;
    }

    const {logs} = require(`../serveur/channels/channels_${interaction.guild.id}.json`);

    let channel_logs = null;
    if (logs === undefined) {
      log("Aucun salon 'logs' pour " + interaction.guild.id, null);
    } else {
      channel_logs = interaction.guild.channels.cache.get(logs);
    }

    let nb_change = 0;
    let membersList
    let array = [];

    const roles = require(`../serveur/roles/role_${interaction.guild.id}.json`);
    for (let key in roles) {
      if (roles.hasOwnProperty(key)) {
        array.push(roles[key]);
      }
    }

    const {
      Admin_Discord,
      Membre_du_Bureau,
      Bureau_Restreints,
      Anciens_du_Bureau,
      BDS_ESTA,
      Bots,
      ESTA,
      Bannis_inscriptions,
      exception,
      everyone
    } = require(`../serveur/roles/role_${interaction.guild.id}.json`);

    // -------------------------- Rôle à ne pas supprimer -------------------------- //
    array.splice(array.indexOf(Admin_Discord), 1);
    array.splice(array.indexOf(Membre_du_Bureau), 1);
    array.splice(array.indexOf(Bureau_Restreints), 1);
    array.splice(array.indexOf(Anciens_du_Bureau), 1);
    array.splice(array.indexOf(BDS_ESTA), 1);
    array.splice(array.indexOf(Bots), 1);
    array.splice(array.indexOf(ESTA), 1);
    array.splice(array.indexOf(Bannis_inscriptions), 1);
    array.splice(array.indexOf(exception), 1);
    array.splice(array.indexOf(everyone), 1);

    interaction.guild.members.fetch()
      .then((members) => {
        membersList = members.map(m => m);

        for (let i = 0; i < membersList.length; i++) {

          // -------------------------- Exception List -------------------------- //
          if (checkRole(membersList[i], Membre_du_Bureau))
            continue;
          if (checkRole(membersList[i], Bureau_Restreints))
            continue;
          if (checkRole(membersList[i], Bots))
            continue;
          if (checkRole(membersList[i], ESTA))
            continue;
          if (checkRole(membersList[i], Admin_Discord))
            continue;

          //ATTENTION CETTE PARTIE DETRUIT LE SERVEUR !!!!
          for (let j = 0; j < array.length; j++) {
            if (membersList[i].roles.cache.has(array[j])) {
              //membersList[i].roles.remove(array[j]);
              //console.log("Remove " + membersList[i].user.username + " from " + array[j]);
              nb_change++;
            }
          }
        }
        log("Total Change : " + nb_change, channel_logs);
        interaction.reply({content: "Total Change : " + nb_change, ephemeral: false});
      })
      .catch(console.error);
  },
};