const { REST } = require('@discordjs/rest');
const { Client, Intents, MessageActionRow, MessageButton, MessageSelectMenu, Collection } = require('discord.js');
const { Routes } = require("discord-api-types/v9");
const { readdirSync } = require('fs');

const { token, componentsID, events } = require('./config.json');

const bot = new Client({ intents: [Intents.FLAGS.GUILDS] });

bot.commands = new Collection();

let interactionObject = [
    {
        name: 'Abby',
        value: 'abby'
    },
    {
        name: 'Kylee',
        value: 'kylee'
    }
];

(async() => {
    let cmds = [];
    const cmdFiles = readdirSync("./commands").filter((file) => file.endsWith(".js"))

    for (const file of cmdFiles) {
        const command = require(`./commands/${file}`);
        bot.commands.set(command.data.name, command);
    }

    for (const file of cmdFiles) {
        const command = require(`./commands/${file}`);
        cmds.push(command.data.toJSON());
    }

    try {
        const rest = new REST({ version: "9" }).setToken(token);
        console.log("started refreshing /cmds");

        await rest.put(
            Routes.applicationGuildCommands("960627025599676447", "960597800620527636"),
            { body: cmds }
        );

        console.log("reloaded /cmds");
    } catch (e) {
        console.error(e);
    }
})();

bot.once('ready', async () => {
	console.log('Ready!');
});

bot.on("guildMemberAdd", member => {
    let channel = bot.guilds.cache.first().channels.cache.get(events.guildMemberAdd.channelID);

    channel.send({ content: events.guildMemberAdd.content.replace("%MEMBERID%", member.id) })
})

bot.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = bot.commands.get(interaction.commandName);
        
        if (!command) return;

        try {
            await command.execute(interaction, bot);
        } catch (e) {
            console.error(e);
        }
    }

    if (interaction.isAutocomplete()) {
        interaction.respond(interactionObject)
    }

    if (interaction.customId === componentsID.rules.id) {
        interaction.reply({ content: 'Tu as valid?? le r??glement.', ephemeral: true });

        interaction.member.roles.add(componentsID.rules.roleID);
    }

    if (interaction.customId === componentsID.roles.primordial.id) {
        const singletRow = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("system")
                .setPlaceholder("Syst??me")
                .setMinValues(0)
                .addOptions([
                    {
                        label: 'Syst??me',
                        value: 'systeme',
                        default: interaction.member.roles.cache.get("960651158127538206")
                        ? true
                        : false
                    },
                    {
                        label: 'Singlet',
                        value: 'singlet',
                        default: interaction.member.roles.cache.get("960651136203882506")
                        ? true
                        : false
                    }
                ])
        )

        const pronounsRow = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("pronouns")
                .setPlaceholder("Pronoms")
                .setMinValues(0)
                .setMaxValues(4)
                .addOptions([
                    {
                        label: 'He/Him',
                        value: 'hehim',
                        default: interaction.member.roles.cache.get("962428606934552606")
                        ? true
                        : false
                    },
                    {
                        label: 'She/Her',
                        value: 'sheher',
                        default: interaction.member.roles.cache.get("962428808512811058")
                        ? true
                        : false
                    },
                    {
                        label: 'They/Them',
                        value: 'theythem',
                        default: interaction.member.roles.cache.get("962428823390019585")
                        ? true
                        : false
                    },
                    {
                        label: 'Any Pronouns (ask)',
                        value: 'any',
                        default: interaction.member.roles.cache.get("962428845842120724")
                        ? true
                        : false
                    },                
                ])
        )

        const ageRow = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("age")
                .setMinValues(0)
                .setPlaceholder("Age")
                .setOptions([
                    {
                        label: '13-15 ans',
                        value: '1315',
                        default: interaction.member.roles.cache.get("962438235697582172")
                        ? true
                        : false
                    },
                    {
                        label: '16-17 ans',
                        value: '1617',
                        default: interaction.member.roles.cache.get("962438288642310154")
                        ? true
                        : false
                    },
                    {
                        label: '18-25 ans',
                        value: '1825',
                        default: interaction.member.roles.cache.get("962438396087783584")
                        ? true
                        : false
                    },
                    {
                        label: '+25 ans',
                        value: '+25',
                        default: interaction.member.roles.cache.get("962438424038633513")
                        ? true
                        : false
                    }, 
                ])
        )

        interaction.reply({ components: [singletRow, pronounsRow, ageRow], ephemeral: true })
    }

    if (["system", "pronouns", "age"].includes(interaction.customId)) {
        let rolesID = {
            "system": {
                "systeme": "960651158127538206",
                "singlet": "960651136203882506"
            },
            "pronouns": {
                "hehim": "962428606934552606",
                "sheher": "962428808512811058",
                "theythem": "962428823390019585",
                "any": "962428845842120724"
            },
            "age": {
                "1315": "962438235697582172",
                "1617": "962438288642310154",
                "1825": "962438396087783584",
                "+25": "962438424038633513"
            }
        }
        
        const keys = Object.keys(rolesID[interaction.customId]);

        for (let i = 0; i < keys.length; i++) {
            if (interaction.values.includes(keys[i])) interaction.member.roles.add(rolesID[interaction.customId][keys[i]])
            else if (!interaction.values.includes(keys[i])) {
                if (interaction.member.roles.cache.get(rolesID[interaction.customId][keys[i]])) interaction.member.roles.remove(rolesID[interaction.customId][keys[i]]);
            }
        }

        interaction.reply({
            content: "Tes r??les ont bien ??t?? mis a jour !",
            ephemeral: true
        })
    }
})

bot.login(token);