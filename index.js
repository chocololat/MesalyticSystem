const { Client, Intents, MessageActionRow, MessageButton } = require('discord.js');
const { token, componentsID, events } = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', async () => {
	console.log('Ready!');
});

client.on("guildMemberAdd", member => {
    let channel = client.guilds.cache.first().channels.cache.get(events.guildMemberAdd.channelID);

    channel.send({ content: events.guildMemberAdd.content.replace("%MEMBERID%", member.id) })
})

client.on('interactionCreate', async interaction => {
    if (interaction.customId === componentsID.rules.id) {
        interaction.reply({ content: 'Tu as validé le règlement.', ephemeral: true });

        interaction.member.roles.add("960604119117201508");
    }
})

client.login(token);