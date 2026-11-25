import { TicketStatus, UserRole } from '@nit-help/shared';
import {
  TicketForbiddenError,
  TicketValidationError,
} from './ticket.errors';
import { TicketPolicy } from './ticket.policy';

describe('TicketPolicy (Pure Domain Rules)', () => {
  it('allows requester to view own ticket and denies other requesters', () => {
    const ticket = {
      requesterId: 'stu-1',
      assignedToId: null,
      departmentId: 'dept-1',
    };

    expect(() =>
      TicketPolicy.assertCanViewTicket(ticket, {
        id: 'stu-1',
        role: UserRole.STUDENT,
        departmentId: null,
      }),
    ).not.toThrow();

    expect(() =>
      TicketPolicy.assertCanViewTicket(ticket, {
        id: 'stu-2',
        role: UserRole.STUDENT,
        departmentId: null,
      }),
    ).toThrow(TicketForbiddenError);
  });

  it('prevents specialists from accessing tickets in other departments unless assigned', () => {
    const ticket = {
      requesterId: 'stu-1',
      assignedToId: 'spec-other',
      departmentId: 'dept-edu',
    };

    expect(() =>
      TicketPolicy.assertCanViewTicket(ticket, {
        id: 'spec-it',
        role: UserRole.SPECIALIST,
        departmentId: 'dept-it',
      }),
    ).toThrow(TicketForbiddenError);
  });

  it('allows requesters only to close or reopen tickets', () => {
    const ticket = { requesterId: 'stu-1' };

    expect(() =>
      TicketPolicy.assertCanUpdateStatus(
        ticket,
        { id: 'stu-1', role: UserRole.STUDENT },
        TicketStatus.CLOSED,
      ),
    ).not.toThrow();

    expect(() =>
      TicketPolicy.assertCanUpdateStatus(
        ticket,
        { id: 'stu-1', role: UserRole.STUDENT },
        TicketStatus.RESOLVED,
      ),
    ).toThrow(TicketForbiddenError);
  });

  it('forces isInternal=false when requester sends a message', () => {
    const result = TicketPolicy.resolveMessageCreation(
      { requesterId: 'stu-1' },
      { id: 'stu-1', role: UserRole.STUDENT },
      true,
    );
    expect(result.isInternal).toBe(false);
    expect(result.isRequester).toBe(true);
  });

  it('validates feedback preconditions in domain', () => {
    expect(() =>
      TicketPolicy.assertCanSubmitFeedback(
        {
          requesterId: 'stu-1',
          status: TicketStatus.IN_PROGRESS,
          feedback: null,
        },
        { id: 'stu-1' },
      ),
    ).toThrow(TicketValidationError);
  });

  it('generates sequential ticket numbers from latest sequence', () => {
    expect(TicketPolicy.nextTicketNumber(null, 'NIT-20261125-')).toBe(
      'NIT-20261125-1001',
    );
    expect(
      TicketPolicy.nextTicketNumber('NIT-20261125-1004', 'NIT-20261125-'),
    ).toBe('NIT-20261125-1005');
  });
});
