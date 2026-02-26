import type { Request, Response } from "express";
import { prisma } from "../prisma/client";

/**
 * Helper controller para crear usuarios fake de testing
 * SOLO debe usarse en desarrollo/testing
 */
export class DevController {
  static async createFakeStudents(req: Request, res: Response) {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ ok: false, error: { message: "Not available in production" } });
    }

    try {
      const students = await prisma.$transaction([
        prisma.user.upsert({
          where: { email: "student1@fake.test" },
          create: {
            name: "Fake Student One",
            email: "student1@fake.test",
            password: null,
            role: "STUDENT",
            authProvider: "GOOGLE",
            googleId: "fake-google-id-1",
          },
          update: {},
        }),
        prisma.user.upsert({
          where: { email: "student2@fake.test" },
          create: {
            name: "Fake Student Two",
            email: "student2@fake.test",
            password: null,
            role: "STUDENT",
            authProvider: "GOOGLE",
            googleId: "fake-google-id-2",
          },
          update: {},
        }),
        prisma.user.upsert({
          where: { email: "student3@fake.test" },
          create: {
            name: "Fake Student Three",
            email: "student3@fake.test",
            password: null,
            role: "STUDENT",
            authProvider: "GOOGLE",
            googleId: "fake-google-id-3",
          },
          update: {},
        }),
      ]);

      res.json({
        ok: true,
        data: {
          message: "Fake students created/updated",
          students: students.map((s) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            role: s.role,
          })),
        },
      });
    } catch (e) {
      res.status(500).json({ ok: false, error: { message: "Failed to create fake students" } });
    }
  }

  static async loginAsFakeStudent(req: Request, res: Response) {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ ok: false, error: { message: "Not available in production" } });
    }

    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ ok: false, error: { message: "Email required" } });
      }

      const student = await prisma.user.findUnique({
        where: { email },
      });

      if (!student || student.role !== "STUDENT") {
        return res.status(404).json({ ok: false, error: { message: "Fake student not found" } });
      }

      // Generate JWT
      const { signJwt, getCookieName } = await import("../utils/jwt");
      const token = signJwt({ userId: student.id, role: "STUDENT" });
      const cookieName = getCookieName();

      const isProd = process.env.NODE_ENV === "production";
      res.cookie(cookieName, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        path: "/",
      });

      const { password, ...safeStudent } = student;
      res.json({ ok: true, data: safeStudent });
    } catch (e) {
      res.status(500).json({ ok: false, error: { message: "Failed to login as fake student" } });
    }
  }
}
