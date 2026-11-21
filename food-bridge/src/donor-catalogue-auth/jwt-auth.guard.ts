import {
  type ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { JwtAuthGuard as PassportJwtAuthGuard } from '../auth/guards/jwt.guards.js';
import { UserRole } from '../common/user-role.enum.js';
import type { AuthenticatedRequest } from './authenticated-request.type.js';

@Injectable()
export class JwtAuthGuard extends PassportJwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret) < 32) {
      throw new ServiceUnavailableException(
        'JWT authentication is unavailable.',
      );
    }

    await super.canActivate(context);
    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (
      !user ||
      !isUUID(user.userId) ||
      !Object.values(UserRole).includes(user.userRole)
    ) {
      throw new UnauthorizedException('Invalid token claims.');
    }
    return true;
  }
}
