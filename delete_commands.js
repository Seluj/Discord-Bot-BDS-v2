const {REST, Routes} = require('discord.js');
dotenv = require('dotenv');
dotenv.config();


const rest = new REST({version: '10'}).setToken(process.env.BOT_TOKEN);

// for global commands
rest.put(Routes.applicationCommands(process.env.CLIENTID), {body: []})
  .then(() => console.log('Successfully deleted all application commands.'))
  .catch(console.error);