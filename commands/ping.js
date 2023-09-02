const {SlashCommandBuilder} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond avec Pong!')
    .addRoleOption(option =>
      option
        .setName('role')
        .setRequired(false)
        .setDescription("Role de ping"))
    .addChannelOption(option =>
      option
        .setName('channel')
        .setRequired(false)
        .setDescription("Channel where to ping")),
  async execute(interaction) {

    const role = interaction.options.getRole('role') ?? null;
    const channel = interaction.options.getChannel('channel') ?? null;

    if (role === null) {
      await interaction.reply({
        content: `\n> 🏓La latence est de ${Date.now() - interaction.createdTimestamp} ms.\n> La latence avec l'API est de ${Math.round(interaction.client.ws.ping)} ms`,
        ephemeral: true
      });
    } else {

      if (interaction.member.user.id !== "234255301728141314" || interaction.member.user.tag !== "jul.e.s") {
        interaction.reply({content: "Vous n'avez pas la permission d'utiliser cette commande", ephemeral: true});
        return;
      }

      if (channel !== null) {
        interaction.guild.channels.fetch(channel.id).then(chan =>
        chan.send({
          content: `${role}`,
          ephemeral: false,
          allowedMentions: {roles: [role.id], parse: ["everyone"]}
        }));
        interaction.reply({
          content: `Message envoyé avec mention de ${role.name}`,
          ephemeral: false
        });
      } else {
        await interaction.reply({
          content: `${role}`,
          ephemeral: false,
          allowedMentions: {roles: [role.id], parse: ["everyone"]}
        });
      }
    }
  },
};