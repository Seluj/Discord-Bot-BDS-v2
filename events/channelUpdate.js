const {Events} = require('discord.js');
const {channelFiles} = require("../utils/channels_files");
const {log} = require('../utils/utils');

module.exports = {
    name: Events.ChannelUpdate,
    async execute(oldChannel, newChannel) {
        if (oldChannel.name === newChannel.name)
            return;
        log(`Salon ${newChannel.name} modifié, mise a jour du fichier...`, null);
        channelFiles(newChannel.guild);
    },
};