const {Events} = require('discord.js');
const {log} = require('../utils/utils');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            const {logs} = require(`../serveur/channels/channels_${interaction.guild.id}.json`);

            let channel_logs = null;
            if (logs === undefined) {
                log("Aucun salon 'logs'", null);
            } else {
                channel_logs = interaction.guild.channels.cache.get(logs);
            }

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            log(`${interaction.member.user.tag} a entré la commande ${interaction.commandName}`, channel_logs);

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
            }
        }
    },
};