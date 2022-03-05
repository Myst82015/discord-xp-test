/* eslint-disable no-inline-comments */
// Require the necessary discord.js classes
const { Client, Intents, MessageAttachment } = require('discord.js');
require('dotenv').config();

const Levels = require('discord-xp');

Levels.setURL(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });


// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log(`Ready! ${client.user.tag}`);

});

client.on('messageCreate', async (message) => {
	if(message.author.id != '263022860551847936') return;
	if (!message.guild) return;
	if (message.author.bot) return;

	const randomAmountOfXp = Math.floor(Math.random() * 29) + 1; // Min 1, Max 30
	const hasLeveledUp = await Levels.appendXp(message.author.id, message.guild.id, randomAmountOfXp);
	// const test = await Levels.appendXp(message.author.id, 1, randomAmountOfXp);
	if (hasLeveledUp) {
		const user = await Levels.fetch(message.author.id, message.guild.id, true);
		message.channel.send({ content: `${message.author}, congratulations! You have leveled up to **${user.level}**. :tada:` });
	}


	const canvacord = require('canvacord');

	const target = message.mentions.users.first() || message.author; // Grab the target.
	const user = await Levels.fetch(target.id, message.guild.id, true); // Selects the target from the database.
	const rank = new canvacord.Rank() // Build the Rank Card
		.setAvatar(target.displayAvatarURL({ format: 'png', size: 512 }))
		.setCurrentXP(user.cleanXp) // Current User Xp
		.setRequiredXP(user.cleanNextLevelXp) // We calculate the required Xp for the next level
		.setRank(user.position) // Position of the user on the leaderboard
		.setLevel(user.level) // Current Level of the user
		// .setStatus(target.presence.status)
		.setProgressBar('#FFFFFF')
		.setUsername(target.username)
		.setDiscriminator(target.discriminator);

	await rank.build()
		.then(data => {
			const attachment = new MessageAttachment(data, 'RankCard.png');
			message.channel.send({ files: [attachment] });
		});

	// Rank Command
	/*
	const target = message.mentions.users.first() || message.author; // Grab the target.

	const user = await Levels.fetch(target.id, message.guild.id, true); // Selects the target from the database.

	const requiredXp = Levels.xpFor(user.level + 1);
	message.channel.send(`${await Levels.xpFor(user.level + 1)}`);

	if (!user) return message.channel.send('Seems like this user has not earned any xp so far.'); // If there isnt such user in the database, we send a message in general.

	await message.channel.send(`> **${target.tag}** is currently level ${user.level}.`); // We show the level.

	*/
	// Leaderboard Command

	const rawLeaderboard = await Levels.fetchLeaderboard(message.guild.id, 10); // We grab top 10 users with most xp in the current server.

	if (rawLeaderboard.length < 1) return message.reply('Nobody\'s in leaderboard yet.');

	const leaderboard = await Levels.computeLeaderboard(client, rawLeaderboard, true); // We process the leaderboard.

	const lb = leaderboard.map(e => `${e.position}. ${e.username}#${e.discriminator}\nLevel: ${e.level}\nXP: ${e.xp.toLocaleString()}`); // We map the outputs.

	await message.channel.send(`**Leaderboard**:\n\n${lb.join('\n\n')}`);

	// Position of a user in the leaderboard

	console.log('Position is: ' + user.position);

	// message.channel.send('Deleting user entry');
	// await Levels.deleteUser(message.author.id, message.guild.id);
});

// Login to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
