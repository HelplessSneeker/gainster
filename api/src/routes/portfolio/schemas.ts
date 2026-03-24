import { paginationSchema, dateRangeSchema } from '../../lib/schemas.js';

export const listSnapshotsQuerySchema = dateRangeSchema.merge(paginationSchema);
