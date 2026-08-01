import { describe, expect, it } from 'vitest';
import { SnowflakeUtil } from './SnowflakeUtil.js';

describe('SnowflakeUtil', () => {
  it('timestampFromSnowflake round-trips', () => {
    const ts = 1_609_459_200_000;
    const snowflake = SnowflakeUtil.snowflakeFromTimestamp(ts);
    expect(SnowflakeUtil.timestampFromSnowflake(snowflake)).toBe(ts);
  });

  it('isValid accepts valid snowflakes', () => {
    expect(SnowflakeUtil.isValid('1234567890123456789')).toBe(true);
    expect(SnowflakeUtil.isValid('0')).toBe(true);
  });

  it('isValid rejects invalid snowflakes', () => {
    expect(SnowflakeUtil.isValid('')).toBe(false);
    expect(SnowflakeUtil.isValid('abc')).toBe(false);
    expect(SnowflakeUtil.isValid('-1')).toBe(false);
    expect(SnowflakeUtil.isValid('0123')).toBe(false);
  });

  it('parse returns bigint', () => {
    expect(SnowflakeUtil.parse('123')).toBe(123n);
  });

  it('deconstruct returns components', () => {
    const result = SnowflakeUtil.deconstruct('1234567890123456789');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('workerId');
    expect(result).toHaveProperty('processId');
    expect(result).toHaveProperty('increment');
  });

  it('snowflakeFromTimestamp round-trips within second', () => {
    const ts = Date.now();
    const snowflake = SnowflakeUtil.snowflakeFromTimestamp(ts);
    const back = SnowflakeUtil.timestampFromSnowflake(snowflake);
    expect(Math.floor(back / 1000)).toBe(Math.floor(ts / 1000));
  });

  it('dateFromSnowflake returns Date', () => {
    const ts = 1_609_459_200_000;
    const snowflake = SnowflakeUtil.snowflakeFromTimestamp(ts);
    const date = SnowflakeUtil.dateFromSnowflake(snowflake);
    expect(date).toBeInstanceOf(Date);
    expect(date.getTime()).toBe(ts);
  });

  it('deconstruct returns correct component values', () => {
    const sf = SnowflakeUtil.snowflakeFromTimestamp(1_609_459_200_000);
    const d = SnowflakeUtil.deconstruct(sf);
    expect(d.timestamp).toBe(1_609_459_200_000);
    expect(d.date).toBeInstanceOf(Date);
    expect(typeof d.workerId).toBe('number');
    expect(typeof d.processId).toBe('number');
    expect(typeof d.increment).toBe('number');
  });

  it('deconstruct throws for non-numeric string', () => {
    expect(() => SnowflakeUtil.deconstruct('abc')).toThrow(TypeError);
    expect(() => SnowflakeUtil.deconstruct('12.34')).toThrow(TypeError);
  });

  it('isValid rejects negative and too long', () => {
    expect(SnowflakeUtil.isValid('-123')).toBe(false);
    expect(SnowflakeUtil.isValid(`1${'0'.repeat(20)}`)).toBe(false);
  });
});
