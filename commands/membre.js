const {SlashCommandBuilder, PermissionFlagsBits, MessageFlags} = require('discord.js');
const {affichageMembre, normalizeName, log} = require("../utils/utils");

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
        await interaction.reply({content: `Recherche de : ${opt}`, flags: MessageFlags.Ephemeral});
        opt = normalizeName(opt);

        // On attend le chargement des membres avant de construire le résultat.
        const members = await interaction.guild.members.fetch();
        for (const member of members.values()) {
            displayName = normalizeName(member.displayName);
            if (opt !== "" && displayName.includes(opt)) {
                nb++;
                str += affichageMembre(member);
            }
        }

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
            await interaction.followUp({content: tmp_str[i], flags: MessageFlags.Ephemeral});
        }
    },
};