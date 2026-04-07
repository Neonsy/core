import type {
  APIApplicationCommandInteraction,
  APIApplicationCommandOptionValue,
} from '@fluxerjs/types';
import { ErrorCodes } from '../../errors/ErrorCodes.js';
import { FluxerError } from '../../errors/FluxerError.js';
import type { Client } from '../../client/Client.js';
import { BaseInteraction } from './BaseInteraction.js';

/** Discord application command option types (subset used by getters). */
const CommandOptionType = {
  SubCommand: 1,
  SubCommandGroup: 2,
  String: 3,
  Integer: 4,
  Boolean: 5,
  Number: 10,
} as const;

type RawOption = {
  name: string;
  type: number;
  value?: APIApplicationCommandOptionValue;
  options?: RawOption[];
};

function findOptionDeep(options: RawOption[] | undefined, name: string): RawOption | undefined {
  if (!options?.length) return undefined;
  for (const o of options) {
    if (o.name === name && o.value !== undefined) return o;
    const nested = findOptionDeep(o.options, name);
    if (nested) return nested;
  }
  return undefined;
}

/**
 * Slash / application command interaction from `INTERACTION_CREATE`.
 */
export class ChatInputCommandInteraction extends BaseInteraction {
  constructor(client: Client, raw: APIApplicationCommandInteraction) {
    super(client, raw);
    if (raw.data?.name == null) {
      throw new FluxerError(
        'ChatInputCommandInteraction requires interaction data with a command name',
        {
          code: ErrorCodes.InteractionInvalidPayload,
        },
      );
    }
  }

  /** Command name (e.g. `ping`). */
  get commandName(): string {
    return this.raw.data!.name;
  }

  /** Resolved option leaf by name (searches nested subcommand options). */
  protected getOption(name: string): RawOption {
    const opt = findOptionDeep(this.raw.data?.options as RawOption[] | undefined, name);
    if (!opt) {
      throw new FluxerError(`Interaction option "${name}" was not provided`, {
        code: ErrorCodes.InteractionOptionNotFound,
      });
    }
    return opt;
  }

  getString(name: string): string {
    const o = this.getOption(name);
    if (o.type !== CommandOptionType.String) {
      throw new FluxerError(`Option "${name}" is not a string`, {
        code: ErrorCodes.InteractionOptionTypeMismatch,
      });
    }
    return String(o.value);
  }

  getInteger(name: string): number {
    const o = this.getOption(name);
    if (o.type !== CommandOptionType.Integer) {
      throw new FluxerError(`Option "${name}" is not an integer`, {
        code: ErrorCodes.InteractionOptionTypeMismatch,
      });
    }
    const v = o.value;
    if (typeof v !== 'number' || !Number.isInteger(v)) {
      throw new FluxerError(`Option "${name}" has invalid integer value`, {
        code: ErrorCodes.InteractionOptionTypeMismatch,
      });
    }
    return v;
  }

  getNumber(name: string): number {
    const o = this.getOption(name);
    if (o.type !== CommandOptionType.Number && o.type !== CommandOptionType.Integer) {
      throw new FluxerError(`Option "${name}" is not a number`, {
        code: ErrorCodes.InteractionOptionTypeMismatch,
      });
    }
    const v = o.value;
    if (typeof v !== 'number') {
      throw new FluxerError(`Option "${name}" has invalid number value`, {
        code: ErrorCodes.InteractionOptionTypeMismatch,
      });
    }
    return v;
  }

  getBoolean(name: string): boolean {
    const o = this.getOption(name);
    if (o.type !== CommandOptionType.Boolean) {
      throw new FluxerError(`Option "${name}" is not a boolean`, {
        code: ErrorCodes.InteractionOptionTypeMismatch,
      });
    }
    if (typeof o.value !== 'boolean') {
      throw new FluxerError(`Option "${name}" has invalid boolean value`, {
        code: ErrorCodes.InteractionOptionTypeMismatch,
      });
    }
    return o.value;
  }

  /** Name of the invoked subcommand (when using subcommands). */
  getSubcommand(fallback?: string): string {
    const opts = this.raw.data?.options as RawOption[] | undefined;
    const first = opts?.[0];
    if (first?.type === CommandOptionType.SubCommand) return first.name;
    if (first?.type === CommandOptionType.SubCommandGroup) {
      const inner = first.options?.[0];
      if (inner?.type === CommandOptionType.SubCommand) return inner.name;
    }
    if (fallback !== undefined) return fallback;
    throw new FluxerError('No subcommand in this interaction', {
      code: ErrorCodes.InteractionOptionNotFound,
    });
  }
}
