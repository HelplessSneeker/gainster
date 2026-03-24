import type { DrizzleDb } from '@gainster/db';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import '../lib/types.js';

export interface DbPluginOptions {
  db: DrizzleDb;
}

async function dbPlugin(fastify: FastifyInstance, options: DbPluginOptions) {
  fastify.decorate('db', options.db);
}

export default fp(dbPlugin, { name: 'db' });
