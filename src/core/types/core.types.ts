export type JwtPayload = {
  sub: string;
  email: string;
  orgId: string;
  permissions: string[];
};

export interface AuthenticatedRequest extends Request {
  token: string;
  payload: JwtPayload;
}
