import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/auth.types";

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET is not set");

export function signJwt(payload: JwtPayload) {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyJwt(token: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}

export function getCookieName() {
  return process.env.COOKIE_NAME ?? "rcms_token";
}