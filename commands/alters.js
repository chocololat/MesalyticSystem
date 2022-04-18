const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { pluralKit } = require('../config.json');
const { removeItem, removeItemAll } = require("../utils/array");
const PKAPI = require('pkapi.js');

const api = new PKAPI({
    base_url: "https://api.pluralkit.me",
    version: 2,
    token: pluralKit.pkToken
})

module.exports = {
    data: new SlashCommandBuilder()
        .setName("alters")
        .setDescription("Affiche des informations sur les alters du système.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("Liste des alters")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Voir une fiche alter')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription("Le nom de l'alter")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),
    async execute(interaction, bot) {
        if (interaction.options._subcommand === 'view') {
            interaction.deferReply({ ephemeral: true });

            let memberID = interaction.options._hoistedOptions[0].value;

            let member = await api.getMember({ member: members[memberID] })
            await member.getGroups()

            var lines = member.description.replace(/↬(?<=↬)(.*?)(?=:): /g, "").split(/\r?\n/);

            let groups = "";
            member.groups.forEach(group => {
                groups += `**${group.name}**, `
            })

            removeItem(lines, '᠃ ⚘᠂ ⚘ ˚ ⚘ ᠂ ⚘ ᠃ ⚘᠂ ⚘ ˚ ⚘ ᠂ ⚘ ᠃')
            removeItemAll(lines, '');

            let embed = new MessageEmbed()
                .setAuthor({ name: `${member.name} ${lines[0] === "N/A" ? "" : `(${lines[0]})`}`, iconURL: member.avatar_url ? member.avatar_url : "https://i.pinimg.com/originals/3c/90/c6/3c90c6359c4f0b887f4fea7e67a1f982.jpg" })
                .setColor(member.color ? member.color : "#000000")
                .setDescription(`↬ Age: ${lines[1]} (${member.birthday ? member.birthday : "Birthday Not Specified"})
                                ↬ Species: ${lines[2]}
                                ↬ System Roles: ${groups.slice(0, -2)}
                                
                                ↬ Gender: ${lines[3]} (${member.pronouns ? member.pronouns : "Pronouns Not Specified"})
                                ↬ Sexuality: ${lines[4]}
                                
                                ↬ Likes: ${lines[5]}
                                ↬ Dislikes: ${lines[6]}
                                ↬ Front triggers: ${lines[7]}
                                ↬ Possible front song: ${lines[8]}
                                
                                ᠃ ⚘᠂ ⚘ ˚ ⚘ ᠂ ⚘ ᠃ ⚘᠂ ⚘ ˚ ⚘ ᠂ ⚘ ᠃
                                
                                ↬ Extra: ${lines[9]}
                                ↬ Boundaries: ${lines[10]}
                                ↬ Type of fronter: ${lines[11]}`)
                .setThumbnail(member.avatar_url ? member.avatar_url : "https://i.pinimg.com/originals/3c/90/c6/3c90c6359c4f0b887f4fea7e67a1f982.jpg")

            interaction.editReply({ embeds: [embed] })
        } else {
            let system = await api.getSystem({ system: pluralKit.systemID })
            let members = await system.getMembers();

            let list = [];
            let collectorStatus = false;
            let interactionContent = "";
            let page = 0;


            members.forEach(alter => {
                if (!["Blurry", "New Alter"].includes(alter.name)) list.push(alter.name);
            });

            list.sort();

            var pageCount = Math.ceil(list.length / 10);

            let row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('leftPage')
                        .setEmoji('⬅️')
                        .setStyle('SECONDARY'),
                ).addComponents(
                    new MessageButton()
                        .setCustomId('rightPage')
                        .setEmoji('➡️')
                        .setStyle('SECONDARY'),
                ).addComponents(
                    new MessageButton()
                        .setCustomId('closePage')
                        .setEmoji('❌')
                        .setStyle('SECONDARY'),
                );

            await interaction.deferReply();

            for (let i = 0; i < 10; i++) {
                if (list[i]) interactionContent += `${list[i]}\n`
            }

            const embed = new MessageEmbed()
                .setColor("RANDOM")
                .setTitle("Liste des alters du système")
                .setDescription(interactionContent)
                .setFooter({ text: `Page:${page + 1}/${pageCount}` })
                .setTimestamp();

            let fetchedInteraction = await interaction.editReply({ embeds: [embed], components: [row], fetchReply: true })

            const filter = i => ["leftPage", "rightPage", "closePage"].includes(i.customId) && i.user.id === interaction.member.id;
            const collector = fetchedInteraction.createMessageComponentCollector({ filter, time: 600000 });

            setTimeout(() => {
                interaction.deleteReply();
            }, 550000)

            collector.on('collect', async i => {
                switch (i.customId) {
                    case "leftPage":
                        collectorStatus = true;
                        page = page > 0 ? --page : pageCount - 1;
                        break;
                    case "rightPage":
                        collectorStatus = true;
                        page = page + 1 < pageCount ? ++page : 0;
                        break;
                    case "closePage":
                        collectorStatus = false;
                        collector.stop();

                        await i.deferUpdate();
                        await i.editReply({
                            content: "Le paginateur a été fermé.",
                            embeds: [],
                            components: [],
                            fetchReply: true
                        });

                        setTimeout(() => {
                            i.deleteReply()
                        }, 10000)
                    default:
                        break;
                }

                if (collectorStatus) {
                    let interactionContent = "";
                    for (let i = page * 10; i < (page * 10 + 10); i++) {
                        if (list[i]) interactionContent += `${list[i]}\n`
                    }

                    const embed = new MessageEmbed()
                        .setColor("RANDOM")
                        .setTitle("Liste des alters du système")
                        .setDescription(interactionContent)
                        .setFooter({ text: `Page:${page + 1}/${pageCount}` })
                        .setTimestamp();

                    await i.deferUpdate();
                    await i.editReply({
                        embeds: [embed],
                        components: [row],
                    });
                    collector.resetTimer();
                }
            });
        }
    }
}