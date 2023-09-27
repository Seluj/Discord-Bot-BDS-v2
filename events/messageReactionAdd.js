const {Events} = require('discord.js');
const {log, checkName, checkRole} = require('../utils/utils');

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
        const {Attente_Cotisant, Membre_du_Bureau} = require(`../serveur/roles/role_${reaction.message.guild.id}.json`);

        // Mise en place des rôles
        if (Attente_Cotisant === undefined || Membre_du_Bureau === undefined) {
          logString = "Aucun Role 'Attente Cotisant'";
          //log("Aucun Role 'Attente Cotisant'", channel_logs);
        } else {
          let member = await reaction.message.guild.members.fetch(user.id); // On récupère le membre pour avoir toutes ses informations
          logString += ` (${member.displayName})`

          // On regarde si la personne est un membre du bureau
          if (checkRole(member, Membre_du_Bureau)) {  // Si oui, on envoie un petit message personalisé et on quitte la fonction
            await member.send("Hop hop, camarade du bureau en escapade botique !\nReviens en mode " + member.displayName.split(' - ')[1] + ", le bot est jaloux de ton attention !\n");
            await reaction.users.remove(member.id);
            logString += " et est un membre du bureau.";
          } else {

            // On regarde si le pseudo est correcte
            if (checkName(member.displayName)) {    // Si oui, on lui ajoute le rôle Attente_Cotisant
              await member.roles.add(Attente_Cotisant);
              logString += " et est Attente_Cotisant.";
            } else {                                // Sinon, on envoie un message
              await member.send("Salut, je crois que tu n'as pas bien lu, renomme toi correctement Prénom Nom, sans ta promo et sans ton surnom !!").catch(() => console.log("Impossible d'envoyer un message à " + member.displayName));
              await reaction.users.remove(member.id);
              logString += ` et n'est pas bien renommé.`;
            }
          }
        }

      } else {
        await reaction.users.remove(user.id);
      }
    }

    log(logString, channel_logs);
  },
};