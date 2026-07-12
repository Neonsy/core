/**
 * Attachments example — upload a buffer, spoiler flag, and attach by URL.
 *
 * Commands:
 *   !file     — text file from a Buffer
 *   !spoiler  — tiny PNG marked as spoiler (1x1 placeholder)
 *   !urlfile  — attach an image by URL
 *
 * Usage:
 *   FLUXER_BOT_TOKEN=your_token node examples/attachments-bot.js
 *
 * Guides: attachments, attachments-by-url
 */

import { Client, Events, MessageAttachmentFlags, parsePrefixCommand } from '@fluxerjs/core';

const PREFIX = '!';
const client = new Client({ intents: 0 });

// Minimal valid 1x1 PNG
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

client.on(Events.Ready, () => {
  console.log(`Logged in as ${client.user?.username}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.content) return;
  const parsed = parsePrefixCommand(message.content, PREFIX);
  if (!parsed) return;

  try {
    if (parsed.command === 'file') {
      await message.reply({
        content: 'Text file attached:',
        files: [{ name: 'hello.txt', data: Buffer.from('Hello from Fluxer!\n', 'utf8') }],
      });
      return;
    }

    if (parsed.command === 'spoiler') {
      await message.reply({
        content: 'Spoiler image (click to reveal):',
        files: [{ name: 'secret.png', data: PNG_1X1 }],
        attachments: [
          {
            id: 0,
            filename: 'secret.png',
            title: 'Hidden pixel',
            flags: MessageAttachmentFlags.IS_SPOILER,
          },
        ],
      });
      return;
    }

    if (parsed.command === 'urlfile') {
      await message.reply({
        content: 'Image fetched from URL:',
        files: [
          {
            name: 'trulli.jpg',
            url: 'https://www.w3schools.com/html/pic_trulli.jpg',
          },
        ],
      });
    }
  } catch (err) {
    console.error(err);
    await message.reply('Failed to send attachment.').catch(() => {});
  }
});

client.on(Events.Error, (err) => console.error(err));

await client.login(process.env.FLUXER_BOT_TOKEN);
