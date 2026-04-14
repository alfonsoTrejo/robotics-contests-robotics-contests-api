import { prisma } from "../prisma/client";
import type { Prisma } from "@prisma/client";

export class UsersRepository {
  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  findStudentByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        role: "STUDENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }
}