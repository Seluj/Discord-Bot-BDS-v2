const fs = require('node:fs');
const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Liste toutes les commandes disponibles')
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        let str = '\n';
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
        str += `Liste des commandes:\n`;
        for (const file of commandFiles) {
            const command = require(`./${file}`);

            str += `Nom: /${command.data.name}, Description: ${command.data.description}, Permissions: `;
            if (command.data.default_member_permissions === undefined) {
                str += `Tout le monde\n`;
            } else {
                str += `${command.data.default_member_permissions}\n`;
            }
        }
        return interaction.reply({
            content: str,
        });
    },
};