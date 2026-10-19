/**
 * Zod schemas for the support-ticket API (/api/support-tickets and
 * /api/admin/support-tickets). Permissive like the other response schemas (see
 * primitives.js): known fields typed, nulls accepted, unknown fields passed
 * through. The admin routes return the same ticket shape plus org/requester
 * detail, which passthrough() keeps.
 */
import { z } from 'zod';
import { str, num, ref, listMeta } from './primitives.js';

const status = z.enum(['OPEN', 'AWAITING_CUSTOMER', 'SOLVED']);

const attachment = z
  .object({ id: z.string(), name: str, mimeType: str, size: num, url: str, uploadedAt: str })
  .passthrough();

const message = z
  .object({
    _id: z.string(),
    kind: z.enum(['REPLY', 'STATUS']).nullish(),
    authorType: z.enum(['ORG', 'SUPPORT']),
    author: z.object({ name: str, role: str }).passthrough().nullish(),
    body: str,
    attachments: z.array(attachment).default([]),
    statusChange: z.object({ from: status, to: status }).nullish(),
    createdAt: str,
  })
  .passthrough();

const requester = z.object({ userId: str, name: str, email: str, role: str }).passthrough();

export const supportTicketRowSchema = z
  .object({
    _id: z.string(),
    ticketNumber: z.string(),
    subject: str,
    category: str,
    priority: str,
    status,
    requester: requester.nullish(),
    vehicleId: ref,
    messageCount: num,
    lastActivityAt: str,
    lastActivityBy: str,
    unreadForOrg: z.boolean().nullish(),
    unreadForSupport: z.boolean().nullish(),
    solvedAt: str,
    purgeAt: str,
    purgedAt: str,
    createdAt: str,
  })
  .passthrough();

export const supportTicketListSchema = z
  .object({ items: z.array(supportTicketRowSchema).default([]), pagination: listMeta })
  .passthrough();

export const supportTicketSchema = supportTicketRowSchema
  .extend({
    description: str,
    attachments: z.array(attachment).default([]),
    messages: z.array(message).default([]),
  })
  .passthrough();

export const supportSummarySchema = z
  .object({
    open: num,
    awaitingCustomer: num,
    solved: num,
    unread: num,
    all: num,
    purgeAfterDays: num,
  })
  .passthrough();

export const supportByOrgSchema = z.array(
  z
    .object({
      orgId: z.string(),
      companyName: str,
      open: num,
      awaitingCustomer: num,
      solved: num,
      unread: num,
      all: num,
      lastActivityAt: str,
    })
    .passthrough(),
);
