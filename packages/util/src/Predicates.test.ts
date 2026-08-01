import { describe, expect, it } from 'vitest';
import { asRecord, isRecord, num, str } from './Predicates.js';

describe('isRecord', () => {
  it('accepts plain objects', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('rejects null, arrays, and primitives', () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord([])).toBe(false);
    expect(isRecord('x')).toBe(false);
    expect(isRecord(1)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe('asRecord', () => {
  it('returns the record when it is one', () => {
    const obj = { a: 1 };
    expect(asRecord(obj)).toBe(obj);
  });

  it('returns null otherwise', () => {
    expect(asRecord([])).toBeNull();
    expect(asRecord(null)).toBeNull();
    expect(asRecord(3)).toBeNull();
  });
});

describe('str', () => {
  it('passes strings through', () => {
    expect(str('hi')).toBe('hi');
    expect(str('')).toBe('');
  });

  it('returns undefined for non-strings', () => {
    expect(str(1)).toBeUndefined();
    expect(str(null)).toBeUndefined();
    expect(str({})).toBeUndefined();
  });
});

describe('num', () => {
  it('passes numbers through', () => {
    expect(num(0)).toBe(0);
    expect(num(-4.5)).toBe(-4.5);
  });

  it('returns undefined for non-numbers', () => {
    expect(num('1')).toBeUndefined();
    expect(num(null)).toBeUndefined();
    expect(num(Number.NaN)).toBeNaN(); // NaN is typeof number, passes through
  });
});
