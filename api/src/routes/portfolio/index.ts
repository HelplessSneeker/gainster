import type { FastifyInstance } from 'fastify';
import {
  listSnapshotsHandler,
  getCurrentSnapshotHandler,
  createSnapshotHandler,
} from './handlers.js';

export default async function portfolioRoutes(fastify: FastifyInstance) {
  fastify.get('/snapshots', listSnapshotsHandler);
  fastify.get('/current', getCurrentSnapshotHandler);
  fastify.post('/snapshots', createSnapshotHandler);
}
