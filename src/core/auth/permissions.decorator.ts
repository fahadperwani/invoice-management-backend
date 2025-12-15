import { SetMetadata } from '@nestjs/common';

// Key used to store permissions metadata
export const PERMISSIONS_KEY = 'permissions';
// Custom decorator to apply permission checks to a route
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
