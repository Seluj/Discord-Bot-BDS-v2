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
            const fileName = attachment.name || '';
            const fileSize = attachment.size || 0;
            const fileUrl = attachment.url;
            const contentType = attachment.contentType || '';


            // 1) Vérification extension .csv
            if (!/\.csv$/i.test(fileName)) {
                await interaction.editReply({content: 'Le fichier doit être au format CSV.', flags: MessageFlags.Ephemeral});
                return;
            }

            // 2) Vérification type MIME si disponible (Discord ne le renseigne pas toujours)
            const allowedMime = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
            if (contentType && !allowedMime.some(t => contentType.toLowerCase().includes(t))) {
                await interaction.editReply({content: `Type de fichier non valide (${contentType}). Le fichier doit être un CSV.`, flags: MessageFlags.Ephemeral});
                return;
            }


            // 3) Taille max 8 Mo
            if (fileSize > 8000000) {
                await interaction.editReply({content: 'Le fichier doit faire moins de 8 Mo.', flags: MessageFlags.Ephemeral});
                return;
            }

            // 4) Téléchargement en mémoire pour validation stricte
            const https = require('https');
            const chunks = [];
            let downloaded = 0;
            try {
                await new Promise((resolve, reject) => {
                    https.get(fileUrl, (response) => {
                        if (response.statusCode && response.statusCode >= 400) {
                            reject(new Error(`Téléchargement refusé (HTTP ${response.statusCode}).`));
                            return;
                        }
                        response.on('data', (chunk) => {
                            downloaded += chunk.length;
                            if (downloaded > 8000000) {
                                reject(new Error('Fichier trop volumineux (> 8 Mo).'));
                                response.destroy();
                                return;
                            }
                            chunks.push(chunk);
                        });
                        response.on('end', resolve);
                        response.on('error', reject);
                    }).on('error', reject);
                });
            } catch (err) {
                await interaction.editReply({content: `Erreur lors du téléchargement: ${err.message}`, flags: MessageFlags.Ephemeral});
                return;
            }

            // 5) Assemblage et premières vérifications de contenu
            const buffer = Buffer.concat(chunks);
            // Vérifier présence de NUL bytes (binaire)
            if (buffer.includes(0)) {
                await interaction.editReply({content: 'Le fichier semble binaire (octets NUL détectés). Un CSV texte est requis.', flags: MessageFlags.Ephemeral});
                return;
            }

            // Décodage en UTF-8 (autoriser BOM)
            let text;
            try {
                text = buffer.toString('utf8');
            } catch {
                await interaction.editReply({content: 'Impossible de décoder le fichier en UTF-8.', flags: MessageFlags.Ephemeral});
                return;
            }
            // Normaliser les fins de ligne pour les inspections
            const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
            const nonEmpty = lines.filter(l => l.trim().length > 0).slice(0, 5);
            if (nonEmpty.length === 0) {
                await interaction.editReply({content: 'Le fichier CSV est vide.', flags: MessageFlags.Ephemeral});
                return;
            }
            // Interdire TSV
            if (nonEmpty.some(l => l.includes('\t'))) {
                await interaction.editReply({content: 'Le fichier ne doit pas utiliser la tabulation. Le séparateur requis est “;”.', flags: MessageFlags.Ephemeral});
                return;
            }
            // Exiger le séparateur “;” visible dans les premières lignes
            const semiCount = nonEmpty.reduce((acc, l) => acc + (l.split(';').length - 1), 0);
            if (semiCount < 1) {
                await interaction.editReply({content: 'Le fichier doit utiliser “;” comme séparateur (aucun “;” détecté).', flags: MessageFlags.Ephemeral});
                return;
            }

            // 6) Parsing strict avec csv-parse et délimiteur “;”
            const { parse } = require('csv-parse/sync');
            let records;
            try {
                records = parse(text, {
                    bom: true,
                    delimiter: ';',
                    relax_column_count: false,
                    skip_empty_lines: true,
                    trim: true,
                    record_delimiter: ['\r\n', '\n', '\r'],
                    max_record_size: 1024 * 1024 // 1 MB par ligne max
                });
            } catch (err) {
                await interaction.editReply({content: `Le fichier n’est pas un CSV valide avec “;” comme séparateur: ${err.message}`, flags: MessageFlags.Ephemeral});
                return;
            }

            // 7) Contraintes structurelles
            if (!Array.isArray(records) || records.length === 0) {
                await interaction.editReply({content: 'Le fichier CSV ne contient aucune ligne exploitable.', flags: MessageFlags.Ephemeral});
                return;
            }
            const firstRow = records[0];
            if (!Array.isArray(firstRow) || firstRow.length < 2) {
                await interaction.editReply({content: 'Le CSV doit contenir au moins 2 colonnes.', flags: MessageFlags.Ephemeral});
                return;
            }

            // Limites raisonnables
            const MAX_ROWS = 10000;
            const MAX_COLS = 50;
            if (records.length > MAX_ROWS) {
                await interaction.editReply({content: `Le CSV contient trop de lignes (${records.length} > ${MAX_ROWS}).`, flags: MessageFlags.Ephemeral});
                return;
            }
            if (firstRow.length > MAX_COLS) {
                await interaction.editReply({content: `Le CSV contient trop de colonnes (${firstRow.length} > ${MAX_COLS}).`, flags: MessageFlags.Ephemeral});
                return;
            }
            // Vérifier la cohérence du nombre de colonnes (parse avec relax_column_count:false le garantit déjà)
            const expectedCols = firstRow.length;
            const inconsistent = records.findIndex(r => r.length !== expectedCols);
            if (inconsistent !== -1) {
                await interaction.editReply({content: `Nombre de colonnes incohérent à la ligne ${inconsistent + 1}.`, flags: MessageFlags.Ephemeral});
                return;
            }

            // 8) Sauvegarde uniquement si toutes les validations passent
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '..', 'adherent.csv');

            try {
                fs.writeFileSync(filePath, text, { encoding: 'utf8' });
            } catch (err) {
                await interaction.editReply({content: `Erreur lors de l’enregistrement du fichier: ${err.message}`, flags: MessageFlags.Ephemeral});
                return;
            }

            await interaction.editReply({content: 'Fichier CSV validé et enregistré avec succès sous “adherent.csv”.', flags: MessageFlags.Ephemeral});
        } else {
            await interaction.editReply({content: 'Aucun fichier trouvé.', flags: MessageFlags.Ephemeral});
        }
    },
};
