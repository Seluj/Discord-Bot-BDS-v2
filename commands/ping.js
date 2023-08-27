const {SlashCommandBuilder} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond avec Pong!'),
  async execute(interaction) {
    await interaction.reply({
      content: `\n> 🏓La latence est de ${Date.now() - interaction.createdTimestamp} ms.\n> La latence avec l'API est de ${Math.round(interaction.client.ws.ping)} ms`,
      ephemeral: true
    });
  },
};