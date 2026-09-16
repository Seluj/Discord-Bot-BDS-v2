const {SlashCommandBuilder, MessageFlags} = require('discord.js');
const https = require('node:https');
const {
    CsvValidationError,
    MAX_BYTES,
    assertContentType,
    assertFileName,
    saveAdherentsCsv,
    validateAdherentsCsv,
} = require('../utils/csv_validation');

/**
 * Télécharge la pièce jointe en mémoire, en coupant au-delà du quota.
 * Discord sert les pièces jointes en HTTPS ; on ne suit volontairement aucune
 * redirection vers autre chose.
 */
function downloadAttachment(fileUrl) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let downloaded = 0;

        https.get(fileUrl, response => {
            if (response.statusCode && response.statusCode >= 400) {
                reject(new CsvValidationError(`Téléchargement refusé (HTTP ${response.statusCode}).`));
                return;
            }
            response.on('data', chunk => {
                downloaded += chunk.length;
                if (downloaded > MAX_BYTES) {
                    reject(new CsvValidationError('Fichier trop volumineux (> 8 Mo).'));
                    response.destroy();
                    return;
                }
                chunks.push(chunk);
            });
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

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
        if (!attachment) {
            await interaction.editReply({content: 'Aucun fichier trouvé.'});
            return;
        }

        try {
            assertFileName(attachment.name || '');
            assertContentType(attachment.contentType || '');

            if ((attachment.size || 0) > MAX_BYTES) {
                throw new CsvValidationError('Le fichier doit faire moins de 8 Mo.');
            }

            const buffer = await downloadAttachment(attachment.url);
            const {text, rowCount} = validateAdherentsCsv(buffer);
            saveAdherentsCsv(text);

            await interaction.editReply({
                content: `Fichier CSV validé et enregistré avec succès (${rowCount} lignes).`,
            });
        } catch (err) {
            const message = err instanceof CsvValidationError
                ? err.message
                : `Erreur lors du traitement du fichier : ${err.message}`;
            await interaction.editReply({content: message});
        }
    },
};
