const fs = require('node:fs');
const path = require('node:path');
const {Client, Collection, Partials} = require('discord.js');
const {getFiles} = require('./utils/utils');
dotenv = require('dotenv');
dotenv.config();

const client = new Client({intents: [3276799], partials: [Partials.Channel]});

// Commands
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

// Events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));


for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...arg) => event.execute(...arg));
  } else {
    client.on(event.name, (...arg) => event.execute(...arg));
  }
}

client.login(process.env.BOT_TOKEN);