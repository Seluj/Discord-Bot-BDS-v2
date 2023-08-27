const {Events} = require('discord.js');
const {rolesFiles} = require("../utils/roles_files");
const {log} = require('../utils/utils');

module.exports = {
  name: Events.GuildRoleCreate,
  async execute(role) {
    log(`Rôle ${role.name} créé, mise a jour du fichier...`);
    rolesFiles(role.guild);
  },
};