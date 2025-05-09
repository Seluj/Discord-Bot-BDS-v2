const {SlashCommandBuilder, PermissionFlagsBits, MessageFlags} = require('discord.js');
const {
    parseCSVFiles,
    affichageJoueur,
    log,
    sanitizeString,
    getDbDate,
    isCurrentDateBetween
} = require("../utils/utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('adherent')
        .setDescription('Réalise une recherche dans la bdd en fonction du nom ou du prénom')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
        .addSubcommand(subcommand =>
            subcommand
                .setName('prénom')
                .setDescription('Recherche par prénom')
                .addStringOption(option =>
                    option
                        .setName('prénom')
                        .setDescription('Prénom de la personne')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('nom')
                .setDescription('Recherche par nom')
                .addStringOption(option =>
                    option
                        .setName('nom')
                        .setDescription('Nom de la personne')
                        .setRequired(true))),
    async execute(interaction) {
        // Liste des étudiants contenus dans le fichier donné
        let etudiant = parseCSVFiles("./adherent.csv", ";");
        // Variables
        let option;        // option : option entrée par l'utilisateur
        let data;       // information à comparer avec l'option, récupérée dans le fichier des étudiants
        let finalResultString = "";   // Résultat final avec tous les étudiants qui correspondent à la recherche
        let numberOfStudentFind = 0;     // Nombre d'étudiants trouvé


        const {logs} = require(`../serveur/channels/channels_${interaction.guild.id}.json`);
        await interaction.reply({content: "Recherche en cours...", flags: MessageFlags.Ephemeral});

        let channel_logs = null;
        if (logs === undefined) {
            log("Aucun salon 'logs'", null);
        } else {
            channel_logs = interaction.guild.channels.cache.get(logs);
        }

        // Récupération de la date de la base de données
        let dbDate = getDbDate(etudiant);
        if (dbDate === null || dbDate === undefined) {
            dbDate = "**<Unknown>**";
        } else {
            dbDate = `**${dbDate}**`;
        }

        //Construction du résultat en fonction du nom ou du prénom


        // Test pour la subCommand "prenom"
        if (interaction.options.getSubcommand() === "prénom") {
            option = interaction.options.getString('prénom');
            await interaction.followUp({
                content: `Recherche du prénom : ${option}\n(Date base de données ${dbDate})`,
                flags: MessageFlags.Ephemeral
            });
            option = sanitizeString(option);
            for (let i = 0; i < etudiant.length; i++) {
                data = sanitizeString(etudiant[i][1]);
                if (data.includes(option)) {
                    finalResultString += affichageJoueur(etudiant[i], isCurrentDateBetween(etudiant[i][2], etudiant[i][3], etudiant[i][0]));
                    numberOfStudentFind++;
                }
            }

            // Test pour la subCommand "nom"
        } else if (interaction.options.getSubcommand() === "nom") {
            option = interaction.options.getString('nom');
            await interaction.followUp({
                content: `Recherche du nom : ${option}\n(Date base de données ${dbDate})`,
                flags: MessageFlags.Ephemeral
            });
            log(`Recherche du nom : ${option}`, channel_logs);
            option = sanitizeString(option);
            for (let i = 0; i < etudiant.length; i++) {
                data = sanitizeString(etudiant[i][0]);
                if (data.includes(option)) {
                    finalResultString += affichageJoueur(etudiant[i], isCurrentDateBetween(etudiant[i][2], etudiant[i][3], etudiant[i][0]));
                    numberOfStudentFind++;
                }
            }
        }
        finalResultString += `Nombre trouvé : ${numberOfStudentFind}`;

        // Contrôle de la longueur puisque discord limite à 2000 caractères
        let str_length = finalResultString.length;
        let tmp_str = [];
        let divide_number = Math.trunc(str_length / 2000) + 1;
        for (let i = 0; i < divide_number; i++) {
            tmp_str[i] = finalResultString.slice((str_length / divide_number) * i, (str_length / divide_number) * (i + 1));
        }

        // Écriture du résultat
        for (let i = 0; i < tmp_str.length; i++) {
            await interaction.followUp({content: tmp_str[i], flags: MessageFlags.Ephemeral});
            log(tmp_str[i], channel_logs);
        }
    },
};

