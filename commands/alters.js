const { SlashCommandBuilder } = require("@discordjs/builders");
const { default: axios } = require("axios");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { pluralKit } = require('../config.json');
const { removeItem, removeItemAll } = require("../utils/array");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("alters")
        .setDescription("Affiche des informations sur les alters du système.")
        .addStringOption(option =>
            option
                .setName('nom')
                .setDescription('Le nom de l\'alter voulu.')
                .setRequired(false)),
    async execute(interaction, bot) {

        if (interaction.options.getString('nom')) {
            console.log("a");
            interaction.deferReply();
                    
            let member = interaction.options.getString('nom').toLowerCase();

            let members = {
                'kylee': 'byygv'
            }
            axios({
                method: "get",
                url: `https://api.pluralkit.me/v2/members/${members[member]}`,
                headers: {
                    Authorization: pluralKit.pkToken
                }
            }).then(memberData => {
                axios({
                    method: "get",
                    url: `https://api.pluralkit.me/v2/members/${members[member]}/groups`,
                    headers: {
                        Authorization: pluralKit.pkToken
                    }
                }).then(groupsData => {
                    console.log(groupsData.data);

                    let groups = "";
                    if (groupsData.data.length > 0) groupsData.data.forEach(group => groups += `**${group.name}**\n`)


                    var lines = memberData.data.description.replace(/↬(?<=↬)(.*?)(?=:): /g, "").split(/\r?\n/)
                    removeItem(lines, '᠃ ⚘᠂ ⚘ ˚ ⚘ ᠂ ⚘ ᠃ ⚘᠂ ⚘ ˚ ⚘ ᠂ ⚘ ᠃')
                    removeItemAll(lines, '');

                    console.log(lines);
                    let embed = new MessageEmbed()
                        .setAuthor({ name: `${memberData.data.name} (${lines[0] === "N/A" ? "" : lines[0]})`, iconURL: memberData.data.avatar_url ? memberData.data.avatar_url : "https://i.pinimg.com/originals/3c/90/c6/3c90c6359c4f0b887f4fea7e67a1f982.jpg" })
                        .setColor(memberData.data.color ? memberData.data.color : "#000000")
                        .setDescription(`↬ Age: ${lines[1]} (${memberData.data.birthday ? memberData.data.birthday : "Birthday Not Specified"})
                        ↬ Species: ${lines[2]}
                        
                        ↬ Gender: ${lines[3]} (${memberData.data.pronouns ? memberData.data.pronouns : "Pronouns Not Specified"})
                        ↬ Sexuality: ${lines[4]}
                        
                        ↬ Likes: ${lines[5]}
                        ↬ Dislikes: ${lines[6]}
                        ↬ Front triggers: ${lines[7]}
                        ↬ Possible front song: ${lines[8]}
                        
                        ᠃ ⚘᠂ ⚘ ˚ ⚘ ᠂ ⚘ ᠃ ⚘᠂ ⚘ ˚ ⚘ ᠂ ⚘ ᠃
                        
                        ↬ Extra: ${lines[9]}
                        ↬ Boundaries: ${lines[10]}
                        ↬ Type of fronter: ${lines[11]}`)
                        .setThumbnail(memberData.data.avatar_url ? memberData.data.avatar_url : "https://i.pinimg.com/originals/3c/90/c6/3c90c6359c4f0b887f4fea7e67a1f982.jpg")
    
                    interaction.editReply({ embeds: [embed], ephemeral: true })
                })
            })
        } else {
            axios({
                method: "get",
                url: `https://api.pluralkit.me/v2/systems/${pluralKit.systemID}/members`,
                headers: {
                    Authorization: pluralKit.pkToken
                }
            }).then(async res => {
                let collectorStatus = false;
                let list = [];
                res.data.forEach(alter => {
                    if (!["Blurry", "New Alter"].includes(alter.name)) list.push(alter.name);
                });

                list.sort();
                let page = 0;
                var pageCount = Math.ceil(list.length / 10);
                console.log(pageCount);

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

                let interactionContent = "";
                for (let i = 0; i < 10; i++) {
                    if (list[i]) interactionContent += `${i + 1} - ${list[i]}\n`
                }

                const embed = new MessageEmbed()
                    .setColor("RANDOM")
                    .setTitle("Liste des alters du système")
                    .setDescription(interactionContent)
                    .setFooter({ text: `Page:${page + 1}/${pageCount}` })
                    .setTimestamp();

                let fetchedInteraction = await interaction.editReply({ embeds: [embed], components: [row], fetchReply: true })

                const filter = i => ["leftPage", "rightPage", "closePage"].includes(i.customId) && i.user.id === interaction.member.id;
                const collector = fetchedInteraction.createMessageComponentCollector({ filter, time: 300000 });


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
                            collector.stop("manualStop");

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
                            if (list[i]) interactionContent += `${i + 1} - ${list[i]}\n`
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

                collector.on('end', async (collected, reason) => {
                    
                });
            });
        }
    },
}