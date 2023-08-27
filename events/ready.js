const {Events} = require('discord.js');
const {deleteOldestFiles, log} = require("../utils/utils");
const {channelFiles} = require("../utils/channels_files");
const {rolesFiles} = require("../utils/roles_files");


module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    await client.user.setUsername('BDS v2');
    //await client.user.setAvatar('./logo/logo1.png');
    client.user.setPresence({status: 'dnd',});
    let guild = client.guilds.cache.map(m => m);
    deleteOldestFiles();
    rolesFiles(guild);
    channelFiles(guild);

    log(`Ready! Logged in as ${client.user.tag}`);
  },
};