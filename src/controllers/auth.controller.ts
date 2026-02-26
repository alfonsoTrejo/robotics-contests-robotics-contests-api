import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { getCookieName } from "../utils/jwt";

const service = new AuthService();

function setAuthCookie(res: Response, token: string) {
  const cookieName = getCookieName();

  // Ajusta secure en prod si usas https
  const isProd = process.env.NODE_ENV === "production";

  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
  });
}

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await service.registerAdmin(req.body);
      setAuthCookie(res, token);
      res.status(201).json({ ok: true, data: user });
    } catch (e) {
      next(e);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await service.loginAdmin(req.body);
      setAuthCookie(res, token);
      res.json({ ok: true, data: user });
    } catch (e) {
      next(e);
    }
  }

  static async google(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await service.loginStudentWithGoogle(req.body);
      setAuthCookie(res, token);
      res.json({ ok: true, data: user });
    } catch (e) {
      next(e);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ ok: false, error: { message: "Unauthorized" } });
      }
      const user = await service.me(req.user.userId);
      res.json({ ok: true, data: user });
    } catch (e) {
      next(e);
    }
  }

  static async logout(_req: Request, res: Response) {
    const cookieName = getCookieName();
    res.clearCookie(cookieName, { path: "/" });
    res.json({ ok: true, data: { loggedOut: true } });
  }
}