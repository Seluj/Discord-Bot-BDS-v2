const {Events} = require('discord.js');
const {rolesFiles} = require("../utils/roles_files");
const {log} = require('../utils/utils');

module.exports = {
  name: Events.GuildRoleUpdate,
  async execute(oldRole, newRole) {
    if (oldRole.name === newRole.name)
      return;
    log(`Rôle ${newRole.name} modifié, mise a jour du fichier...`);
    rolesFiles(newRole.guild);
  },
};