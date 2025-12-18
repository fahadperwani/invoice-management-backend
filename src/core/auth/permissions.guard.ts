import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator'; // Import the key
import { JwtPayload } from '../types/core.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the request is allowed to proceed based on user permissions.
   */
  canActivate(context: ExecutionContext): boolean {
    // 1. Get the permissions required by the route handler
    // This looks for the metadata set by @RequirePermissions()
    const requiredPermissions = this.reflector.get<string[]>(
      PERMISSIONS_KEY,
      context.getHandler(),
    );

    // If no permissions are required for the route, grant access immediately.
    if (!requiredPermissions) {
      return true;
    }

    // 2. Extract the request object and user data
    const request = context.switchToHttp().getRequest();
    // The 'user' object is attached to the request by the JwtStrategy
    const user: JwtPayload = request.user;

    // Safety check: If JwtAuthGuard failed to attach a user, deny access.
    // (This is often redundant if JwtAuthGuard runs first, but is good defensive coding).
    if (!user || !user.permissions) {
      // You could throw an UnauthorizedException here, but usually, the JwtAuthGuard handles that.
      // This case handles a user object that is missing expected data.
      throw new ForbiddenException(
        'User permissions context missing or incomplete.',
      );
    }

    // 3. Check if the user has ALL the required permissions
    const hasRequiredPermissions = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasRequiredPermissions) {
      // If the user is authenticated but not authorized for this specific action
      throw new ForbiddenException(
        `Insufficient permissions. Required: [${requiredPermissions.join(', ')}]`,
      );
    }

    // 4. Grant access
    return true;
  }
}
