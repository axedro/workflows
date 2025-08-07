import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { i18nService } from '../services/i18n.service.js';

interface GetTranslationsParams {
  language: string;
  namespace?: string;
}

// interface UpsertTranslationBody {
//   key: string;
//   value: string;
//   approved?: boolean;
// }

interface BulkLoadTranslationsBody {
  namespace: string;
  language: string;
  translations: Record<string, string>;
}

export async function i18nRoutes(fastify: FastifyInstance) {
  // Get all active languages
  fastify.get(
    '/languages',
    {
      schema: {
        description: 'Get all active languages',
        tags: ['i18n'],
        response: {
          200: {
            type: 'object',
            properties: {
              languages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    code: { type: 'string' },
                    name: { type: 'string' },
                    nativeName: { type: 'string' },
                    flagEmoji: { type: 'string' },
                    isActive: { type: 'boolean' },
                    isDefault: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const languages = await i18nService.getLanguages();
        return { languages };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch languages',
        });
      }
    }
  );

  // Get translations for a specific language
  fastify.get(
    '/translations/:language',
    {
      schema: {
        description: 'Get translations for a specific language',
        tags: ['i18n'],
        params: {
          type: 'object',
          required: ['language'],
          properties: {
            language: { type: 'string', minLength: 2, maxLength: 5 },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            namespace: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              namespace: { type: 'string' },
              translations: {
                type: 'object',
                additionalProperties: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: GetTranslationsParams;
        Querystring: { namespace?: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { language } = request.params;
        const { namespace } = request.query;

        const translations = await i18nService.getTranslations(
          language,
          namespace
        );

        return {
          language,
          namespace: namespace || 'all',
          translations,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch translations',
        });
      }
    }
  );

  // Get translations for a specific language and namespace
  fastify.get(
    '/translations/:language/:namespace',
    {
      schema: {
        description: 'Get translations for a specific language and namespace',
        tags: ['i18n'],
        params: {
          type: 'object',
          required: ['language', 'namespace'],
          properties: {
            language: { type: 'string', minLength: 2, maxLength: 5 },
            namespace: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              namespace: { type: 'string' },
              translations: {
                type: 'object',
                additionalProperties: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { language: string; namespace: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { language, namespace } = request.params;

        const translations = await i18nService.getTranslations(
          language,
          namespace
        );

        return {
          language,
          namespace,
          translations,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch translations',
        });
      }
    }
  );

  // Get single translation with fallback
  fastify.get(
    '/translation/:language/:key',
    {
      schema: {
        description: 'Get a single translation with fallback support',
        tags: ['i18n'],
        params: {
          type: 'object',
          required: ['language', 'key'],
          properties: {
            language: { type: 'string', minLength: 2, maxLength: 5 },
            key: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
              language: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { language: string; key: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { language, key } = request.params;

        const value = await i18nService.getTranslation(key, language);

        return {
          key,
          value,
          language,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch translation',
        });
      }
    }
  );

  // Detect language from Accept-Language header
  fastify.get(
    '/detect-language',
    {
      schema: {
        description: 'Detect preferred language from Accept-Language header',
        tags: ['i18n'],
        response: {
          200: {
            type: 'object',
            properties: {
              detectedLanguage: { type: 'string' },
              supportedLanguages: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const acceptLanguage = request.headers['accept-language'];
        const detectedLanguage =
          i18nService.detectLanguageFromHeader(acceptLanguage);

        return {
          detectedLanguage,
          supportedLanguages: ['es', 'en', 'nl'],
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to detect language',
        });
      }
    }
  );

  // Protected routes (require authentication)

  // Create or update translation (admin only)
  fastify.put(
    '/translations/:language',
    {
      preValidation: [fastify.authenticate],
      schema: {
        description: 'Create or update a translation (admin only)',
        tags: ['i18n'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['language'],
          properties: {
            language: { type: 'string', minLength: 2, maxLength: 5 },
          },
        },
        body: {
          type: 'object',
          required: ['key', 'value'],
          properties: {
            key: { type: 'string', minLength: 1 },
            value: { type: 'string' },
            approved: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: any, reply: FastifyReply) => {
      try {
        const { language } = request.params;
        const { key, value, approved = false } = request.body;
        const user = (request as any).user;

        // Check if user is admin (you might want to adjust this logic)
        if (user.role !== 'ADMIN') {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Admin access required',
          });
        }

        await i18nService.upsertTranslation(
          language,
          key,
          value,
          approved ? user.userId : undefined
        );

        return {
          success: true,
          message: 'Translation updated successfully',
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to update translation',
        });
      }
    }
  );

  // Invalidate cache (admin only)
  fastify.delete(
    '/cache',
    {
      preValidation: [fastify.authenticate],
      schema: {
        description: 'Invalidate translation cache (admin only)',
        tags: ['i18n'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            namespace: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: any, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const { language, namespace } = request.query;

        // Check if user is admin
        if (user.role !== 'ADMIN') {
          return reply.status(403).send({
            error: 'Forbidden',
            message: 'Admin access required',
          });
        }

        await i18nService.invalidateCache(language, namespace);

        return {
          success: true,
          message: 'Cache invalidated successfully',
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to invalidate cache',
        });
      }
    }
  );

  // Bulk load translations (admin only)
  fastify.post(
    '/translations',
    {
      schema: {
        description: 'Bulk load translations for a namespace and language',
        tags: ['i18n'],
        body: {
          type: 'object',
          required: ['namespace', 'language', 'translations'],
          properties: {
            namespace: { type: 'string' },
            language: { type: 'string' },
            translations: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              count: { type: 'number' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: BulkLoadTranslationsBody;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { namespace, language, translations } = request.body;

        // Load translations into the database
        const count = await i18nService.bulkLoadTranslations(
          namespace,
          language,
          translations
        );

        return {
          success: true,
          message: 'Translations loaded successfully',
          count,
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to load translations',
        });
      }
    }
  );
}
