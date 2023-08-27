const {REST, Routes} = require('discord.js');
dotenv = require('dotenv');
dotenv.config();
const fs = require('node:fs');
const {log} = require('./utils/utils');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({version: '10'}).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    log(`Started refreshing ${commands.length} application (/) commands.`, null);
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENTID),
      {body: commands},
    );

    log(`Successfully reloaded ${data.length} application (/) commands.`, null);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
