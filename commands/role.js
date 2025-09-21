const {SlashCommandBuilder} = require('discord.js');
const {parseCSVFiles, getDbDate, checkRole, isCurrentDateBetween, log} = require("../utils/utils");

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
        let etudiant = parseCSVFiles("./adherent.csv", ";");
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

            membersWithRole = interaction.guild.roles.cache.get(Attente_Cotisant).members;

            membersID = membersWithRole.map(m => m.id);
            membersDisplayName = membersWithRole.map(m => m.displayName);
            membersList = membersWithRole.map(m => m);

            nbNonCotisant = membersDisplayName.length;

            await interaction.followUp(`En cours de traitement...`);

            const normalizeString = (str) => str
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace("---", "-")
                .replace("--", "-")
                .replace("'", "")
                .replace("’", "");

            // Traitement des membres
            for (const member of membersList) {
                // Ignorer les membres avec des rôles spéciaux
                if (checkRole(member, Membre_du_Bureau) ||
                    checkRole(member, ESTA) ||
                    checkRole(member, exception)) continue;

                const normalizedPseudo = normalizeString(member.displayName);

                // Recherche de l'étudiant correspondant
                const matchingStudent = etudiant.find(student => {
                    const normalizedStudentName = normalizeString(`${student[1]} ${student[0]}`);
                    return normalizedStudentName === normalizedPseudo;
                });

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

                const normalizedPseudo = normalizeString(member.displayName);

                // Recherche de l'étudiant correspondant
                const matchingStudent = etudiant.find(student => {
                    const prenom = student[1];
                    const nom = student[0];
                    const normalizedStudentName = normalizeString(`${prenom} ${nom}`);

                    return normalizedStudentName === normalizedPseudo;
                });

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
            let nbTotal;
            interaction.guild.members.fetch()
                .then((members) => {
                    let membersList = members.map(m => m);
                    for (let i = 0; i < membersList.length; i++) {
                        if (checkRole(membersList[i], roleId.id)) nbTotal++;
                    }
                    interaction.editReply(`Il y a ${nbTotal} membres avec le role "${roleId.name}\nDate de la base : ${dbDate}"`);
                })
                .catch(console.error);
        }
    },
};