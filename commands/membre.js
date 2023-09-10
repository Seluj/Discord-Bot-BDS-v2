const {SlashCommandBuilder, PermissionFlagsBits} = require('discord.js');
const {affichageMembre, log} = require("../utils/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('membre')
    .setDescription('Réalise une recherche dans le serveur en fonction du nom ou du prénom')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
    .addStringOption(option =>
      option.setName('option')
        .setDescription('Objet de la recherche')
        .setRequired(true)),
  async execute(interaction) {
    // Liste des étudiants contenus dans le fichier donné
    // Variables
    let displayName; // Nom d'affichage de l'étudiant
    let opt;        // option : option entrée par l'utilisateur
    let str = "";   // Résultat final avec tous les étudiants qui correspondent à la recherche
    let nb = 0;     // Nombre d'étudiants trouvé


    const {logs} = require(`../serveur/channels/channels_${interaction.guild.id}.json`);

    let channel_logs = null;
    if (logs === undefined) {
      log("Aucun salon 'logs'", null);
    } else {
      channel_logs = interaction.guild.channels.cache.get(logs);
    }

    //Construction du résultat en fonction du nom ou du prénom

    // Test pour la subCommand "prenom"
    opt = interaction.options.getString('option');
    opt = opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    interaction.guild.members.fetch().then(members => {
      const membreListe = members.map(m => m);
      for (const member of membreListe) {
        displayName = member.displayName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (displayName.includes(opt)) {
          nb++;
          str += affichageMembre(member);
        }
      }
    });

    await interaction.reply({content: `Recherche de : ${opt}`, ephemeral: true});

    str += `Nombre trouvé : ${nb}`;

    // Contrôle de la longueur puisque discord limite à 2000 caractères
    let str_length = str.length;
    let tmp_str = [];
    let divide_number = Math.trunc(str_length / 2000) + 1;
    for (let i = 0; i < divide_number; i++) {
      tmp_str[i] = str.slice((str_length / divide_number) * i, (str_length / divide_number) * (i + 1));
    }

    // Écriture du résultat
    for (let i = 0; i < tmp_str.length; i++) {
      await interaction.followUp({content: tmp_str[i], ephemeral: true});
    }
  },
};