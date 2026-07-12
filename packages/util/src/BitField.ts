/**
 * Multi-flag storage backed by bigint (supports bits ≥ 32).
 */
export type BitFieldResolvable<S extends string> =
  | S
  | bigint
  | number
  | string
  | BitField<S>
  | readonly (S | number | bigint | string | BitField<S>)[];

function invalidBit(bits: unknown): never {
  throw new RangeError(`Invalid bitfield flag or number: ${String(bits)}`);
}

type BitFieldCtor = typeof BitField;

export class BitField<S extends string> {
  static Flags: Record<string, bigint> = {};
  static DefaultBit = 0n;

  bitfield: bigint;

  constructor(bits: BitFieldResolvable<S> = (this.constructor as BitFieldCtor).DefaultBit) {
    this.bitfield = (this.constructor as BitFieldCtor).resolve(bits);
  }

  get [Symbol.toStringTag](): string {
    return `BitField(${this.bitfield})`;
  }

  /** Resolve a resolvable into a single bigint bitfield. */
  static resolve<S extends string>(bits: BitFieldResolvable<S>): bigint {
    if (typeof bits === 'bigint') {
      if (bits < 0n) invalidBit(bits);
      return bits;
    }
    if (typeof bits === 'number') {
      if (!Number.isInteger(bits) || bits < 0 || !Number.isSafeInteger(bits)) invalidBit(bits);
      return BigInt(bits);
    }
    if (bits instanceof BitField) return bits.bitfield;
    if (typeof bits === 'string') {
      const Flags = this.Flags;
      if (Object.hasOwn(Flags, bits)) return Flags[bits]!;
      if (/^(0|[1-9]\d*)$/.test(bits)) return BigInt(bits);
      invalidBit(bits);
    }
    if (Array.isArray(bits)) {
      let acc = 0n;
      for (const bit of bits) acc |= this.resolve(bit);
      return acc;
    }
    invalidBit(bits);
  }

  private get ctor(): BitFieldCtor {
    return this.constructor as BitFieldCtor;
  }

  private orAll(...bits: BitFieldResolvable<S>[]): bigint {
    const resolve = this.ctor.resolve.bind(this.ctor);
    let total = 0n;
    for (const bit of bits) total |= resolve(bit);
    return total;
  }

  /** Whether this bitfield contains all of the given bits. */
  has(bit: BitFieldResolvable<S>): boolean {
    const resolved = this.ctor.resolve(bit);
    return (this.bitfield & resolved) === resolved;
  }

  /** Whether this bitfield contains any of the given bits. */
  any(bit: BitFieldResolvable<S>): boolean {
    return (this.bitfield & this.ctor.resolve(bit)) !== 0n;
  }

  /** Bits present in `bit` but missing from this bitfield. */
  missing(bit: BitFieldResolvable<S>): S[] {
    return new this.ctor<S>(this.ctor.resolve(bit) & ~this.bitfield).toArray();
  }

  add(...bits: BitFieldResolvable<S>[]): this {
    this.bitfield |= this.orAll(...bits);
    return this;
  }

  remove(...bits: BitFieldResolvable<S>[]): this {
    this.bitfield &= ~this.orAll(...bits);
    return this;
  }

  serialize(): Record<S, boolean> {
    const Flags = this.ctor.Flags as Record<S, bigint>;
    const out = {} as Record<S, boolean>;
    for (const key of Object.keys(Flags) as S[]) {
      out[key] = (this.bitfield & Flags[key]) === Flags[key];
    }
    return out;
  }

  toArray(): S[] {
    const Flags = this.ctor.Flags as Record<S, bigint>;
    const result: S[] = [];
    for (const key of Object.keys(Flags) as S[]) {
      if ((this.bitfield & Flags[key]) === Flags[key]) result.push(key);
    }
    return result;
  }

  /** Decimal string of the bigint bitfield (API / JSON). */
  toJSON(): string {
    return this.bitfield.toString();
  }

  toString(): string {
    return this.bitfield.toString();
  }

  valueOf(): bigint {
    return this.bitfield;
  }

  equals(other: BitFieldResolvable<S>): boolean {
    return this.bitfield === this.ctor.resolve(other);
  }

  freeze(): Readonly<this> {
    return Object.freeze(this);
  }

  *[Symbol.iterator](): IterableIterator<S> {
    yield* this.toArray();
  }
}
