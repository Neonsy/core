/**
 * Collectors example — ask a question, wait for a reply or a reaction.
 *
 * Commands:
 *   !ask   — wait for your next message in this channel (15s)
 *   !vote  — post a prompt and wait for 👍 / 👎 (30s)
 *
 * Usage:
 *   FLUXER_BOT_TOKEN=your_token node examples/collectors-bot.js
 *
 * Guide: https://fluxerjs.blstmo.com/guides/collectors/
 */

import { Client, Events, parsePrefixCommand } from '@fluxerjs/core';

const PREFIX = '!';
const client = new Client();

client.on(Events.Ready, () => {
  console.log(`Logged in as ${client.user?.username}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content) return;
  const parsed = parsePrefixCommand(message.content, PREFIX);
  if (!parsed) return;

  const channel = message.channel;
  if (!channel?.createMessageCollector) {
    await message.reply('This channel cannot collect messages.');
    return;
  }

  try {
    if (parsed.command === 'ask') {
      await message.reply('What is your favorite color? (15s)');
      const collector = channel.createMessageCollector({
        filter: (m) => m.author.id === message.author.id,
        time: 15_000,
        max: 1,
      });

      collector.on('collect', async (m) => {
        await m.reply(`Nice. You said: **${m.content}**`);
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          await message.reply('Timed out. No answer.').catch(() => {});
        }
      });
      return;
    }

    if (parsed.command === 'vote') {
      const prompt = await message.reply('React 👍 or 👎 (30s)');
      await prompt.react('👍');
      await prompt.react('👎');

      const collector = prompt.createReactionCollector({
        filter: (reaction, user) =>
          !user.bot &&
          user.id === message.author.id &&
          (reaction.emoji.name === '👍' || reaction.emoji.name === '👎'),
        time: 30_000,
        max: 1,
      });

      collector.on('collect', async (reaction, user) => {
        await prompt.reply(`${user.username} voted ${reaction.emoji.name}`);
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          await prompt.reply('No vote received.').catch(() => {});
        }
      });
    }
  } catch (err) {
    console.error(err);
    await message.reply('Collector failed.').catch(() => {});
  }
});

client.on(Events.Error, (err) => console.error(err));

await client.login(process.env.FLUXER_BOT_TOKEN);
