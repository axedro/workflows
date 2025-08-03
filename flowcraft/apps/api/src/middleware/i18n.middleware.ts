import { FastifyRequest, FastifyReply } from 'fastify';
import { i18nService } from '../services/i18n.service.js';

export interface I18nRequest extends FastifyRequest {
  language: string;
  t: (key: string, params?: Record<string, any>) => Promise<string>;
}

/**
 * Middleware to detect and set the user's preferred language
 */
export async function i18nMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Detect language from various sources
  let detectedLanguage = 'es'; // Default fallback

  // 1. Check query parameter (?lang=en)
  const queryLang = (request.query as any)?.lang;
  if (queryLang && ['es', 'en', 'nl'].includes(queryLang)) {
    detectedLanguage = queryLang;
  } else {
    // 2. Check Accept-Language header
    const acceptLanguage = request.headers['accept-language'];
    detectedLanguage = i18nService.detectLanguageFromHeader(acceptLanguage);
  }

  // 3. TODO: Check user preference from database if authenticated
  // const user = (request as any).user;
  // if (user && user.languagePreference) {
  //   detectedLanguage = user.languagePreference;
  // }

  // Set language on request object
  (request as I18nRequest).language = detectedLanguage;

  // Add translation helper function
  (request as I18nRequest).t = async (
    key: string,
    params?: Record<string, any>
  ) => {
    let translation = await i18nService.getTranslation(key, detectedLanguage);

    // Simple interpolation support
    if (params) {
      Object.keys(params).forEach(param => {
        const placeholder = `{{${param}}}`;
        translation = translation.replace(
          new RegExp(placeholder, 'g'),
          String(params[param])
        );
      });
    }

    return translation;
  };

  // Set language header in response
  reply.header('Content-Language', detectedLanguage);
}

/**
 * Plugin to register the i18n middleware globally
 */
export async function i18nPlugin(fastify: any) {
  // Register the middleware for all routes
  fastify.addHook('preHandler', i18nMiddleware);

  // Add type augmentation for TypeScript
  fastify.decorateRequest('language', '');
  fastify.decorateRequest('t', null);
}
