/**
 * Zod validation for the report e-mail API (PR C ↔ PR D).
 *
 * Permissive by design (see schemas/primitives.js): a hand-written response
 * schema always lags the API a little, and a strict parse would turn that lag
 * into a failed request for the owner.
 */
import { z } from 'zod';
import { str, num } from './primitives.js';

/** POST /api/report-email/send and GET /api/report-email/:id. */
export const reportEmailStatusSchema = z
  .object({
    id: str,
    status: str,
    delivery: str,
    filename: str,
    sizeBytes: num,
    to: z.array(z.string()).nullish(),
    sentAt: str,
    error: str,
  })
  .passthrough();

/** GET and PATCH /api/email-report-settings. */
export const emailReportSettingsSchema = z
  .object({
    daily: z.boolean().nullish(),
    weekly: z.boolean().nullish(),
    recipients: z.array(z.string()).nullish(),
    defaultRecipients: z.array(z.string()).nullish(),
    serverEnabled: z.boolean().nullish(),
    emailConfigured: z.boolean().nullish(),
    sendTimeIst: str,
    weeklyDay: str,
    updatedAt: str,
  })
  .passthrough();
