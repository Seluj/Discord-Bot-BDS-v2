const {SlashCommandBuilder, AttachmentBuilder} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Créer un embed')
    .setDefaultMemberPermissions(0)
    .addSubcommand(
      subcommand =>
        subcommand
          .setName('rule')
          .setDescription('Créer un embed de règle')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('sport')
        .setDescription('Créer un embed de sport')
    ),
  async execute(interaction) {
    if (interaction.options.getSubcommand() === "rule") {
      interaction.reply({content: "Voici votre message:", ephemeral: true});
      const file = new AttachmentBuilder('./logo/logo1.png')

      const exampleEmbed = {
        author: {
          icon_url: "attachment://logo1.png",
          name: "BDS"
        },
        title: "Règles du discord (à valider tous les ans)",
        description: "Quelques règles de vivre ensemble sur le discord du BDS",
        footer: {
          icon_url: "attachment://logo1.png",
          text: "Par moi-même"
        },
        thumbnail: {
          url: "attachment://logo1.png"
        },
        fields: [
          {
            name: "Les règles",
            value: "> Être correct auprès de tout le monde (même vos amis) : les avatars, emotes, liens et propos doivent rester corrects en toutes circonstances.\n> Pas de harcèlement, ni de comportement encourageant le harcèlement ou incitant à la violence.\n> Ne pas abuser des @",
            inline: false
          },
          {
            name: "Interdiction",
            value: "> La pornographie\n> Les insultes\n> Les propos à caractère : \n> - sexuel \n> - pédophile\n> - raciste\n> - homophobe\n> - misogynes\n> - politiques ou religieux.",
            inline: false
          },
          {
            name: "Cotisation",
            value: "Pour que tu puisse participer à n'importe quelle activité sur le discord il faut que tu te sois renommé **__« Prénom NOM »__** (N'indique pas ta promo ou ton surnom)\nTout est automatisé à partir du moment où tu aura cliqué sur 👍, donc inutile de contacter quelqu'un du bureau ! \nSi tu vois toujours ce message c'est que tu ne l'as pas bien lu !",
            inline: false
          }
        ],
        color: 16172079
      };

      interaction.channel.send({embeds: [exampleEmbed], files: [file]}).then(sentMessage => {
        sentMessage.react('👍');
      });
    } else if (interaction.options.getSubcommand() === "sport") {
      interaction.reply({content: "Voici votre message:", ephemeral: true});
      const file = new AttachmentBuilder('./logo/logo1.png')

      const exampleEmbed = {
        color: 16172079,
        author: {
          name: "BDS",
          icon_url: "attachment://logo1.png"
        },
        title: "Commande Sport",
        footer: {
          text: "By The Discord Team",
          icon_url: "attachment://logo1.png"
        },
        thumbnail: {
          url: "attachment://logo1.png"
        },
        fields: [
          {
            name: "Utilisation",
            value: "Vous pouvez utiliser la commande __**/sport**__ pour vous attribuer un sport. Les sports sont divisés en 3 catégories : indoor, outdoor et in-out",
            inline: false
          },
          {
            name: "indoor",
            value: "Basket\nBadminton\nArts martiaux\nBoxe\nBoxe française\nFutsal\nGymnastique\nHandball\nJudo-karaté\nKudo\nMusculation\nNatation\nTennis de table",
            inline: true
          },
          {
            name: "outdoor",
            value: "Athlétisme\nBaseball\nCourse à pied\nCourse d'orientation\nFootball\nFootball américain\nGolf\nParkour\nRandonnée\nRugby\nSkate\nSpikeball\nStreet workout\nTennis\nUltimate\nVTT\nVélo",
            inline: true
          },
          {
            name: "in-out",
            value: "Créneau féminin\nEscalade\nVolleyball\nYoga",
            inline: true
          },
          {
            name: "",
            value: "",
            inline: false
          },
          {
            name: "Point info",
            value: "Vous ne pouvez pas vous tromper: la commande s'autocomplète, si toute fois vous avez un problème vous pouvez toujours contacter:\n**Jules - Respo Discord**",
            inline: false
          }
        ]
      };

      interaction.channel.send({embeds: [exampleEmbed], files: [file]});
    } else {

    }

  },
};