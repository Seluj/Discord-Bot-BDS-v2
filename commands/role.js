const {SlashCommandBuilder} = require('discord.js');
const {parseCSVFiles, getDbDate, checkRole, isCurrentDateBetween, normalizeName, log} = require("../utils/utils");
const {ADHERENTS_FILE} = require("../utils/paths");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Modifie les rôles de chaque membre pour chaque rôle sinon donne le nombre du rôle donné')
        .setDefaultMemberPermissions(0)
        .addRoleOption(option => option
            .setName('role_id')
            .setDescription('ID du role à chercher')
            .setRequired(false)), async execute(interaction) {

        //Variables
        let roleId = interaction.options.getRole('role_id');
        let etudiant = parseCSVFiles(ADHERENTS_FILE, ";");
        await interaction.deferReply();

        let dbDate = getDbDate(etudiant);
        if (dbDate === null || dbDate === undefined) {
            dbDate = "**<Unknown>**";
        } else {
            dbDate = `**${dbDate}**`;
        }

        // Si l'option roleId n'est pas donnée
        if (roleId === null) {
            let membersWithRole,  // Les membres qui ont un role
                membersID,          // L'ID des membres
                membersDisplayName, // Le nom d'affichage des membres
                membersList,        // Les informations des membres
                studentName,        // Le nom et le prénom d'un étudiant (prénom nom)
                pseudoDiscord,      //
                nbCotisant = 0,     //
                nbNonCotisant = 0,  //
                nbMembres = 0;      //

            // Récupération des IDs des rôles
            const {
                Cotisants,          // Les cotisants
                Attente_Cotisant,   // Les non cotisants
                Membre_du_Bureau,   // Les membres du bureau
                ESTA,               // Les membres de l'ESTA
                exception,          // Les membres qui ne sont pas pris en compte
            } = require(`../serveur/roles/role_${interaction.guild.id}.json`);

            // Le cache ne contient pas forcément tous les membres : on les charge tous.
            await interaction.guild.members.fetch();

            membersWithRole = interaction.guild.roles.cache.get(Attente_Cotisant).members;

            membersID = membersWithRole.map(m => m.id);
            membersDisplayName = membersWithRole.map(m => m.displayName);
            membersList = membersWithRole.map(m => m);

            nbNonCotisant = membersDisplayName.length;

            await interaction.followUp(`En cours de traitement...`);

            const studentsByName = new Map();
            for (const student of etudiant) {
                if (student.length < 4) continue;
                const key = normalizeName(`${student[1]} ${student[0]}`);
                const known = studentsByName.get(key);
                if (!known || !isCurrentDateBetween(known[2], known[3], known[0])) {
                    studentsByName.set(key, student);
                }
            }
            const findStudent = (member) => studentsByName.get(normalizeName(member.displayName));

            // Traitement des membres
            for (const member of membersList) {
                // Ignorer les membres avec des rôles spéciaux
                if (checkRole(member, Membre_du_Bureau) ||
                    checkRole(member, ESTA) ||
                    checkRole(member, exception)) continue;

                // Recherche de l'étudiant correspondant
                const matchingStudent = findStudent(member);

                // Si correspondance trouvée et date valide, mise à jour des rôles
                if (matchingStudent && isCurrentDateBetween(matchingStudent[2], matchingStudent[3], matchingStudent[0])) {
                    member.roles.add(Cotisants);
                    member.roles.remove(Attente_Cotisant);
                    nbCotisant++;
                    nbNonCotisant--;
                }
            }


            membersWithRole = interaction.guild.roles.cache.get(Cotisants).members;

            membersID = membersWithRole.map(m => m.id);
            membersDisplayName = membersWithRole.map(m => m.displayName);
            membersList = membersWithRole.map(m => m);

            nbCotisant += membersDisplayName.length;

            // Traitement des membres cotisants
            for (const member of membersList) {
                // Ignorer les membres avec des rôles spéciaux
                if (checkRole(member, Membre_du_Bureau) ||
                    checkRole(member, ESTA) ||
                    checkRole(member, exception)) continue;

                // Recherche de l'étudiant correspondant
                const matchingStudent = findStudent(member);

                // Si correspondance trouvée, mais date non valide OU si aucune correspondance
                if ((matchingStudent && !isCurrentDateBetween(matchingStudent[2], matchingStudent[3], matchingStudent[0])) ||
                    !matchingStudent) {
                    member.roles.add(Attente_Cotisant);
                    member.roles.remove(Cotisants);
                    nbCotisant--;
                    nbNonCotisant++;
                }
            }

            nbMembres = interaction.guild.memberCount;

            await interaction.followUp(`Sur **${nbMembres}** membres:\n> **${nbCotisant}** sont cotisants\n> **${nbNonCotisant}** sont non cotisants\nDate de la base : ${dbDate}\nMerci !`);


        } else {
            const members = await interaction.guild.members.fetch();
            const nbTotal = members.filter(m => checkRole(m, roleId.id)).size;
            await interaction.editReply(`Il y a ${nbTotal} membres avec le role "${roleId.name}"\nDate de la base : ${dbDate}`);
        }
    },
};