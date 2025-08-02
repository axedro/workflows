import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import rateLimit from '@fastify/rate-limit';
import { authService, loginSchema, registerSchema, refreshTokenSchema } from '../services/auth.service.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Apply rate limiting specifically to auth routes
  await fastify.register(rateLimit, {
    keyGenerator: (request) => request.ip,
    max: 10, // 10 attempts per window (reasonable for auth)
    timeWindow: '15 minutes',
    errorResponseBuilder: (request, context) => ({
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.round(context.ttl / 1000),
    }),
  });

  // Register
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 2 },
          organizationName: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                organizationId: { type: 'string' },
                createdAt: { type: 'string' },
                organization: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    plan: { type: 'string' },
                  },
                },
              },
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = registerSchema.parse(request.body);
      const result = await authService.register(data);
      
      return reply.status(201).send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }
      
      if (error instanceof Error) {
        if (error.message === 'User already exists') {
          return reply.status(409).send({
            error: 'Conflict',
            message: error.message,
          });
        }
      }
      
      throw error;
    }
  });

  // Login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                organizationId: { type: 'string' },
                organization: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    plan: { type: 'string' },
                  },
                },
              },
            },
            tokens: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = loginSchema.parse(request.body);
      const result = await authService.login(data);
      
      return reply.send(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }
      
      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: error.message,
          });
        }
      }
      
      throw error;
    }
  });

  // Refresh Token
  fastify.post('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = refreshTokenSchema.parse(request.body);
      const tokens = await authService.refreshToken(data.refreshToken);
      
      return reply.send(tokens);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid input data',
          details: error.errors,
        });
      }
      
      if (error instanceof Error) {
        if (error.message === 'Invalid refresh token') {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: error.message,
          });
        }
      }
      
      throw error;
    }
  });

  // Forgot Password
  fastify.post('/forgot-password', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = request.body as { email: string };
      await authService.forgotPassword(email);
      
      return reply.send({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      throw error;
    }
  });

  // Reset Password
  fastify.post('/reset-password', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { token, newPassword } = request.body as { token: string; newPassword: string };
      await authService.resetPassword(token, newPassword);
      
      return reply.send({
        message: 'Password has been reset successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid or expired reset token') {
          return reply.status(400).send({
            error: 'Bad Request',
            message: error.message,
          });
        }
      }
      
      throw error;
    }
  });

  // Change Password (requires authentication)
  fastify.post('/change-password', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { currentPassword, newPassword } = request.body as { currentPassword: string; newPassword: string };
      const user = (request as any).user;
      
      await authService.changePassword(user.userId, currentPassword, newPassword);
      
      return reply.send({
        message: 'Password changed successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Current password is incorrect') {
          return reply.status(400).send({
            error: 'Bad Request',
            message: error.message,
          });
        }
      }
      
      throw error;
    }
  });

  // Logout (client-side token invalidation)
  fastify.post('/logout', {
    preHandler: [fastify.authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return a success message
    return reply.send({
      message: 'Logged out successfully',
    });
  });
} 