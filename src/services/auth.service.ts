import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { UsersRepository } from "../repositories/users.repository";
import { signJwt } from "../utils/jwt";

type RegisterAdminDTO = {
  name: string;
  email: string;
  password: string;
};

type LoginDTO = {
  email: string;
  password: string;
};

type GoogleLoginDTO = {
  id_token: string;
};

export class AuthService {
  private googleClient: OAuth2Client;

  constructor(private usersRepo = new UsersRepository()) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not set");
    this.googleClient = new OAuth2Client(clientId);
  }

  async registerAdmin(dto: RegisterAdminDTO) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.usersRepo.findByEmail(email);
    if (existing) {
      const err = new Error("Email already exists");
      (err as any).statusCode = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersRepo.create({
      name: dto.name.trim(),
      email,
      password: passwordHash,
      role: "ADMIN",
      authProvider: "LOCAL",
      googleId: null,
    });

    const token = signJwt({ userId: user.id, role: "ADMIN" });

    return {
      user: this.safeUser(user),
      token,
    };
  }

  async loginAdmin(dto: LoginDTO) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepo.findByEmail(email);

    if (!user) {
      const err = new Error("Invalid credentials");
      (err as any).statusCode = 400;
      throw err;
    }

    // regla: admin solo local
    if (user.role !== "ADMIN" || user.authProvider !== "LOCAL") {
      const err = new Error("Admins must login with email/password");
      (err as any).statusCode = 400;
      throw err;
    }

    if (!user.password) {
      const err = new Error("Invalid credentials");
      (err as any).statusCode = 400;
      throw err;
    }

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      const err = new Error("Invalid credentials");
      (err as any).statusCode = 400;
      throw err;
    }

    const token = signJwt({ userId: user.id, role: "ADMIN" });

    return {
      user: this.safeUser(user),
      token,
    };
  }

  async loginStudentWithGoogle(dto: GoogleLoginDTO) {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.id_token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      const err = new Error("Invalid Google token");
      (err as any).statusCode = 400;
      throw err;
    }

    const googleId = payload.sub;
    const email = payload.email.trim().toLowerCase();
    const name = (payload.name || payload.email.split("@")[0]).trim();

    const existing = await this.usersRepo.findByEmail(email);

    // Si existe y es ADMIN → prohibido (regla #8)
    if (existing && existing.role === "ADMIN") {
      const err = new Error("Admins cannot use Google login");
      (err as any).statusCode = 400;
      throw err;
    }

    let user = existing;

    if (!user) {
      user = await this.usersRepo.create({
        name,
        email,
        password: null,
        role: "STUDENT",
        authProvider: "GOOGLE",
        googleId,
      });
    } else {
      // si ya existía como student, asegúrate de que quede como GOOGLE
      if (user.authProvider !== "GOOGLE") {
        user = await this.usersRepo.update(user.id, {
          authProvider: "GOOGLE",
          googleId,
          password: null,
        });
      } else if (!user.googleId) {
        user = await this.usersRepo.update(user.id, { googleId });
      }
    }

    const token = signJwt({ userId: user.id, role: "STUDENT" });

    return {
      user: this.safeUser(user),
      token,
    };
  }

  async me(userId: string) {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      const err = new Error("User not found");
      (err as any).statusCode = 404;
      throw err;
    }
    return this.safeUser(user);
  }

  private safeUser(user: any) {
    const { password, ...safe } = user;
    return safe;
  }
}