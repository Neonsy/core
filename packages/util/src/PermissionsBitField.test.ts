import { describe, expect, it } from 'vitest';
import {
  ALL_PERMISSIONS_BIGINT,
  PermissionFlags,
  PermissionsBitField,
  resolvePermissionsToBitfield,
} from './PermissionsBitField.js';

describe('resolvePermissionsToBitfield', () => {
  it('returns string bitfields as decimal strings', () => {
    expect(resolvePermissionsToBitfield('2048')).toBe('2048');
    expect(resolvePermissionsToBitfield('8933636165185')).toBe('8933636165185');
  });

  it('resolves PermissionString to bitfield', () => {
    expect(resolvePermissionsToBitfield('SendMessages')).toBe('2048');
    expect(resolvePermissionsToBitfield('Administrator')).toBe('8');
  });

  it('resolves number and bigint', () => {
    expect(resolvePermissionsToBitfield(2048)).toBe('2048');
    expect(resolvePermissionsToBitfield(PermissionFlags.SendMessages)).toBe('2048');
    expect(resolvePermissionsToBitfield(2048n)).toBe('2048');
  });

  it('resolves array of permissions with OR', () => {
    expect(resolvePermissionsToBitfield(['SendMessages', 'ViewChannel'])).toBe('3072');
  });

  it('resolves PermissionsBitField instance', () => {
    const bf = new PermissionsBitField([PermissionFlags.BanMembers]);
    expect(resolvePermissionsToBitfield(bf)).toBe('4');
  });

  it('throws for invalid permission string', () => {
    expect(() => resolvePermissionsToBitfield('InvalidPermission')).toThrow(RangeError);
  });
});

describe('PermissionsBitField', () => {
  it('uses bigint for high-bit permissions', () => {
    expect(PermissionFlags.UseExternalStickers).toBe(1n << 37n);
    expect(PermissionFlags.ModerateMembers).toBe(1n << 40n);
    expect(PermissionFlags.CreateExpressions).toBe(1n << 43n);
    expect(PermissionFlags.PinMessages).toBe(1n << 51n);
    expect(PermissionFlags.BypassSlowmode).toBe(1n << 52n);
    expect(PermissionFlags.UpdateRtcRegion).toBe(1n << 53n);
  });

  it('has a single canonical name for bit 30', () => {
    expect(PermissionFlags.ManageExpressions).toBe(1n << 30n);
    expect('ManageEmojisAndStickers' in PermissionFlags).toBe(false);
    const arr = new PermissionsBitField([PermissionFlags.ManageExpressions]).toArray();
    expect(arr).toEqual(['ManageExpressions']);
  });

  it('has checks single permission', () => {
    const bf = new PermissionsBitField([PermissionFlags.SendMessages]);
    expect(bf.has(PermissionFlags.SendMessages)).toBe(true);
    expect(bf.has(PermissionFlags.BanMembers)).toBe(false);
  });

  it('Administrator implies all permissions', () => {
    const bf = new PermissionsBitField([PermissionFlags.Administrator]);
    expect(bf.has(PermissionFlags.Administrator)).toBe(true);
    expect(bf.has(PermissionFlags.BanMembers)).toBe(true);
    expect(bf.has(PermissionFlags.PinMessages)).toBe(true);
    expect(bf.any(PermissionFlags.BanMembers)).toBe(true);
    expect(bf.missing([PermissionFlags.BanMembers, PermissionFlags.PinMessages])).toEqual([]);
  });

  it('ALL_PERMISSIONS_BIGINT includes high bits', () => {
    expect((ALL_PERMISSIONS_BIGINT & PermissionFlags.PinMessages) !== 0n).toBe(true);
    expect((ALL_PERMISSIONS_BIGINT & PermissionFlags.UpdateRtcRegion) !== 0n).toBe(true);
  });

  it('toArray returns permission names', () => {
    const bf = new PermissionsBitField([PermissionFlags.SendMessages, PermissionFlags.ViewChannel]);
    const arr = bf.toArray();
    expect(arr).toContain('SendMessages');
    expect(arr).toContain('ViewChannel');
    expect(arr).toHaveLength(2);
  });

  it('serialize returns permission object', () => {
    const bf = new PermissionsBitField([PermissionFlags.BanMembers]);
    const s = bf.serialize();
    expect(s.BanMembers).toBe(true);
    expect(s.SendMessages).toBe(false);
  });
});
