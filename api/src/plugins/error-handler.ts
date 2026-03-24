import { MarketDataError, RateLimitExceededError } from '@gainster/market-data';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        statusCode: 400,
        details: error.issues,
      });
    }

    if (error instanceof RateLimitExceededError) {
      return reply.code(429).send({
        error: error.message,
        statusCode: 429,
      });
    }

    if (error instanceof MarketDataError) {
      return reply.code(502).send({
        error: error.message,
        statusCode: 502,
      });
    }

    fastify.log.error(error);
    return reply.code(500).send({
      error: 'Internal server error',
      statusCode: 500,
    });
  });
}

export default fp(errorHandlerPlugin, { name: 'error-handler' });
