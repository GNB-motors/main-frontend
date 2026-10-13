/**
 * Zod validation for GET /api/whatsapp/admin/drafts (main-backend
 * whatsapp.admin.routes.js). Permissive: drafts pass through as-is; only the
 * paging envelope and the KPI summary are typed. Older backends answer without
 * page/totalPages/summary, which stay optional.
 */
import { z } from 'zod';
import { num } from './primitives.js';

const draftSummarySchema = z
  .object({
    totalCount: num,
    totalLitres: num,
    totalAmount: num,
    pendingCount: num,
    pendingAmount: num,
    missingOdoCount: num,
    rateAnomaliesCount: num,
  })
  .passthrough();

export const draftListSchema = z
  .object({
    items: z.array(z.object({ _id: z.string() }).passthrough()),
    total: num,
    page: num,
    limit: num,
    totalPages: num,
    summary: draftSummarySchema.nullish(),
  })
  .passthrough();
