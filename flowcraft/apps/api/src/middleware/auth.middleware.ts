import { FastifyRequest, FastifyReply } from 'fastify';
import { authService, UserPayload } from '../services/auth.service.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user: UserPayload;
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const user = await authService.validateToken(token);
    
    (request as AuthenticatedRequest).user = user;
  } catch (error) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

export async function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    
    const user = (request as AuthenticatedRequest).user;
    
    if (!roles.includes(user.role)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
}

export async function requireOrganization(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  
  const user = (request as AuthenticatedRequest).user;
  
  if (!user.organizationId) {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'User must belong to an organization',
    });
  }
}

export async function optionalAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.validateToken(token);
      (request as AuthenticatedRequest).user = user;
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
  }
} 