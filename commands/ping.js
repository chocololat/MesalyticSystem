const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
    data: new SlashCommandBuilder().setName("ping").setDescription("pong lol"),
    async execute(interaction, bot) {
        interaction.reply(
            `**P${"o".repeat(Math.min(Math.round(bot.ws.ping / 100), 1500))}ng!** (${Math.round(bot.ws.ping)}ms)`
        );
    },
}