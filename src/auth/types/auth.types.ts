export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
}

export interface RegisterTenantResponse {
  user: AuthUser;
  organization: OrganizationSummary;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  orgId: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}
