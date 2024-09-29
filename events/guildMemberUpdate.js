const {Events} = require('discord.js');
const {checkRole, checkName, log} = require("../utils/utils");
const {addRole, deleteRole} = require("../utils/roles");


module.exports = {
    name: Events.GuildMemberUpdate,
    async execute(oldMember, newMember) {
        // Controle du changement de pseudo
        if (oldMember.displayName === newMember.displayName)
            return;

        const {
            changement_de_pseudo,
            logs,
            commandes
        } = require(`../serveur/channels/channels_${newMember.guild.id}.json`);
        const {
            Attente_Cotisant,
            Cotisants,
            Staff_Ski_UTBM,
            ESTA,
            Membre_du_Bureau,
            Bot,
            Bureau_Restreints
        } = require(`../serveur/roles/role_${newMember.guild.id}.json`);
        // Contrôles sur les rôles
        if (checkRole(newMember, Bot) || checkRole(newMember, Membre_du_Bureau) || checkRole(newMember, Bureau_Restreints) || checkRole(newMember, Staff_Ski_UTBM) || checkRole(newMember, ESTA))
            return;

        let channel_logs = null;
        if (logs === undefined) {
            log("Aucun salon 'logs'", null);
        } else {
            channel_logs = newMember.guild.channels.cache.get(logs);
        }

        log(`${newMember.user.tag} a changé son pseudo en ${newMember.displayName}`, channel_logs);

        // Notification sur le discord
        if (changement_de_pseudo === undefined) {
            log("Aucun Salon 'changement de pseudo'", channel_logs);
        } else {
            let channel = newMember.guild.channels.cache.get(changement_de_pseudo);
            channel.send(`${newMember.user.tag} a changé son pseudo en ${newMember.displayName}`);
        }

        // Mise en place des rôles
        if (Attente_Cotisant === undefined || Cotisants === undefined) {
            log("Pas de rôle 'Attente Cotisant' ou 'Cotisant'", channel_logs);
        } else {
            if (checkRole(newMember, Attente_Cotisant) || checkRole(newMember, Cotisants)) {
                deleteRole(newMember, Cotisants);
                if (checkName(newMember.displayName)) {
                    addRole(newMember, Attente_Cotisant);
                } else {
                    deleteRole(newMember, Attente_Cotisant);
                }
            }
        }

        // Envoi des stats
        if (commandes === undefined) {
            log("Aucun salon 'commandes'");
        } else {
            let channel = newMember.guild.channels.cache.get(commandes);
            channel.send(`bds!stats!update`);
        }
    },
};