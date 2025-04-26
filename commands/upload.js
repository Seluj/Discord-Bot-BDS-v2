const {SlashCommandBuilder, MessageFlags} = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('upload')
        .setDescription('upload the adherents file')
        .setDefaultMemberPermissions(0)
        .addAttachmentOption(option =>
            option
                .setName('attachment')
                .setDescription('Le fichier à uploader')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({flags: MessageFlags.Ephemeral});
        const attachment = interaction.options.getAttachment('attachment');
        if (attachment) {
            const fileName = attachment.name;
            const fileSize = attachment.size;
            const fileUrl = attachment.url;

            // Check if the file is a CSV
            if (!fileName.endsWith('.csv')) {
                await interaction.editReply({content: 'Le fichier doit être au format CSV.', flags: MessageFlags.Ephemeral});
                return;
            }

            // Check if the file size is less than 8MB
            if (fileSize > 8000000) {
                await interaction.editReply({content: 'Le fichier doit faire moins de 8 Mo.', flags: MessageFlags.Ephemeral});
                return;
            }

            // Download the file and process it
            await interaction.editReply({content: 'Fichier téléchargé avec succès !', flags: MessageFlags.Ephemeral});
            // Upload the file in the root directory and rename it adherent.csv
            const fs = require('fs');
            const https = require('https');
            const path = require('path');
            const filePath = path.join(__dirname, '..', 'adherent.csv');
            const file = fs.createWriteStream(filePath);
            https.get(fileUrl, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log('File downloaded and saved as adherent.csv');
                });
            });
        } else {
            await interaction.editReply({content: 'Aucun fichier trouvé.', flags: MessageFlags.Ephemeral});
        }
    },
};