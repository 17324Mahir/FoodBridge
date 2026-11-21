import type { Request } from 'express';
import type { AuthUser } from '../common/current-user.decorator.js';

export type AuthenticatedRequest = Request & { user: AuthUser };
