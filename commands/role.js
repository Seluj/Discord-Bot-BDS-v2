const {SlashCommandBuilder} = require('discord.js');
const {parseCSVFiles, checkDate, checkRole} = require("../utils/utils");
const {addRole, deleteRole} = require('../utils/roles');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Modifie les rôles de chaque membre pour chaque rôle sinon donne le nombre du rôle donné')
    .setDefaultMemberPermissions(0)
    .addRoleOption(option =>
      option
        .setName('role_id')
        .setDescription('ID du role à chercher')
        .setRequired(false)),
  async execute(interaction) {

    //Variables
    await interaction.deferReply();
    let role_id = interaction.options.getRole('role_id');
    let etudiant = parseCSVFiles("./adherent.csv", ";");

    // Si l'option role_id n'est pas donnée
    if (role_id === null) {
      let membersWithRole, membersID, membersName, membersList, prenom_nom, pseudo_discord, tmp;

      // Récupération des IDs des rôles
      const {
        Cotisants,          // Les cotisants
        Attente_Cotisant,   // Les non cotisants
        Membre_du_Bureau,   // Les membres du bureau
        ESTA,               // Les membres de l'ESTA
        exception,          // Les membres qui ne sont pas pris en compte
        Respos_Créneaux,    // Les responsables de créneaux
      } = require(`../serveur/roles/role_${interaction.guild.id}.json`);

      membersWithRole = interaction.guild.roles.cache.get(Attente_Cotisant).members;
      membersID = membersWithRole.map(m => m.id);
      membersName = membersWithRole.map(m => m.displayName);
      membersList = membersWithRole.map(m => m);

      await interaction.followUp(`Il y a ${membersName.length} membres avec le role "Non cotisant"`);

      for (let i = 0; i < membersID.length; i++) {
        if (checkRole(membersList[i], Membre_du_Bureau))
          continue;
        if (checkRole(membersList[i], ESTA))
          continue;
        if (checkRole(membersList[i], exception))
          continue;

        pseudo_discord = membersName[i];
        pseudo_discord = pseudo_discord.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let j = 0;
        let trouve = false;
        while (j < etudiant.length && trouve === false) {
          prenom_nom = etudiant[j][1] + ' ' + etudiant[j][0];
          prenom_nom = prenom_nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          if (prenom_nom === pseudo_discord)
            trouve = true;
          else
            j++;
        }
        if (trouve === true) {
          if (checkDate(etudiant[j][2]) === true) {
            membersList[i].roles.add(Cotisants);
            membersList[i].roles.remove(Attente_Cotisant);
          }
        }
      }


      membersWithRole = interaction.guild.roles.cache.get(Cotisants).members;
      membersID = membersWithRole.map(m => m.id);
      membersName = membersWithRole.map(m => m.displayName);
      membersList = membersWithRole.map(m => m);

      await interaction.followUp(`Il y a ${membersName.length} membres avec le role "Cotisant"`);

      for (let i = 0; i < membersID.length; i++) {
        if (checkRole(membersList[i], Membre_du_Bureau))
          continue;
        if (checkRole(membersList[i], ESTA))
          continue;
        if (checkRole(membersList[i], exception))
          continue;

        pseudo_discord = membersName[i];
        pseudo_discord = pseudo_discord.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let j = 0;
        let trouve = false;
        while (j < etudiant.length && trouve === false) {
          prenom_nom = etudiant[j][1] + ' ' + etudiant[j][0];
          prenom_nom = prenom_nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (prenom_nom === pseudo_discord)
            trouve = true;
          else
            j++;
        }
        if (trouve === true) {
          if (checkDate(etudiant[j][2]) === false) {
            membersList[i].roles.add(Attente_Cotisant);
            membersList[i].roles.remove(Cotisants);
            if (checkRole(membersList[i], Respos_Créneaux)) {
              membersList[i].roles.remove(Respos_Créneaux);
            }
          }
        } else {
          membersList[i].roles.add(Attente_Cotisant);
          membersList[i].roles.remove(Cotisants);
          if (checkRole(membersList[i], Respos_Créneaux)) {
            membersList[i].roles.remove(Respos_Créneaux);
          }
        }
      }
    } else {
      interaction.guild.members.fetch()
        .then((members) => {
          let membersList = members.map(m => m);
          for (let i = 0; i < membersList.length; i++) {
            if (checkRole(membersList[i], role_id.id))
              nb_total++;
          }
          interaction.editReply(`Il y a ${nb_total} membres avec le role "${role_id.name}"`);
        })
        .catch(console.error);
    }
  },
};