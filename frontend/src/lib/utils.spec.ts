import { describe, it, expect } from 'vitest';
import {
  toPersianDigits,
  formatPersianDate,
  getStatusBadgeVariant,
  getPriorityBadgeVariant,
} from './utils';
import { TicketStatus, TicketPriority } from '@nit-help/shared';

describe('Frontend Utility Functions', () => {
  describe('toPersianDigits', () => {
    it('should convert Latin digits to Persian digits correctly', () => {
      expect(toPersianDigits(1234567890)).toBe('۱۲۳۴۵۶۷۸۹۰');
      expect(toPersianDigits('NIT-20261107-1001')).toBe('NIT-۲۰۲۶۱۱۰۷-۱۰۰۱');
      expect(toPersianDigits(null)).toBe('');
      expect(toPersianDigits(undefined)).toBe('');
    });
  });

  describe('formatPersianDate', () => {
    it('should format valid ISO date to Persian format', () => {
      const date = '2026-11-07T12:00:00.000Z';
      const formatted = formatPersianDate(date);
      expect(formatted).not.toBe('—');
      expect(typeof formatted).toBe('string');
    });

    it('should return dash when date is null or undefined', () => {
      expect(formatPersianDate(null)).toBe('—');
      expect(formatPersianDate(undefined)).toBe('—');
    });
  });

  describe('getStatusBadgeVariant', () => {
    it('should return appropriate color classes for all TicketStatus values', () => {
      expect(getStatusBadgeVariant(TicketStatus.NEW)).toContain('blue');
      expect(getStatusBadgeVariant(TicketStatus.ASSIGNED)).toContain('indigo');
      expect(getStatusBadgeVariant(TicketStatus.IN_PROGRESS)).toContain('amber');
      expect(getStatusBadgeVariant(TicketStatus.WAITING_FOR_REQUESTER)).toContain('purple');
      expect(getStatusBadgeVariant(TicketStatus.RESOLVED)).toContain('emerald');
      expect(getStatusBadgeVariant(TicketStatus.CLOSED)).toContain('slate');
    });
  });

  describe('getPriorityBadgeVariant', () => {
    it('should return appropriate color classes for all TicketPriority values', () => {
      expect(getPriorityBadgeVariant(TicketPriority.LOW)).toContain('slate');
      expect(getPriorityBadgeVariant(TicketPriority.NORMAL)).toContain('sky');
      expect(getPriorityBadgeVariant(TicketPriority.HIGH)).toContain('orange');
      expect(getPriorityBadgeVariant(TicketPriority.URGENT)).toContain('rose');
    });
  });
});

