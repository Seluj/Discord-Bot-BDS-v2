const {SlashCommandBuilder} = require('discord.js');
const {parseCSVFiles, checkDate, checkRole} = require("../utils/utils");

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
    let roleId = interaction.options.getRole('role_id');
    let etudiant = parseCSVFiles("./adherent.csv", ";");

    // Si l'option roleId n'est pas donnée
    if (roleId === null) {
      let membersWithRole,  // Les membres qui ont un role
        membersID,          // L'ID des membres
        membersDisplayName, // Le nom d'affichage des membres
        membersList,        // Les informations des membres
        studentName,        // Le nom et le prénom d'un étudiant (prénom nom)
        pseudoDiscord,      //
        nbCotisant,         //
        nbNonCotisant,      //
        nbMembres;          //

      // Récupération des IDs des rôles
      const {
        Cotisants,          // Les cotisants
        Attente_Cotisant,   // Les non cotisants
        Membre_du_Bureau,   // Les membres du bureau
        ESTA,               // Les membres de l'ESTA
        exception,          // Les membres qui ne sont pas pris en compte
      } = require(`../serveur/roles/role_${interaction.guild.id}.json`);

      membersWithRole = interaction.guild.roles.cache.get(Attente_Cotisant).members;

      membersID = membersWithRole.map(m => m.id);
      membersDisplayName = membersWithRole.map(m => m.displayName);
      membersList = membersWithRole.map(m => m);

      nbNonCotisant = membersDisplayName.length;

      for (let i = 0; i < membersID.length; i++) {
        if (checkRole(membersList[i], Membre_du_Bureau))
          continue;
        if (checkRole(membersList[i], ESTA))
          continue;
        if (checkRole(membersList[i], exception))
          continue;

        pseudoDiscord = membersDisplayName[i];
        pseudoDiscord = pseudoDiscord.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let j = 0;
        let trouve = false;
        while (j < etudiant.length && trouve === false) {
          studentName = etudiant[j][1] + ' ' + etudiant[j][0];
          studentName = studentName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (studentName === pseudoDiscord)
            trouve = true;
          else
            j++;
        }
        if (trouve === true) {
          if (checkDate(etudiant[j][2]) === true) {
            membersList[i].roles.add(Cotisants);
            membersList[i].roles.remove(Attente_Cotisant);
            nbNonCotisant--;
          }
        }
      }


      membersWithRole = interaction.guild.roles.cache.get(Cotisants).members;

      membersID = membersWithRole.map(m => m.id);
      membersDisplayName = membersWithRole.map(m => m.displayName);
      membersList = membersWithRole.map(m => m);

      nbCotisant = membersDisplayName.length;

      for (let i = 0; i < membersID.length; i++) {
        if (checkRole(membersList[i], Membre_du_Bureau))
          continue;
        if (checkRole(membersList[i], ESTA))
          continue;
        if (checkRole(membersList[i], exception))
          continue;

        pseudoDiscord = membersDisplayName[i];
        pseudoDiscord = pseudoDiscord.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let j = 0;
        let trouve = false;
        while (j < etudiant.length && trouve === false) {
          studentName = etudiant[j][1] + ' ' + etudiant[j][0];
          studentName = studentName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (studentName === pseudoDiscord)
            trouve = true;
          else
            j++;
        }
        if (trouve === true) {
          if (checkDate(etudiant[j][2]) === false) {
            membersList[i].roles.add(Attente_Cotisant);
            membersList[i].roles.remove(Cotisants);
            nbCotisant--;
          }
        } else {
          membersList[i].roles.add(Attente_Cotisant);
          membersList[i].roles.remove(Cotisants);
          nbCotisant--;
        }
      }

      nbMembres = interaction.guild.memberCount;

      await interaction.followUp(`Sur **${nbMembres}** membres:\n> **${nbCotisant}** sont cotisants\n> **${nbNonCotisant}** sont non cotisants\nMerci !`);


    } else {
      let nbTotal;
      interaction.guild.members.fetch()
        .then((members) => {
          let membersList = members.map(m => m);
          for (let i = 0; i < membersList.length; i++) {
            if (checkRole(membersList[i], roleId.id))
              nbTotal++;
          }
          interaction.editReply(`Il y a ${nbTotal} membres avec le role "${roleId.name}"`);
        })
        .catch(console.error);
    }
  },
};