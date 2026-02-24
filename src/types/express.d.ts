import type { AuthUser } from "./auth.types.ts";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};