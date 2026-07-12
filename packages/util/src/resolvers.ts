import { SnowflakeUtil } from './SnowflakeUtil.js';

/**
 * Resolve a color from various input types to a number (0–16777215).
 */
export function resolveColor(color: number | string | readonly [number, number, number]): number {
  if (typeof color === 'number') {
    if (!Number.isInteger(color) || color < 0 || color > 0xffffff) {
      throw new RangeError('Color must be between 0 and 16777215');
    }
    return color;
  }
  if (Array.isArray(color)) {
    const [r, g, b] = color;
    if (
      !Number.isInteger(r) ||
      !Number.isInteger(g) ||
      !Number.isInteger(b) ||
      r < 0 ||
      r > 255 ||
      g < 0 ||
      g > 255 ||
      b < 0 ||
      b > 255
    ) {
      throw new RangeError('RGB components must be integers 0–255');
    }
    return (r << 16) | (g << 8) | b;
  }
  if (typeof color === 'string') {
    const hex = color.startsWith('#') ? color.slice(1) : color;
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new RangeError('Invalid hex color');
    return Number.parseInt(hex, 16);
  }
  throw new TypeError('Color must be a number, hex string, or RGB array');
}

export interface ParsedEmoji {
  id: string | null;
  name: string;
  animated?: boolean;
}

/**
 * Parse an emoji string into id and name.
 * Supports: `<a?:name:id>`, `:name:`, `name:id`, unicode.
 */
export function parseEmoji(emoji: string): ParsedEmoji | null {
  if (typeof emoji !== 'string') return null;
  const trimmed = emoji.trim();
  if (trimmed.length === 0) return null;

  const mentionMatch = /^<(a?):(\w+):(\d+)>$/.exec(trimmed);
  if (mentionMatch) {
    return {
      id: mentionMatch[3]!,
      name: mentionMatch[2]!,
      animated: mentionMatch[1] === 'a',
    };
  }

  const nameIdMatch = /^(\w+):(\d{17,19})$/.exec(trimmed);
  if (nameIdMatch) {
    return { id: nameIdMatch[2]!, name: nameIdMatch[1]! };
  }

  const colonsMatch = /^:(\w+):$/.exec(trimmed);
  if (colonsMatch) {
    return { id: null, name: colonsMatch[1]! };
  }

  return { id: null, name: trimmed };
}

/**
 * Parse a user mention or raw snowflake and extract the user ID.
 * Supports: `<@id>`, `<@!id>`, or a valid snowflake string.
 */
export function parseUserMention(arg: string): string | null {
  if (typeof arg !== 'string') return null;
  const trimmed = arg.trim();
  if (trimmed.length === 0) return null;

  const mentionMatch = /^<@!?(\d{17,19})>$/.exec(trimmed);
  if (mentionMatch) return mentionMatch[1]!;

  return SnowflakeUtil.isValid(trimmed) && trimmed.length >= 17 && trimmed.length <= 19
    ? trimmed
    : null;
}

/**
 * Parse a role mention (`<@&id>`) and extract the role ID.
 */
export function parseRoleMention(arg: string): string | null {
  if (typeof arg !== 'string') return null;
  const match = /^<@&(\d{17,19})>$/.exec(arg.trim());
  return match?.[1] ?? null;
}

export interface ParsedPrefixCommand {
  command: string;
  args: string[];
}

/**
 * Parse prefix command content into command name and args.
 * Returns null if content does not start with the prefix.
 */
export function parsePrefixCommand(content: string, prefix: string): ParsedPrefixCommand | null {
  if (typeof content !== 'string' || typeof prefix !== 'string' || prefix.length === 0) {
    return null;
  }
  const trimmed = content.trim();
  if (!trimmed.startsWith(prefix)) return null;
  const rest = trimmed.slice(prefix.length).trim();
  if (rest.length === 0) return null;
  const parts = rest.split(/\s+/);
  const command = parts[0]?.toLowerCase() ?? '';
  if (command.length === 0) return null;
  return { command, args: parts.slice(1) };
}

/**
 * Convert emoji to API reaction format.
 * Custom: `name:id` (animated: `a:name:id`); Unicode: URI-encoded character.
 */
export function formatEmoji(emoji: {
  id: string | null;
  name: string;
  animated?: boolean;
}): string {
  if (emoji.id) {
    return emoji.animated ? `a:${emoji.name}:${emoji.id}` : `:${emoji.name}:${emoji.id}`;
  }
  return encodeURIComponent(emoji.name);
}
