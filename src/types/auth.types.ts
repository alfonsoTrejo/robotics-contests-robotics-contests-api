export type JwtPayload = {
  userId: string;
  role: "ADMIN" | "STUDENT";
};

export type AuthUser = JwtPayload;