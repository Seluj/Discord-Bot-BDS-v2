const {SlashCommandBuilder} = require('discord.js');
const {addRole, deleteRole} = require('../utils/roles');
const {log} = require("../utils/utils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sport')
        .setDescription('Mets a jour les sports')
        .addSubcommand(subcommand =>
            subcommand
                .setName('indoor')
                .setDescription('Mets a jour les sports intérieurs')
                .addStringOption(option =>
                    option
                        .setName('sport')
                        .setDescription('Sport à ajouter')
                        .setRequired(true)
                        .addChoices(
                            {name: 'Basket', value: 'Basket'},
                            {name: 'Badminton', value: 'Badminton'},
                            {name: 'Arts Martiaux', value: 'Arts Martiaux'},
                            {name: 'Boxe', value: 'Boxe'},
                            {name: 'Boxe Française', value: 'BoxeFr'},
                            {name: 'Futsal', value: 'Futsal'},
                            {name: 'Gymnastique', value: 'Gymnastique'},
                            {name: 'Handball', value: 'Handball'},
                            {name: 'Judo-Karaté', value: 'Judo-Karaté'},
                            {name: 'Kudo', value: 'Kudo'},
                            {name: 'Musculation', value: 'Musculation'},
                            {name: 'Natation', value: 'Natation'},
                            {name: 'Tennis de Table', value: 'Tennis-de-Table'},
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('outdoor')
                .setDescription('Mets a jour les sports extérieur')
                .addStringOption(option =>
                    option
                        .setName('sport')
                        .setDescription('Sport à ajouter')
                        .setRequired(true)
                        .addChoices(
                            {name: 'Athlétisme', value: 'Athlé'},
                            {name: 'Baseball', value: 'Baseball'},
                            {name: 'Course à Pied', value: 'CAP'},
                            {name: 'Course d\'Orientation', value: 'Course-Orientation'},
                            {name: 'Football', value: 'Football'},
                            {name: 'Football Américain', value: 'FootUS'},
                            {name: 'Golf', value: 'Golf'},
                            {name: 'Parkour', value: 'Parkour'},
                            {name: 'Randonnée', value: 'Randonnée'},
                            {name: 'Rugby', value: 'Rugby'},
                            {name: 'Skate', value: 'Skate'},
                            {name: 'Spikeball', value: 'Spikeball'},
                            {name: 'Street Workout', value: 'Street-Workout'},
                            {name: 'Tennis', value: 'Tennis'},
                            {name: 'Ultimate', value: 'Ultimate'},
                            {name: 'VTT', value: 'VTT'},
                            {name: 'Vélo', value: 'Velo'},
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('in-out')
                .setDescription('Mets a jour les sports qui peuvent se pratiquer à l\'intérieur comme à l\'extérieur')
                .addStringOption(option =>
                    option
                        .setName('sport')
                        .setDescription('Sport à ajouter')
                        .setRequired(true)
                        .addChoices(
                            {name: 'Créneau Féminin', value: 'Créneau Féminin'},
                            {name: 'Escalade', value: 'Escalade'},
                            {name: 'Volleyball', value: 'Volley'},
                            {name: 'Yoga', value: 'Yoga'},
                        )
                )
        ),
    async execute(interaction) {
        // Récupération des IDs des rôles
        const {
            Cotisants,          // Les cotisants
            Membre_du_Bureau,   // Les membres du bureau
            ESTA,               // Les membres de l'ESTA
        } = require(`../serveur/roles/role_${interaction.guild.id}.json`);

        // Récupération du sport choisi
        let sport = interaction.options.getString('sport');

        const {logs} = require(`../serveur/channels/channels_${interaction.guild.id}.json`)

        let channel_logs = null;
        if (logs === undefined) {
            log("Aucun salon 'logs'", null);
        } else {
            channel_logs = interaction.guild.channels.cache.get(logs);
        }

        // Vérification de l'existence du rôle et récupération de son ID
        let id = interaction.guild.roles.cache.find(role => role.name === sport);
        if (id === undefined) {
            // Le rôle n'existe pas, on envoie un message d'erreur
            await interaction.reply({content: `Le rôle n'existe pas`, ephemeral: true});
            log(`Le rôle ${sport} n'existe pas`, channel_logs);
        } else {
            // Le rôle existe, on ajoute ou on supprime le rôle si le membre est cotisant
            let member = interaction.member;
            if (member.roles.cache.has(Cotisants) || member.roles.cache.has(Membre_du_Bureau) || member.roles.cache.has(ESTA)) {
                if (member.roles.cache.has(id.id)) {
                    deleteRole(member, id);
                    await interaction.reply({content: `Le rôle a été supprimé`, ephemeral: true});
                } else {
                    addRole(member, id);
                    await interaction.reply({content: `Le rôle a été ajouté`, ephemeral: true});
                }
            } else {
                await interaction.reply({content: `Vous n'avez pas le droit de modifier vos sports`, ephemeral: true});
            }
        }
    },
};