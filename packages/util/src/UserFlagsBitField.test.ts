import { describe, it, expect } from 'vitest';
import { UserFlagsBitField, UserFlagsBits } from './UserFlagsBitField.js';

describe('UserFlagsBitField', () => {
  it('creates with default 0', () => {
    expect(new UserFlagsBitField().bitfield).toBe(0n);
  });

  it('has checks Staff flag', () => {
    const bf = new UserFlagsBitField([UserFlagsBits.Staff]);
    expect(bf.has(UserFlagsBits.Staff)).toBe(true);
    expect(bf.has(UserFlagsBits.Partner)).toBe(false);
  });

  it('handles high bits above 2^32', () => {
    const bf = new UserFlagsBitField([UserFlagsBits.Deleted, UserFlagsBits.StaffHidden]);
    expect(bf.has(UserFlagsBits.Deleted)).toBe(true);
    expect(bf.has(UserFlagsBits.StaffHidden)).toBe(true);
    expect(bf.toJSON()).toBe(String(UserFlagsBits.Deleted | UserFlagsBits.StaffHidden));
  });

  it('add and remove BugHunter', () => {
    const bf = new UserFlagsBitField().add(UserFlagsBits.BugHunter).add(UserFlagsBits.Partner);
    expect(bf.has(UserFlagsBits.BugHunter)).toBe(true);
    bf.remove(UserFlagsBits.BugHunter);
    expect(bf.has(UserFlagsBits.BugHunter)).toBe(false);
  });

  it('serialize returns flags object', () => {
    const bf = new UserFlagsBitField([UserFlagsBits.FriendlyBot]);
    expect(bf.serialize().FriendlyBot).toBe(true);
  });

  it('toArray returns enabled flag names', () => {
    const arr = new UserFlagsBitField([UserFlagsBits.Staff, UserFlagsBits.Partner]).toArray();
    expect(arr).toContain('Staff');
    expect(arr).toContain('Partner');
  });

  it('throws for invalid flag', () => {
    expect(() => new UserFlagsBitField('InvalidFlag' as 'Staff')).toThrow(RangeError);
  });
});
