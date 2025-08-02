import { FastifyInstance } from 'fastify';

export async function setupRateLimit(fastify: FastifyInstance) {
  // Register rate limit plugin
  await fastify.register(import('@fastify/rate-limit'), {
    global: false,
    max: 100,
    timeWindow: '1 minute',
  });

  // Apply rate limiting to auth routes
  fastify.addHook('onRoute', (routeOptions) => {
    if (routeOptions.url?.startsWith('/auth')) {
      routeOptions.config = {
        ...routeOptions.config,
        rateLimit: {
          max: 5,
          timeWindow: '15 minutes',
          errorResponseBuilder: (request, context) => ({
            error: 'Too Many Requests',
            message: 'Too many authentication attempts. Please try again later.',
            retryAfter: Math.round(context.ttl / 1000),
          }),
        },
      };
    }
  });
} 