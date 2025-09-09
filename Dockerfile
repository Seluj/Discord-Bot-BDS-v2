FROM node:latest

# Create the bot's directory
RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot

COPY package.json /usr/src/bot
RUN npm install
RUN npm install pm2@latest -g

COPY . /usr/src/bot

# Start the bot.
CMD ["pm2-runtime", "index.js"]