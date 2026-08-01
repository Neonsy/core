import { describe, expect, it } from 'vitest';
import { BitField } from './BitField.js';

class TestBitField extends BitField<'A' | 'B' | 'C'> {
  static override Flags = { A: 1n, B: 2n, C: 4n };
}

describe('BitField', () => {
  it('creates with default bit 0n', () => {
    const bf = new TestBitField();
    expect(bf.bitfield).toBe(0n);
  });

  it('resolves number', () => {
    expect(new TestBitField(3).bitfield).toBe(3n);
  });

  it('resolves string flag', () => {
    expect(new TestBitField('A').bitfield).toBe(1n);
  });

  it('resolves array of flags with OR', () => {
    expect(new TestBitField(['A', 'B']).bitfield).toBe(3n);
  });

  it('has checks single bit', () => {
    const bf = new TestBitField(['A', 'B']);
    expect(bf.has('A')).toBe(true);
    expect(bf.has('B')).toBe(true);
    expect(bf.has('C')).toBe(false);
  });

  it('any checks partial bits', () => {
    const bf = new TestBitField('A');
    expect(bf.any(['A', 'B'])).toBe(true);
    expect(bf.any('C')).toBe(false);
  });

  it('missing returns unset flag names', () => {
    const bf = new TestBitField('A');
    expect(bf.missing(['A', 'B', 'C'])).toEqual(['B', 'C']);
  });

  it('has requires all bits for composite checks', () => {
    const bf = new TestBitField('A');
    expect(bf.has(['A', 'B'])).toBe(false);
    bf.add('B');
    expect(bf.has(['A', 'B'])).toBe(true);
  });

  it('resolves numeric bigint string literal', () => {
    expect(new TestBitField('8').bitfield).toBe(8n);
  });

  it('add sets bits', () => {
    expect(new TestBitField('A').add('B').bitfield).toBe(3n);
  });

  it('remove unsets bits', () => {
    expect(new TestBitField(['A', 'B', 'C']).remove('B').bitfield).toBe(5n);
  });

  it('serialize returns object', () => {
    expect(new TestBitField(['A', 'C']).serialize()).toEqual({ A: true, B: false, C: true });
  });

  it('toArray returns enabled flags', () => {
    expect(new TestBitField(['A', 'C']).toArray()).toEqual(['A', 'C']);
  });

  it('toJSON and valueOf', () => {
    const bf = new TestBitField(5);
    expect(bf.toJSON()).toBe('5');
    expect(bf.valueOf()).toBe(5n);
    expect(bf.toString()).toBe('5');
  });

  it('equals compares resolvables', () => {
    const a = new TestBitField(['A', 'B']);
    expect(a.equals(3)).toBe(true);
    expect(a.equals('A')).toBe(false);
  });

  it('freeze returns frozen instance', () => {
    expect(Object.isFrozen(new TestBitField('A').freeze())).toBe(true);
  });

  it('iterates flag names', () => {
    expect([...new TestBitField(['A', 'C'])]).toEqual(['A', 'C']);
  });

  it('throws for invalid flag string', () => {
    expect(() => new TestBitField('Invalid' as 'A')).toThrow(RangeError);
  });

  it('throws for negative or non-integer numbers', () => {
    expect(() => new TestBitField(-1)).toThrow(RangeError);
    expect(() => new TestBitField(1.5)).toThrow(RangeError);
  });
});
