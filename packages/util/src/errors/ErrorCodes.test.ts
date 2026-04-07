import { describe, it, expect } from 'vitest';
import { ErrorCodes } from './ErrorCodes.js';

describe('ErrorCodes', () => {
  it('has expected error codes', () => {
    expect(ErrorCodes.ClientNotReady).toBe('CLIENT_NOT_READY');
    expect(ErrorCodes.ChannelNotFound).toBe('CHANNEL_NOT_FOUND');
    expect(ErrorCodes.GuildNotFound).toBe('GUILD_NOT_FOUND');
    expect(ErrorCodes.EmojiNotFound).toBe('EMOJI_NOT_FOUND');
    expect(ErrorCodes.WebhookTokenRequired).toBe('WEBHOOK_TOKEN_REQUIRED');
    expect(ErrorCodes.InvalidInvite).toBe('INVALID_INVITE');
    expect(ErrorCodes.NotLoggedIn).toBe('NOT_LOGGED_IN');
    expect(ErrorCodes.InvalidEmoji).toBe('INVALID_EMOJI');
    expect(ErrorCodes.WebSocketLoadFailed).toBe('WEBSOCKET_LOAD_FAILED');
  });

  it('has all required codes', () => {
    const codes = Object.values(ErrorCodes);
    expect(codes).toContain('CLIENT_NOT_READY');
    expect(codes).toContain('INVALID_TOKEN');
    expect(codes).toContain('CHANNEL_NOT_FOUND');
    expect(codes).toContain('MESSAGE_NOT_FOUND');
  });
});
