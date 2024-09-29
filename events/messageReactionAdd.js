const {Events, PermissionFlagsBits} = require('discord.js');
const {log, checkName, checkRole, toChannelName} = require('../utils/utils');

async function makeChannelIfNotExistAndSendMessage(guild, user, message, log = null, channelLog = null) {
    let channelName = toChannelName(user.tag);
    let createdChannel = guild.channels.cache.find(channel => channel.name === channelName);
    let created = false;
    if (!createdChannel) {
        createdChannel = await guild.channels
            .create(
                {
                    name: channelName,
                    type: '0',
                    parentId: '754741001469558804',
                    permissionOverwrites: [{
                        id: user.id,
                        allow: [PermissionFlagsBits.ViewChannel],
                    },
                        {

                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                    ],
                });
        created = true;
    }
    createdChannel.send(`${message}\n${user}\nCe channel s'autodétruira dans 90 secondes.`);
    if (created) {
        setTimeout(function () {
            if (log != null)
                log(`${createdChannel.name}, ${createdChannel.id} deleted`, channelLog);
            createdChannel.delete();
        }, 90000);
    }
    return createdChannel.name;
}

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {

        let logString = "";

        if (reaction.partial) {
            // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                // Return as `reaction.message.author` may be undefined/null
                return;
            }
        }

        if (user.bot) {
            return;
        }

        const {ligne_de_départ, logs} = require(`../serveur/channels/channels_${reaction.message.guild.id}.json`);

        let channel_logs = null;
        if (logs !== undefined) {
            channel_logs = reaction.message.guild.channels.cache.get(logs);
        }

        if (reaction.message.channel.id === ligne_de_départ) {
            logString += `${user.tag} a réagi au message de règles avec ${reaction.emoji}`;

            if (reaction.emoji.name === '👍') {

                //log(`${user.tag} a réagi au message de règles`, channel_logs);
                const {
                    Attente_Cotisant,
                    Membre_du_Bureau
                } = require(`../serveur/roles/role_${reaction.message.guild.id}.json`);

                // Mise en place des rôles
                if (Attente_Cotisant === undefined || Membre_du_Bureau === undefined) {
                    logString = "Aucun Role 'Attente Cotisant'";
                    //log("Aucun Role 'Attente Cotisant'", channel_logs);
                } else {
                    let member = await reaction.message.guild.members.fetch(user.id); // On récupère le membre pour avoir toutes ses informations
                    logString += ` (${member.displayName})`

                    // On regarde si la personne est un membre du bureau
                    if (checkRole(member, Membre_du_Bureau)) {  // Si oui, on envoie un petit message personalisé et on quitte la fonction
                        let message = "Hop hop, camarade du bureau en escapade botique !\nReviens en mode " + member.displayName.split(' - ')[1] + ", le bot est jaloux de ton attention !\n"
                        makeChannelIfNotExistAndSendMessage(reaction.message.guild, user, message, log, channel_logs)
                            .then(r => log(`Channel ${r} créé`, channel_logs));
                        await reaction.users.remove(member.id);
                        logString += " et est un membre du bureau.";
                    } else {

                        // On regarde si le pseudo est correcte
                        if (checkName(member.displayName)) {    // Si oui, on lui ajoute le rôle Attente_Cotisant
                            await member.roles.add(Attente_Cotisant);
                            logString += " et est Attente_Cotisant.";
                        } else {                                // Sinon, on envoie un message
                            let message = "Salut, je crois que tu n'as pas bien lu, renomme toi correctement Prénom Nom, sans ta promo et sans ton surnom !!";
                            makeChannelIfNotExistAndSendMessage(reaction.message.guild, user, message)
                                .then(r => log(r, channel_logs));
                            await reaction.users.remove(member.id);
                            logString += ` et n'est pas bien renommé.`;
                        }
                    }
                }
            } else {
                await reaction.users.remove(user.id);
            }
            log(logString, channel_logs);
        }
    },
};