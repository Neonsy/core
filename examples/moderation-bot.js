/**
 * Moderation example — !ban, !kick, !unban, !perms.
 *
 * Requires Ban Members / Kick Members (server owner has all permissions).
 *
 * Usage:
 *   FLUXER_BOT_TOKEN=your_token node examples/moderation-bot.js
 *
 * @see https://fluxerjs.blstmo.com/guides/permissions/
 * @see https://fluxerjs.blstmo.com/guides/moderation/
 */

import {
  Client,
  EmbedBuilder,
  ErrorCodes,
  Events,
  FluxerError,
  PermissionFlags,
  parsePrefixCommand,
  parseUserMention,
} from '@fluxerjs/core';

const PREFIX = '!';

async function resolveGuild(message) {
  if (!message.guildId) return null;
  try {
    return message.guild ?? (await message.resolveGuild());
  } catch (err) {
    if (err instanceof FluxerError && err.code === ErrorCodes.GuildNotFound) return null;
    throw err;
  }
}

async function resolveMember(guild, userId) {
  const cached = guild.members.get(userId);
  if (cached) return cached;
  try {
    return await guild.fetchMember(userId);
  } catch (err) {
    if (err instanceof FluxerError && err.code === ErrorCodes.MemberNotFound) return null;
    throw err;
  }
}

async function getModeratorPerms(message, guild) {
  const member =
    guild.members.get(message.author.id) ?? (await resolveMember(guild, message.author.id));
  return member?.permissions ?? null;
}

function getPermissionNames(perms) {
  return Object.keys(PermissionFlags).filter((name) => perms.has(PermissionFlags[name]));
}

const client = new Client();

client.on(Events.Ready, () => {
  console.log(`Logged in as ${client.user?.username}. Commands: !ban, !kick, !unban, !perms`);
});

async function handleMessageCreate(message) {
  if (message.author.bot || !message.content) return;
  const parsed = parsePrefixCommand(message.content, PREFIX);
  if (!parsed) return;

  const { command, args } = parsed;
  const targetArg = args[0];
  const reason = args.slice(1).join(' ') || null;

  const guild = await resolveGuild(message);
  if (!guild) {
    await message.reply('Moderation commands only work in a server.');
    return;
  }

  const userId = targetArg ? parseUserMention(targetArg) : null;
  const perms = await getModeratorPerms(message, guild);
  if (!perms) {
    await message.reply(
      'Could not load your member data. The bot may need access to view server members.',
    );
    return;
  }

  const canBan = perms.has(PermissionFlags.BanMembers) || perms.has(PermissionFlags.Administrator);
  const canKick =
    perms.has(PermissionFlags.KickMembers) || perms.has(PermissionFlags.Administrator);

  if (command === 'perms') {
    const names = getPermissionNames(perms);
    await message.reply(
      names.length > 0
        ? `**Your server permissions:**\n\`\`\`\n${names.join(', ')}\n\`\`\``
        : 'You have no server permissions.',
    );
    return;
  }

  if (command === 'ban') {
    if (!canBan) {
      await message.reply('You need the Ban Members permission to use this command.');
      return;
    }
    if (!userId) {
      await message.reply('Usage: `!ban @user [reason]`');
      return;
    }
    try {
      await guild.ban(userId, {
        reason: reason ?? undefined,
        deleteMessageDays: 1,
      });
      const targetUser = message.mentions.find((u) => u.id === userId) ?? { username: 'Unknown' };
      const embed = new EmbedBuilder()
        .setTitle('User Banned')
        .setColor(0xe74c3c)
        .addFields(
          { name: 'User', value: `<@${userId}> (${targetUser.username})`, inline: true },
          { name: 'Moderator', value: `${message.author.username}`, inline: true },
        )
        .setTimestamp();
      if (reason) embed.addFields({ name: 'Reason', value: reason });
      await message.reply({ embeds: [embed] });
    } catch (err) {
      const code = err instanceof FluxerError ? err.code : null;
      const status = err?.statusCode ?? err?.cause?.statusCode;
      const msg =
        code === ErrorCodes.MemberNotFound || status === 404
          ? 'User not found or not in this server.'
          : (err?.message ?? 'Failed to ban user.');
      await message.reply(`Error: ${msg}`);
    }
    return;
  }

  if (command === 'kick') {
    if (!canKick) {
      await message.reply('You need the Kick Members permission to use this command.');
      return;
    }
    if (!userId) {
      await message.reply('Usage: `!kick @user [reason]`');
      return;
    }
    try {
      await guild.kick(userId);
      const targetUser = message.mentions.find((u) => u.id === userId) ?? { username: 'Unknown' };
      const embed = new EmbedBuilder()
        .setTitle('User Kicked')
        .setColor(0xf39c12)
        .addFields(
          { name: 'User', value: `<@${userId}> (${targetUser.username})`, inline: true },
          { name: 'Moderator', value: `${message.author.username}`, inline: true },
        )
        .setTimestamp();
      if (reason) embed.addFields({ name: 'Reason', value: reason });
      await message.reply({ embeds: [embed] });
    } catch (err) {
      const code = err instanceof FluxerError ? err.code : null;
      const status = err?.statusCode ?? err?.cause?.statusCode;
      const msg =
        code === ErrorCodes.MemberNotFound || status === 404
          ? 'User not found or not in this server.'
          : (err?.message ?? 'Failed to kick user.');
      await message.reply(`Error: ${msg}`);
    }
    return;
  }

  if (command === 'unban') {
    if (!canBan) {
      await message.reply('You need the Ban Members permission to use this command.');
      return;
    }
    if (!userId) {
      await message.reply('Usage: `!unban @user`');
      return;
    }
    try {
      await guild.unban(userId);
      await message.reply(`Unbanned <@${userId}>.`);
    } catch (err) {
      const status = err?.statusCode ?? err?.cause?.statusCode;
      const msg =
        status === 404 ? 'User is not banned.' : (err?.message ?? 'Failed to unban user.');
      await message.reply(`Error: ${msg}`);
    }
  }
}

client.on(Events.MessageCreate, (message) => {
  void handleMessageCreate(message).catch((err) => {
    client.emit(Events.Error, err instanceof Error ? err : new Error(String(err)));
  });
});

client.on(Events.Error, (err) => console.error('[fluxer]', err));

try {
  await client.login(process.env.FLUXER_BOT_TOKEN);
} catch (err) {
  console.error('Login failed:', err);
  process.exit(1);
}
