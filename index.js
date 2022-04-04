const { Client, Intents, MessageActionRow, MessageButton } = require('discord.js');
const { token, componentsID } = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', async () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
    if (interaction.customId === componentsID.rules.id) {
        interaction.reply({ content: 'Tu as validé le règlement.', ephemeral: true });

        interaction.member.roles.add("960604119117201508");
    }
})

client.login(token);